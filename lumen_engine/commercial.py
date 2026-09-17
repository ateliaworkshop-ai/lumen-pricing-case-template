"""German conditional demand; no direct prediction for an unseen country."""
from datetime import date
from .contracts import (ContractError, ModeA, ModeB, calc, declaration, missing,
                        ok, parameter, total)


def month_starts(launch, horizon):
    try:
        start = date.fromisoformat(launch)
    except (TypeError, ValueError) as e:
        raise ContractError('launch: ISO date required') from e
    if start.day != 1 or horizon != 12:
        raise ContractError('MVP requires first of month and 12 calendar months')
    return tuple(date(start.year + (start.month - 1 + i)//12,
                      (start.month - 1 + i)%12 + 1, 1).isoformat() for i in range(horizon))


def series(values, n, unit, path, **kw):
    if len(values) != n:
        raise ContractError(f'{path}: expected {n} periods')
    return tuple(parameter(p, unit, f'{path}[{i}]', **kw) for i, p in enumerate(values))


def keys(mapping, channels, path):
    if set(mapping) != set(channels):
        raise ContractError(f'{path}: must match sales channels {sorted(channels)}')


def normalized(values, path):
    if all(v.status == 'ok' for v in values) and abs(sum(v.value for v in values) - 1) > 1e-9:
        raise ContractError(f'{path}: sum must be 1 (no silent normalization)')
    return total(values, 'ratio')


def price_factor(response, price, path):
    accepted = declaration(response.declaration, path)
    ref = parameter(response.reference_price, 'EUR/can', path+'.reference', positive=True, de=True)
    if response.mode == 'constant':
        if response.prices or response.acceptance:
            raise ContractError(f'{path}: constant response must not contain a curve')
        return calc('ratio', lambda a, p, r: 1., accepted, price, ref)
    xs, ys = response.prices, response.acceptance
    if len(xs) < 2 or len(xs) != len(ys) or any(x <= 0 for x in xs) or any(a >= b for a, b in zip(xs, xs[1:])) or any(y <= 0 or y > 1 for y in ys):
        raise ContractError(f'{path}: ordered positive prices and acceptance in (0,1] required')
    def interpolate(x):
        if x in xs:
            return ys[xs.index(x)]
        if x < xs[0] or x > xs[-1] or not response.interpolate:
            return None
        for i in range(1, len(xs)):
            if x < xs[i]:
                w = (x-xs[i-1])/(xs[i]-xs[i-1])
                return ys[i-1]*(1-w) + ys[i]*w
    if any(m.status != 'ok' for m in (accepted, price, ref)):
        return calc('ratio', lambda *a: 0, accepted, price, ref)
    a, b = interpolate(price.value), interpolate(ref.value)
    if a is None or b is None:
        return missing('ratio', f'{path}: price/reference outside accepted curve')
    return ok(a/b, 'ratio')


def demand(s, prices, budgets, months):
    n, channels = s.horizon, tuple(prices)
    mode = s.commercial
    if isinstance(mode, ModeA):
        for name in ('mix', 'ramp', 'price_response'):
            keys(getattr(mode, name), channels, 'A.'+name)
        level = parameter(mode.level, 'can/month', 'A.level', de=True)
        mix = {c: parameter(mode.mix[c], 'ratio', f'A.mix.{c}', upper=1, de=True) for c in channels}
        mix_valid = normalized(tuple(mix.values()), 'A.mix')
        season = series(mode.season, 12, 'ratio', 'A.season', de=True)
        season_valid = total(season, 'ratio')
        if season_valid.status == 'ok' and abs(season_valid.value/12 - 1) > 1e-9:
            raise ContractError('A.season: annual equal-month mean must be 1')
        result = {}
        for c in channels:
            ramp = series(mode.ramp[c], n, 'ratio', f'A.ramp.{c}', upper=1, de=True)
            factors = [price_factor(mode.price_response[c], prices[c][t], f'A.price_response.{c}[{t}]') for t in range(n)]
            result[c] = tuple(calc('can', lambda l, m, r, z, g, *_: l*m*r*z*g,
                level, mix[c], ramp[t], season[int(months[t][5:7])-1], factors[t], mix_valid, season_valid) for t in range(n))
        return result
    if not isinstance(mode, ModeB):
        raise ContractError('commercial: choose exactly one mode')
    keys(mode.organic, channels, 'B.organic')
    dep = declaration(mode.dependencies, 'B.dependencies')
    result = {c: list(series(mode.organic[c], n, 'can', f'B.organic.{c}', de=True)) for c in channels}
    if len({x.name for x in mode.campaigns}) != len(mode.campaigns) or {x.name for x in mode.campaigns} != set(budgets):
        raise ContractError('B.campaigns must match marketing budget keys exactly')
    for campaign in mode.campaigns:
        prefix = 'B.'+campaign.name
        cac = series(campaign.cac, n, 'EUR/customer', prefix+'.cac', positive=True, de=True)
        dedup = series(campaign.deduplication, n, 'ratio', prefix+'.dedup', upper=1, de=True)
        inc = series(campaign.incrementality, n, 'ratio', prefix+'.incrementality', upper=1, de=True)
        ceiling = series(campaign.budget_ceiling, n, 'EUR', prefix+'.ceiling', de=True)
        keys(campaign.allocation, channels, prefix+'.allocation')
        keys(campaign.cohort_units, channels, prefix+'.cohort_units')
        alloc = {c: series(campaign.allocation[c], n, 'ratio', prefix+'.allocation.'+c, upper=1, de=True) for c in channels}
        units = {c: series(campaign.cohort_units[c], n, 'can/customer', prefix+'.cohort_units.'+c, de=True) for c in channels}
        eligible = series(campaign.eligible_customers, n, 'customer', prefix+'.eligible', de=True) if campaign.kind == 'referral' else ()
        if campaign.kind == 'paid' and campaign.eligible_customers:
            raise ContractError(prefix+': eligible_customers applies only to referral')
        for t in range(n):
            budget = budgets[campaign.name][t]
            allocation_valid = normalized(tuple(alloc[c][t] for c in channels), prefix+'.allocation')
            # Zero spend needs no fabricated CAC, cohorts or eligible population.
            if budget.status == 'ok' and budget.value == 0:
                continue
            clients = calc('customer', lambda b, a, d, i, _: b/a*d*i, budget, cac[t], dedup[t], inc[t], ceiling[t])
            if budget.status == ceiling[t].status == 'ok' and budget.value > ceiling[t].value:
                clients = missing('customer', prefix+': budget outside accepted linear domain')
            if eligible:
                clients = calc('customer', lambda x, _: x, clients, eligible[t])
                # Reject rather than silently cap an unsupported acquisition plan.
                attributed = calc('customer', lambda b, a: b/a, budget, cac[t])
                if attributed.status == eligible[t].status == 'ok' and attributed.value > eligible[t].value:
                    clients = missing('customer', prefix+': acquisitions exceed eligible population')
            for c in channels:
                for future in range(t, n):
                    delta = calc('can', lambda x, a, u, _: x*a*u, clients, alloc[c][t], units[c][future-t], allocation_valid)
                    result[c][future] = total((result[c][future], delta), 'can')
    return {c: tuple(calc('can', lambda x, _: x, x, dep) for x in values) for c, values in result.items()}


def available_sales(s, quantities):
    if s.capacity:
        keys(s.capacity, quantities, 'capacity')
        return {c: tuple(calc('can', min, q, cap) for q, cap in zip(quantities[c], series(s.capacity[c], s.horizon, 'can', 'capacity.'+c, de=True))) for c in quantities}
    accepted = declaration(s.full_availability, 'full_availability')
    return {c: tuple(calc('can', lambda q, _: q, q, accepted) for q in values) for c, values in quantities.items()}
