"""Versioned JSON contracts. Null is missing, never zero; unknown fields are errors."""
from __future__ import annotations
from dataclasses import dataclass, fields, asdict
from typing import Literal, Union, get_args, get_origin, get_type_hints
import hashlib
import json
import math
import types

SCHEMA_VERSION = '1.0.0'
ENGINE_VERSION = '1.0.0'
Kind = Literal['DATA', 'MODEL', 'ASSUMPTION', 'EXTERNAL']

class ContractError(ValueError):
    pass

@dataclass(frozen=True)
class Parameter:
    value: float | None
    unit: str
    kind: Kind
    source: str
    accepted: bool

@dataclass(frozen=True)
class Declaration:
    text: str
    kind: Literal['ASSUMPTION', 'EXTERNAL']
    source: str
    accepted: bool

@dataclass(frozen=True)
class PriceResponse:
    mode: Literal['constant', 'points']
    declaration: Declaration
    reference_price: Parameter
    prices: tuple[float, ...]
    acceptance: tuple[float, ...]
    interpolate: bool

@dataclass(frozen=True)
class ModeA:
    mode: Literal['A']
    level: Parameter
    mix: dict[str, Parameter]
    ramp: dict[str, tuple[Parameter, ...]]
    season: tuple[Parameter, ...]  # January..December, mean 1
    price_response: dict[str, PriceResponse]

@dataclass(frozen=True)
class Campaign:
    name: str  # key in Scenario.marketing; the single source of budget
    kind: Literal['paid', 'referral']
    cac: tuple[Parameter, ...]
    deduplication: tuple[Parameter, ...]
    incrementality: tuple[Parameter, ...]
    allocation: dict[str, tuple[Parameter, ...]]
    cohort_units: dict[str, tuple[Parameter, ...]]  # by cohort age; first/repeat purchases
    budget_ceiling: tuple[Parameter, ...]
    eligible_customers: tuple[Parameter, ...]  # required for referral, empty for paid

@dataclass(frozen=True)
class ModeB:
    mode: Literal['B']
    organic: dict[str, tuple[Parameter, ...]]
    campaigns: tuple[Campaign, ...]
    dependencies: Declaration  # price/season/ramp already included in these inputs

@dataclass(frozen=True)
class ChannelEconomics:
    price: tuple[Parameter, ...]
    retailer: Parameter
    distributor: Parameter
    payment: Parameter
    fulfillment: Parameter
    cogs: tuple[Parameter, ...]

@dataclass(frozen=True)
class EconomicsInput:
    channels: dict[str, ChannelEconomics]
    fixed_costs: tuple[Parameter, ...]
    investment: Parameter
    prelaunch_marketing: Parameter
    convention: Declaration
    constant_mix: dict[str, Parameter]  # empty => no static break-even claim
    fixed_budget: Declaration  # budget independent of units, for static break-even

@dataclass(frozen=True)
class Scenario:
    schema_version: str
    scenario_id: str
    revision: str
    country: Literal['DE']
    launch: str
    horizon: int
    commercial: ModeA | ModeB
    marketing: dict[str, tuple[Parameter, ...]]
    economics: EconomicsInput
    full_availability: Declaration
    capacity: dict[str, tuple[Parameter, ...]]  # empty or all sales channels

Status = Literal['ok', 'not_calculable', 'not_applicable', 'not_reached', 'covered_at_start', 'no_finite_threshold']

@dataclass(frozen=True)
class Metric:
    value: float | None
    unit: str
    status: Status
    reasons: tuple[str, ...]

@dataclass(frozen=True)
class Recovery:
    cumulative: tuple[float, ...] | None  # includes t=0
    delay: Metric
    relapse: bool | None

@dataclass(frozen=True)
class Evaluation:
    schema_version: str
    engine_version: str
    scenario_id: str
    revision: str
    fingerprint: str
    input_snapshot: dict
    months: tuple[str, ...]
    demand: dict[str, tuple[Metric, ...]]
    sales: dict[str, tuple[Metric, ...]]
    unit_margin: dict[str, tuple[Metric, ...]]
    channel_financials: dict[str, dict[str, tuple[Metric, ...]]]
    monthly: dict[str, tuple[Metric, ...]]
    checkpoints: dict[str, dict[str, Metric]]
    marketing_coverage: Recovery
    launch_recovery: Recovery
    break_even: Metric
    warnings: tuple[str, ...]

@dataclass(frozen=True)
class ROIResult:
    delta_contribution: Metric
    delta_budget: Metric
    ratio: Metric
    recovery: Recovery
    label: str
    reference_fingerprint: str | None

@dataclass(frozen=True)
class DecisionPolicy:
    priority: Literal['contribution', 'result'] | None
    budget_limit: Parameter
    declaration: Declaration

@dataclass(frozen=True)
class Recommendation:
    status: Literal['conditional', 'open']
    proposed: tuple[str, ...]  # fingerprints, preserving ties
    alternatives: tuple[str, ...]
    excluded: dict[str, str]
    evidence: dict[str, dict[str, Metric]]
    reasons: tuple[str, ...]

@dataclass(frozen=True)
class UncertaintyResult:
    evaluations: dict[str, Evaluation]
    ranges: dict[str, tuple[float, float] | None]
    warnings: tuple[str, ...]

def decode(cls, raw, path='$'):
    """Strict, recursive dataclass decoder; reject bool-as-number and extra keys."""
    origin, args = get_origin(cls), get_args(cls)
    if origin in (Union, types.UnionType):
        errors = []
        for option in args:
            try:
                return decode(option, raw, path)
            except ContractError as e:
                errors.append(str(e))
        raise ContractError(f'{path}: no matching union: {errors}')
    if origin is Literal:
        if raw not in args or type(raw) not in {type(a) for a in args}:
            raise ContractError(f'{path}: expected {args}')
        return raw
    if cls is type(None):
        if raw is not None:
            raise ContractError(f'{path}: expected null')
        return None
    if origin is tuple:
        if not isinstance(raw, (list, tuple)):
            raise ContractError(f'{path}: expected array')
        return tuple(decode(args[0], x, f'{path}[{i}]') for i, x in enumerate(raw))
    if origin is dict:
        if not isinstance(raw, dict) or any(not isinstance(k, str) for k in raw):
            raise ContractError(f'{path}: expected string-keyed object')
        return {k: decode(args[1], v, f'{path}.{k}') for k, v in raw.items()}
    if hasattr(cls, '__dataclass_fields__'):
        names = {f.name for f in fields(cls)}
        if not isinstance(raw, dict) or set(raw) != names:
            raise ContractError(f'{path}: expected exactly fields {sorted(names)}')
        hints = get_type_hints(cls)
        return cls(**{k: decode(hints[k], v, f'{path}.{k}') for k, v in raw.items()})
    if cls is float:
        if type(raw) not in (float, int) or not math.isfinite(raw):
            raise ContractError(f'{path}: expected finite number')
        return float(raw)
    if cls in (str, int, bool):
        if type(raw) is not cls:
            raise ContractError(f'{path}: expected {cls.__name__}')
        return raw
    raise ContractError(f'{path}: unsupported type {cls}')

def snapshot(value):
    return json.loads(json.dumps(asdict(value), allow_nan=False))

def digest(value) -> str:
    raw = snapshot(value) if hasattr(value, '__dataclass_fields__') else value
    return hashlib.sha256(json.dumps(raw, sort_keys=True, separators=(',', ':'), allow_nan=False).encode()).hexdigest()

def load_scenario(raw: dict) -> Scenario:
    return decode(Scenario, raw)

def ok(value, unit):
    if not math.isfinite(value):
        raise ContractError('non-finite calculated value')
    return Metric(float(value), unit, 'ok', ())

def missing(unit, *reasons):
    return Metric(None, unit, 'not_calculable', tuple(dict.fromkeys(reasons)))

def total(items, unit):
    items = tuple(items)
    if any(x.status != 'ok' for x in items):
        return missing(unit, *(r for x in items for r in x.reasons))
    return ok(sum(x.value for x in items), unit)

def calc(unit, fn, *items):
    if any(x.status != 'ok' for x in items):
        return missing(unit, *(r for x in items for r in x.reasons))
    return ok(fn(*(x.value for x in items)), unit)

def parameter(p: Parameter, unit, path, *, upper=None, positive=False, de=False):
    if p.unit != unit or not p.source.strip():
        raise ContractError(f'{path}: unit {unit} and source required')
    if de and p.kind not in ('ASSUMPTION', 'EXTERNAL'):
        raise ContractError(f'{path}: German parameter must be ASSUMPTION/EXTERNAL')
    if p.value is not None and (not math.isfinite(p.value) or p.value < 0 or (positive and p.value <= 0) or (upper is not None and p.value > upper)):
        raise ContractError(f'{path}: value outside domain')
    if p.value is None:
        return missing(unit, f'{path}: missing {p.kind} ({p.source})')
    if p.kind in ('ASSUMPTION', 'EXTERNAL') and not p.accepted:
        return missing(unit, f'{path}: not accepted ({p.source})')
    return ok(p.value, unit)

def declaration(d: Declaration, path):
    if not d.text.strip() or not d.source.strip():
        raise ContractError(f'{path}: explicit declaration and source required')
    return ok(1, 'ratio') if d.accepted else missing('ratio', f'{path}: declaration not accepted')
