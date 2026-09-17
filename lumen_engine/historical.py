"""Ridge POC adapter. Training uses sklearn; inference is deterministic JSON + math."""
from dataclasses import dataclass
from datetime import date, timedelta
from typing import Protocol
import csv
import io
import math
from pathlib import Path
from .contracts import (ContractError, Declaration, Parameter, declaration, digest, decode, snapshot)

RIDGE_VERSION = 'ridge-log-calendar-panel/1.0.0'
COUNTRIES = {'Netherlands', 'Denmark', 'Sweden'}

@dataclass(frozen=True)
class Observation:
    week: str
    country: str
    channel: str
    units: float

@dataclass(frozen=True)
class ModelArtifact:
    model_version: str
    target: str
    training_sha256: str
    epoch: str
    origin: str
    train_weeks: int
    series: tuple[str, ...]
    feature_names: tuple[str, ...]
    means: tuple[float, ...]
    scales: tuple[float, ...]
    coefficients: tuple[float, ...]
    intercept: float
    libraries: dict[str, str]

@dataclass(frozen=True)
class ForecastPoint:
    week: str
    series: str
    units: float
    seasonal_factor: float | None

@dataclass(frozen=True)
class HistoricalForecast:
    model_version: str
    artifact_sha256: str
    origin: str
    horizon_weeks: int
    points: tuple[ForecastPoint, ...]
    warnings: tuple[str, ...]

class Forecaster(Protocol):
    def fit(self, observations: tuple[Observation, ...], origin: str) -> ModelArtifact: ...
    def predict(self, artifact: ModelArtifact, horizon: int) -> HistoricalForecast: ...


def read_sales(path: str | Path) -> tuple[Observation, ...]:
    """Only date/country/channel/units are loaded, never survey identifiers."""
    text = Path(path).read_text().replace('\\r\\n', '\n')
    rows = csv.DictReader(io.StringIO(text))
    return tuple(Observation(r['week_start_date'], r['country'], r['channel'], float(r['units_sold'])) for r in rows)


def training_panel(observations, origin, minimum=26):
    try:
        cutoff = date.fromisoformat(origin)
    except ValueError as e:
        raise ContractError('invalid forecast origin') from e
    if cutoff.weekday() != 0:
        raise ContractError('forecast origin must be Monday')
    unique = {}
    for row in observations:
        if row.week >= origin:
            continue  # never inspect future targets/covariates
        try:
            day = date.fromisoformat(row.week)
        except ValueError as e:
            raise ContractError('invalid historical date') from e
        if day.weekday() != 0 or row.country not in COUNTRIES or not row.channel or not math.isfinite(row.units) or row.units <= 0:
            raise ContractError('historical domain: positive units, NL/DK/SE, weekly Monday')
        key = (row.week, row.country+'|'+row.channel)
        if key in unique and unique[key].units != row.units:
            raise ContractError('conflicting historical duplicate')
        unique[key] = row
    if not unique:
        raise ContractError('no historical data; no silent German fallback')
    dates = sorted({key[0] for key in unique})
    series = tuple(sorted({key[1] for key in unique}))
    if len(dates) < minimum:
        raise ContractError('Ridge requires at least 26 weeks; explicitly choose a baseline instead')
    start = date.fromisoformat(dates[0])
    if [date.fromisoformat(x) for x in dates] != [start+timedelta(weeks=i) for i in range(len(dates))] or date.fromisoformat(dates[-1])+timedelta(weeks=1) != cutoff:
        raise ContractError('training calendar must be complete up to origin')
    if len(unique) != len(dates)*len(series):
        raise ContractError('incomplete training panel')
    rows = tuple(unique[k] for k in sorted(unique))
    return rows, dates, series


def feature_row(t, key, series):
    return (t/52, math.sin(2*math.pi*t/52), math.cos(2*math.pi*t/52), *(float(key == s) for s in series))


class RidgeForecaster:
    def fit(self, observations, origin):
        import numpy as np
        import sklearn
        from sklearn.linear_model import Ridge
        from sklearn.preprocessing import StandardScaler
        rows, dates, series = training_panel(observations, origin)
        indices = {x: i for i, x in enumerate(dates)}
        # Match POC learned-model row eligibility, excluding first date.
        train = [r for r in rows if indices[r.week] > 0]
        x = np.array([feature_row(indices[r.week], r.country+'|'+r.channel, series) for r in train])
        scaler = StandardScaler().fit(x)
        model = Ridge(alpha=1.).fit(scaler.transform(x), np.log([r.units for r in train]))
        return ModelArtifact(RIDGE_VERSION, 'can/week/country/channel', digest([snapshot(r) for r in rows]), dates[0], origin,
            len(dates), series, ('trend', 'sin', 'cos', *series), tuple(scaler.mean_), tuple(scaler.scale_),
            tuple(model.coef_), float(model.intercept_), {'numpy': np.__version__, 'sklearn': sklearn.__version__})

    def predict(self, artifact, horizon):
        artifact = decode(ModelArtifact, snapshot(artifact))
        if artifact.model_version != RIDGE_VERSION:
            raise ContractError('unsupported model version; use its registered adapter')
        if type(horizon) is not int or not 1 <= horizon <= 53:
            raise ContractError('historical horizon: 1..53 weeks only; 53 is calendar coverage, not validated')
        dim = 3+len(artifact.series)
        if not artifact.series or any(len(v) != dim for v in (artifact.feature_names, artifact.means, artifact.scales, artifact.coefficients)) or any(s <= 0 for s in artifact.scales):
            raise ContractError('invalid artifact dimensions/scales')
        if len(set(artifact.series)) != len(artifact.series) or any(key.split('|')[0] not in COUNTRIES or '|' not in key for key in artifact.series):
            raise ContractError('artifact series must be unique historical NL/DK/SE series')
        if artifact.feature_names != ('trend', 'sin', 'cos', *artifact.series):
            raise ContractError('incompatible feature order')
        epoch, origin = date.fromisoformat(artifact.epoch), date.fromisoformat(artifact.origin)
        if (origin-epoch).days != artifact.train_weeks*7:
            raise ContractError('artifact epoch/origin mismatch')
        points = []
        for i in range(horizon):
            t = artifact.train_weeks+i
            for key in artifact.series:
                x = feature_row(t, key, artifact.series)
                contributions = tuple(b*(v-m)/s for b,v,m,s in zip(artifact.coefficients, x, artifact.means, artifact.scales))
                try:
                    units = math.exp(artifact.intercept+sum(contributions))
                    seasonal = math.exp(contributions[1]+contributions[2])
                except OverflowError as e:
                    raise ContractError('forecast overflow: extrapolation inadmissible') from e
                if not math.isfinite(units) or not math.isfinite(seasonal):
                    raise ContractError('non-finite forecast')
                points.append(ForecastPoint((origin+timedelta(weeks=i)).isoformat(), key, units, seasonal))
        return HistoricalForecast(RIDGE_VERSION, digest(artifact), artifact.origin, horizon, tuple(points),
            ('Provisional NL/DK/SE reference only; no German accuracy.',
             'exp(log Q), no retransformation correction; trend extrapolation.',
             'Annual/53-week horizons exploratory; no calibrated prediction interval.'))


def calendarize(forecast, series_key, launch, *, seasonal=False):
    """Uniform daily allocation; require every day. Returns values and excluded units."""
    from .commercial import month_starts
    months = month_starts(launch, 12)
    first = date.fromisoformat(launch)
    end = date(first.year+1, first.month, 1)
    daily = {}
    excluded = 0.
    for point in forecast.points:
        if point.series != series_key:
            continue
        week = date.fromisoformat(point.week)
        value = point.seasonal_factor if seasonal else point.units/7
        if value is None or not math.isfinite(value) or value < 0:
            raise ContractError('invalid weekly forecast value')
        for i in range(7):
            day = week+timedelta(days=i)
            if day in daily:
                raise ContractError('overlapping forecast weeks')
            daily[day] = value
            if not first <= day < end:
                excluded += value
    totals, counts = {m[:7]: 0. for m in months}, {m[:7]: 0 for m in months}
    day = first
    while day < end:
        if day not in daily:
            raise ContractError('forecast does not cover all calendar days; no silent padding')
        totals[day.isoformat()[:7]] += daily[day]
        counts[day.isoformat()[:7]] += 1
        day += timedelta(days=1)
    values = tuple(totals[m[:7]]/counts[m[:7]] if seasonal else totals[m[:7]] for m in months)
    return values, excluded


def german_season_profile(forecast, series_key, launch, acceptance: Declaration):
    """Transfer seasonal component ONLY: removes level and trend, requires consent."""
    if forecast.model_version != RIDGE_VERSION:
        raise ContractError('adapter does not expose a separated seasonal component')
    if declaration(acceptance, 'season_transfer').status != 'ok':
        raise ContractError('season transfer must be explicitly accepted')
    values, _ = calendarize(forecast, series_key, launch, seasonal=True)
    mean = sum(values)/12
    if mean <= 0:
        raise ContractError('positive seasonal mean required')
    result = [None]*12
    month = date.fromisoformat(launch).month
    for i, value in enumerate(values):
        result[(month-1+i)%12] = Parameter(value/mean, 'ratio', 'ASSUMPTION',
            f'{acceptance.source}; {acceptance.text}; artifact={forecast.artifact_sha256}; series={series_key}; uniform daily, equal-month normalization, no level/trend', True)
    return tuple(result)


def baseline_forecast(observations, origin, horizon, method, reason):
    """Explicit user-selected fallback, never automatically substituted on failure."""
    if method not in ('last', 'seasonal52') or not reason.strip() or type(horizon) is not int or not 1 <= horizon <= 53:
        raise ContractError('explicit baseline method/reason and horizon 1..53 required')
    rows, dates, series = training_panel(observations, origin, minimum=1)
    lookup = {(r.week,r.country+'|'+r.channel):r.units for r in rows}
    points=[]
    for i in range(horizon):
        week=date.fromisoformat(origin)+timedelta(weeks=i)
        reference=dates[-1] if method == 'last' else (week-timedelta(weeks=52)).isoformat()
        for key in series:
            if (reference,key) not in lookup:
                raise ContractError('seasonal baseline reference missing; no recursive padding')
            points.append(ForecastPoint(week.isoformat(),key,lookup[(reference,key)],None))
    version=method+'/1.0.0'
    return HistoricalForecast(version,digest({'training':[snapshot(r) for r in rows],'method':version,'origin':origin}),origin,horizon,tuple(points),
        ('Explicit unqualified historical fallback: '+reason,'No German accuracy; no isolated seasonal factor available.'))
