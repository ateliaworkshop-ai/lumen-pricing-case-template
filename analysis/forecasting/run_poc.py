"""Reproducible fixed-origin forecasts; run from any working directory."""
from pathlib import Path
import hashlib
import json
import platform
import numpy as np
import pandas as pd
import sklearn
from sklearn.linear_model import Ridge
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent

def read_csv(name):
    # Case exports contain literal escaped CR/LF; do not modify originals.
    from io import StringIO
    return pd.read_csv(StringIO((ROOT/'data'/name).read_text().replace('\\r\\n', '\n')))

raw = read_csv('historical_sales_weekly.csv')
d = raw.drop_duplicates().copy()
d['date'] = pd.to_datetime(d.week_start_date)
d['series'] = d.country + '|' + d.channel
dates = sorted(d.date.unique())
d['t'] = d.date.map(dict(zip(dates, range(len(dates)))))
assert len(raw) == 706 and len(d) == 702
assert not d.duplicated(['t', 'series']).any()
assert d.groupby('series').size().eq(78).all() and d.units_sold.gt(0).all()
d = d.sort_values(['series', 't'])
d['price_lag'] = (d.revenue_eur/d.units_sold).groupby(d.series).shift(1)
d['promo_lag'] = d.groupby('series').promo_active.shift(1).astype(float)
season = read_csv('seasonality_and_weather.csv').set_index('month').seasonality_index_100_avg
d['S'] = d.date.dt.month.map(season) / season.mean()

def features(frame, mode):
    x = pd.DataFrame({'trend': frame.t.to_numpy()/52})
    if mode != 'no_season':
        x['sin'] = np.sin(2*np.pi*frame.t.to_numpy()/52)
        x['cos'] = np.cos(2*np.pi*frame.t.to_numpy()/52)
    for key in sorted(d.series.unique()):
        x[key] = (frame.series == key).to_numpy().astype(float)
    if mode == 'no_channel':
        x = x[['trend','sin','cos']].copy()
        for country in sorted(d.country.unique()):
            x[country] = (frame.country == country).to_numpy().astype(float)
    if mode in ('price', 'promo'):
        x[mode] = frame[mode+'_lag'].to_numpy()
    return x

MODELS = ['last', 'seasonal52', 'ridge', 'ridge_no_season', 'ridge_no_channel',
          'ridge_price', 'ridge_promo', 'rf', 'index_trend']

def predict(train, future, name):
    if name == 'last':
        return future.series.map(train.groupby('series').units_sold.last()).to_numpy()
    if name == 'seasonal52':
        if train.t.max() < 51:
            return None
        lookup = train.set_index(['series','t']).units_sold
        return np.array([lookup.loc[(s, t-52)] for s,t in zip(future.series, future.t)])
    if name == 'index_trend':
        # Explicit external-profile assumption, not seasonality learned from sales.
        result = np.zeros(len(future))
        for s in train.series.unique():
            a = train[train.series == s]
            mask = (future.series == s).to_numpy()
            slope, intercept = np.polyfit(a.t, a.units_sold/a.S, 1)
            result[mask] = (intercept+slope*future.loc[mask, 't'])*future.loc[mask, 'S']
        return np.maximum(0, result)
    mode = name.removeprefix('ridge_') if name.startswith('ridge_') else 'full'
    a = train[train.t > 0].copy()  # same training rows for all learned comparisons
    b = future.copy()
    for col in ['price_lag', 'promo_lag']:
        # Future covariates use latest known observation, never test actuals.
        latest = train.groupby('series').tail(1).set_index('series')
        vals = latest.revenue_eur/latest.units_sold if col == 'price_lag' else latest.promo_active.astype(float)
        b[col] = b.series.map(vals)
    model = (RandomForestRegressor(n_estimators=200, max_depth=6, min_samples_leaf=5,
                                  random_state=263317, n_jobs=1) if name == 'rf'
             else make_pipeline(StandardScaler(), Ridge(alpha=1.0)))
    model.fit(features(a, mode), np.log(a.units_sold))
    return np.maximum(0, np.exp(model.predict(features(b, mode))))

records = []
for sensitivity in ['all', 'exclude_spike_train']:
    for origin, horizons in [(26,[13,26,52]), (52,[13,26]), (65,[13])]:
        train = d[d.t < origin].copy()
        if sensitivity != 'all':
            train = train[train.date != pd.Timestamp('2025-07-28')]
        for horizon in horizons:
            test = d[(d.t >= origin) & (d.t < origin+horizon)].copy()
            assert train.t.max() < test.t.min()
            for model in MODELS:
                if sensitivity != 'all' and model not in ['ridge','rf','index_trend']:
                    continue
                pred = predict(train, test, model)
                if pred is None:
                    continue
                assert len(pred) == len(test) and np.isfinite(pred).all()
                for row, p in zip(test.itertuples(), pred):
                    records.append(dict(sensitivity=sensitivity, origin=origin, horizon=horizon,
                        model=model, date=str(row.date.date()), country=row.country, channel=row.channel,
                        actual=row.units_sold, prediction=float(p)))
predictions = pd.DataFrame(records)
predictions.to_csv(OUT/'predictions.csv',index=False)

def metrics(g):
    e = g.prediction-g.actual
    return dict(n=len(g), MAE=np.abs(e).mean(), RMSE=np.sqrt((e**2).mean()),
                MAPE=100*(np.abs(e)/g.actual).mean(), WAPE=100*np.abs(e).sum()/g.actual.sum(),
                bias_pct=100*e.sum()/g.actual.sum())

for label, keys in [('metrics', ['sensitivity','origin','horizon','model']),
                    ('metrics_by_channel',['sensitivity','origin','horizon','model','channel']),
                    ('metrics_by_country',['sensitivity','origin','horizon','model','country'])]:
    rows=[]
    for key,g in predictions.groupby(keys):
        rows.append(dict(zip(keys,key)) | metrics(g))
    pd.DataFrame(rows).to_csv(OUT/(label+'.csv'),index=False)

# Marketing: one aggregate series, monthly weekly-average units. No national allocation.
funnel=read_csv('marketing_funnel_monthly.csv')
spend=funnel.groupby('month').spend_eur.sum()
spend.index=pd.to_datetime(spend.index).to_period('M')
weekly=d.groupby('date').units_sold.sum()
monthly=weekly.groupby(weekly.index.to_period('M')).mean().to_frame('units')
monthly['spend']=spend
monthly['lag_spend']=monthly.spend.shift(1)
marketing=[]
for origin,h in [(12,3),(12,6),(15,3)]:
    for use_budget in [False,True]:
        def mx(idx, budget):
            x=np.column_stack([idx/12,np.sin(2*np.pi*idx/12),np.cos(2*np.pi*idx/12)])
            return np.column_stack([x,budget]) if use_budget else x
        a=np.arange(1,origin); b=np.arange(origin,origin+h)
        reg=make_pipeline(StandardScaler(),Ridge(alpha=1.0))
        reg.fit(mx(a,monthly.lag_spend.iloc[a]), np.log(monthly.units.iloc[a]))
        p=np.exp(reg.predict(mx(b,np.repeat(monthly.spend.iloc[origin-1],h))))
        marketing.append(dict(origin_months=origin,horizon_months=h,budget_feature=use_budget,
            **metrics(pd.DataFrame({'actual':monthly.units.iloc[b].to_numpy(),'prediction':p}))))
pd.DataFrame(marketing).to_csv(OUT/'marketing_metrics.csv',index=False)
# Audit: hidden targets and unavailable future covariates cannot change forecasts.
a=d[d.t<52].copy(); b=d[(d.t>=52)&(d.t<65)].copy()
poison=b.copy()
for col in ['units_sold','revenue_eur','price_lag','promo_lag','promo_active']:
    poison[col]=999999.0
for name in MODELS:
    np.testing.assert_allclose(predict(a,b,name),predict(a,poison,name))

# Full-data descriptive parameters, never reused in backtest training.
parameters=[]
for s,g in d.groupby('series'):
    slope,intercept=np.polyfit(g.t,g.units_sold/g.S,1)
    parameters.append(dict(series=s,intercept_units=intercept,slope_units_per_week=slope))
pd.DataFrame(parameters).to_csv(OUT/'index_trend_parameters.csv',index=False)
metadata=dict(base_main='be2c3f3', python=platform.python_version(), numpy=np.__version__,
    pandas=pd.__version__, sklearn=sklearn.__version__, seed=263317,
    validation='panel, chronological separation, finite forecasts, poisoned future inputs: passed',
    sha256={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in (ROOT/'data').glob('*.csv')})
(OUT/'run_metadata.json').write_text(json.dumps(metadata,indent=2)+'\n')
print(pd.read_csv(OUT/'metrics.csv').query("sensitivity == 'all'").to_string(index=False))
print(pd.DataFrame(marketing).to_string(index=False))
