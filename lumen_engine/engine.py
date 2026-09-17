"""Pure evaluation, conditional comparison and named sensitivity scenarios."""
from .contracts import *
from .commercial import month_starts, series, demand, available_sales
from .economics import financials, unit_terms, recovery, roi_ratio


def evaluate(s: Scenario) -> Evaluation:
    # Revalidate typed callers too: frozen dataclasses do not enforce runtime types.
    s = load_scenario(snapshot(s))
    if s.schema_version != SCHEMA_VERSION or not s.scenario_id.strip() or not s.revision.strip():
        raise ContractError('unsupported schema version or empty scenario id/revision')
    if not s.economics.channels or any(not c.strip() for c in s.economics.channels):
        raise ContractError('nonempty sales channels required')
    months = month_starts(s.launch, s.horizon)
    prices, nets, margins = unit_terms(s)
    budgets = {k: series(v, s.horizon, 'EUR', 'marketing.'+k, de=True) for k, v in s.marketing.items()}
    quantities = demand(s, prices, budgets, months)
    sales = available_sales(s, quantities)
    channel, monthly, checkpoints, coverage, launch, threshold = financials(s, sales, prices, nets, margins, budgets)
    return Evaluation(SCHEMA_VERSION, ENGINE_VERSION, s.scenario_id, s.revision, digest(s), snapshot(s), months,
        quantities, sales, margins, channel, monthly, checkpoints, coverage, launch, threshold,
        ('MODEL outputs inherit all input provenance in input_snapshot.',
         'No measured German accuracy or causal marketing effect.',
         'Recovery is economic, not cash payback. Forecast errors are not German confidence intervals.'))


def compatible(results):
    if not results:
        raise ContractError('at least one evaluation required')
    for r in results:
        if r.engine_version != ENGINE_VERSION or r.schema_version != SCHEMA_VERSION or digest(r.input_snapshot) != r.fingerprint:
            raise ContractError('incompatible version or stale input snapshot')
    first = results[0]
    if any(r.months != first.months or r.input_snapshot['economics']['convention'] != first.input_snapshot['economics']['convention'] for r in results[1:]):
        raise ContractError('incompatible calendar or economic convention')


def incremental_roi(current: Evaluation, reference: Evaluation | None) -> ROIResult:
    if reference is None:
        m = missing('EUR', 'counterfactual required')
        return ROIResult(m, m, missing('ratio', 'counterfactual required'), Recovery(None, missing('month', 'counterfactual required'), None), 'conditional incremental marketing ROI', None)
    compatible((current, reference))
    dc = calc('EUR', lambda a, b: a-b, current.checkpoints['12']['contribution'], reference.checkpoints['12']['contribution'])
    db = calc('EUR', lambda a, b: a-b, current.checkpoints['12']['marketing'], reference.checkpoints['12']['marketing'])
    # Only budgets may differ for the marketing-only label; other changes are strategic.
    a, b = dict(current.input_snapshot), dict(reference.input_snapshot)
    for x in (a, b):
        for field in ('scenario_id', 'revision', 'marketing'):
            x.pop(field)
        x['economics'] = dict(x['economics'])
        x['economics'].pop('prelaunch_marketing')
    label = 'conditional incremental marketing ROI' if a == b else 'conditional return of strategy change'
    flows = tuple(calc('EUR', lambda c, r, bc, br: c-r-bc+br, current.monthly['contribution'][t], reference.monthly['contribution'][t], current.monthly['marketing'][t], reference.monthly['marketing'][t]) for t in range(12))
    cp = parameter(load_scenario(current.input_snapshot).economics.prelaunch_marketing, 'EUR', 'current.prelaunch', de=True)
    rp = parameter(load_scenario(reference.input_snapshot).economics.prelaunch_marketing, 'EUR', 'reference.prelaunch', de=True)
    initial = calc('EUR', lambda c, r: -c+r, cp, rp)
    rec = recovery(initial, flows, db) if db.status == 'ok' and db.value > 0 else Recovery(None, missing('month', 'positive incremental spend required'), None)
    return ROIResult(dc, db, roi_ratio(dc, db), rec, label+'; excludes additional fixed costs; not measured causality', reference.fingerprint)


def uncertainty(scenarios: dict[str, Scenario]) -> UncertaintyResult:
    if set(scenarios) != {'pessimistic', 'base', 'optimistic'}:
        raise ContractError('exactly pessimistic/base/optimistic scenarios required')
    results = {k: evaluate(v) for k, v in scenarios.items()}
    compatible(tuple(results.values()))
    ranges = {}
    for key in ('units', 'contribution', 'result', 'launch_balance'):
        metrics = [r.checkpoints['12'][key] for r in results.values()]
        ranges[key] = (min(m.value for m in metrics), max(m.value for m in metrics)) if all(m.status == 'ok' for m in metrics) else None
    return UncertaintyResult(results, ranges, ('Named assumptions, not probabilities or calibrated intervals.', 'Labels do not guarantee KPI order; exact inputs retained; missing variants never narrow ranges.'))


def recommend(results: tuple[Evaluation, ...], policy: DecisionPolicy) -> Recommendation:
    compatible(results)
    policy = decode(DecisionPolicy, snapshot(policy))
    if len({r.fingerprint for r in results}) != len(results):
        raise ContractError('duplicate scenario versions')
    budget = parameter(policy.budget_limit, 'EUR', 'policy.budget_limit', de=True)
    accepted = declaration(policy.declaration, 'policy.declaration')
    evidence = {r.fingerprint: r.checkpoints['12'] for r in results}
    excluded, eligible = {}, []
    for r in results:
        spend = r.checkpoints['12']['marketing']
        if spend.status != 'ok':
            excluded[r.fingerprint] = 'marketing budget not calculable'
        elif budget.status == 'ok' and spend.value > budget.value:
            excluded[r.fingerprint] = 'marketing budget constraint exceeded'
        elif policy.priority and r.checkpoints['12'][policy.priority].status != 'ok':
            excluded[r.fingerprint] = 'priority metric not calculable'
        else:
            eligible.append(r)
    reasons = ('Conditional on accepted assumptions; no premium score or global optimum.', 'Alternative tradeoffs remain visible in evidence; human decision required.')
    if policy.priority is None or budget.status != 'ok' or accepted.status != 'ok' or not eligible or len(results) < 2:
        return Recommendation('open', (), tuple(r.fingerprint for r in eligible), excluded, evidence, reasons+('Missing priority, accepted budget/declaration, complete metrics or alternative.',))
    best = max(r.checkpoints['12'][policy.priority].value for r in eligible)
    chosen = tuple(r.fingerprint for r in eligible if abs(r.checkpoints['12'][policy.priority].value-best) < 1e-9)
    return Recommendation('conditional', chosen, tuple(r.fingerprint for r in eligible if r.fingerprint not in chosen), excluded, evidence,
                          reasons+(f'Maximize {policy.priority} under stated marketing budget; best={best} EUR; ties preserved.',))
