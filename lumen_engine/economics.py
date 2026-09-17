"""MD-05/06 identities. Cumulative economic recovery is not cash payback."""
from .contracts import (Metric, Recovery, calc, declaration, missing, ok, parameter, total)


def recovery(initial, flows, expense):
    if any(x.status != 'ok' for x in (initial, expense, *flows)):
        return Recovery(None, missing('month', *(r for x in (initial, expense, *flows) for r in x.reasons)), None)
    cumulative = [initial.value]
    for flow in flows:
        cumulative.append(cumulative[-1]+flow.value)
    if expense.value == 0:
        return Recovery(tuple(cumulative), Metric(None, 'month', 'not_applicable', ('no expenditure to recover',)), False)
    negative = cumulative[0] < 0
    crossing = None
    for i, value in enumerate(cumulative[1:], 1):
        if value >= 0 and negative and crossing is None:
            crossing = i
        negative = negative or value < 0
    if crossing is not None:
        return Recovery(tuple(cumulative), ok(crossing, 'month'), any(x < 0 for x in cumulative[crossing+1:]))
    if not negative:
        return Recovery(tuple(cumulative), Metric(0., 'month', 'covered_at_start', ('no negative cumulative balance',)), False)
    return Recovery(tuple(cumulative), Metric(None, 'month', 'not_reached', ('not reached within horizon',)), False)


def roi_ratio(delta_contribution, delta_budget):
    if delta_contribution.status != 'ok' or delta_budget.status != 'ok':
        return calc('ratio', lambda a, b: 0, delta_contribution, delta_budget)
    if delta_budget.value == 0:
        return Metric(None, 'ratio', 'not_applicable', ('zero incremental spend',))
    if delta_budget.value < 0:
        return missing('ratio', 'negative incremental spend: report deltas only')
    return ok((delta_contribution.value-delta_budget.value)/delta_budget.value, 'ratio')


def static_threshold(cost, margin):
    if cost.status != 'ok' or margin.status != 'ok':
        return calc('can', lambda *a: 0, cost, margin)
    if cost.value == 0:
        return Metric(None, 'can', 'not_applicable', ('no cost to cover',))
    if margin.value <= 0:
        return Metric(None, 'can', 'no_finite_threshold', ('nonpositive contribution per unit',))
    return ok(cost.value/margin.value, 'can')


def unit_terms(s):
    from .commercial import series
    n = s.horizon
    convention = declaration(s.economics.convention, 'economics.convention')
    prices, nets, margins = {}, {}, {}
    for c, terms in s.economics.channels.items():
        prefix = 'economics.'+c
        prices[c] = series(terms.price, n, 'EUR/can', prefix+'.price', de=True)
        rates = [parameter(getattr(terms, k), 'ratio', prefix+'.'+k, upper=1, de=True) for k in ('retailer', 'distributor', 'payment')]
        rate = total(rates, 'ratio')
        if rate.status == 'ok' and rate.value > 1:
            from .contracts import ContractError
            raise ContractError(prefix+': total deduction exceeds 100%')
        fulfill = parameter(terms.fulfillment, 'EUR/can', prefix+'.fulfillment', de=True)
        cogs = series(terms.cogs, n, 'EUR/can', prefix+'.cogs', de=True)
        nets[c] = tuple(calc('EUR/can', lambda p, r, f, _: p*(1-r)-f, prices[c][t], rate, fulfill, convention) for t in range(n))
        margins[c] = tuple(calc('EUR/can', lambda net, cost: net-cost, nets[c][t], cogs[t]) for t in range(n))
    return prices, nets, margins


def financials(s, sales, prices, nets, margins, budgets):
    from .commercial import keys, normalized, series
    n = s.horizon
    channel = {c: {'consumer_revenue': tuple(calc('EUR', lambda q, p: q*p, sales[c][t], prices[c][t]) for t in range(n)),
                   'net_revenue': tuple(calc('EUR', lambda q, p: q*p, sales[c][t], nets[c][t]) for t in range(n)),
                   'contribution': tuple(calc('EUR', lambda q, p: q*p, sales[c][t], margins[c][t]) for t in range(n))} for c in sales}
    monthly = {k: tuple(total((channel[c][k][t] for c in channel), 'EUR') for t in range(n)) for k in ('consumer_revenue', 'net_revenue', 'contribution')}
    monthly['units'] = tuple(total((sales[c][t] for c in sales), 'can') for t in range(n))
    monthly['marketing'] = tuple(total((b[t] for b in budgets.values()), 'EUR') for t in range(n))
    fixed = series(s.economics.fixed_costs, n, 'EUR', 'economics.fixed_costs', de=True)
    monthly['fixed_costs'] = fixed
    monthly['result'] = tuple(calc('EUR', lambda c, b, f: c-b-f, monthly['contribution'][t], monthly['marketing'][t], fixed[t]) for t in range(n))
    pre = parameter(s.economics.prelaunch_marketing, 'EUR', 'economics.prelaunch_marketing', de=True)
    inv = parameter(s.economics.investment, 'EUR', 'economics.investment', de=True)
    budget = total((pre, *monthly['marketing']), 'EUR')
    expense = total((budget, inv, *fixed), 'EUR')
    coverage = recovery(calc('EUR', lambda b: -b, pre), tuple(calc('EUR', lambda c, b: c-b, c, b) for c, b in zip(monthly['contribution'], monthly['marketing'])), budget)
    launch = recovery(calc('EUR', lambda b, i: -b-i, pre, inv), monthly['result'], expense)
    threshold = missing('can', 'static break-even requires explicit constant mix and fixed-budget declaration')
    if s.economics.constant_mix:
        keys(s.economics.constant_mix, sales, 'economics.constant_mix')
        mix = {c: parameter(p, 'ratio', 'economics.constant_mix.'+c, upper=1, de=True) for c, p in s.economics.constant_mix.items()}
        valid = normalized(tuple(mix.values()), 'economics.constant_mix')
        fixed_budget = declaration(s.economics.fixed_budget, 'economics.fixed_budget')
        # No average of variable margins or prices silently becomes a constant model.
        stable = all(all(m.status == 'ok' for m in (*prices[c], *margins[c])) and len({m.value for m in prices[c]}) == 1 and len({m.value for m in margins[c]}) == 1 for c in sales)
        # If sales are known, the asserted mix must hold in every nonzero period.
        for t in range(n):
            period_total = total((sales[c][t] for c in sales), 'can')
            if period_total.status == 'ok' and period_total.value > 0:
                if any(mix[c].status == 'ok' and abs(sales[c][t].value/period_total.value-mix[c].value) > 1e-9 for c in sales):
                    stable = False
        if stable:
            weighted = total((calc('EUR/can', lambda m, w, *_: m*w, margins[c][0], mix[c], valid, fixed_budget) for c in sales), 'EUR/can')
            threshold = static_threshold(expense, weighted)
        else:
            threshold = missing('can', 'variable/missing price or margin, or sales mix differs: use cumulative flows')
    checkpoints = {}
    for h in (3, 6, 12):
        values = {k: total(v[:h], 'can' if k == 'units' else 'EUR') for k, v in monthly.items()}
        values['marketing'] = total((pre, values['marketing']), 'EUR')
        values['result'] = calc('EUR', lambda x, b: x-b, values['result'], pre)
        values['launch_balance'] = calc('EUR', lambda x, i: x-i, values['result'], inv)
        values['contribution_rate'] = (calc('ratio', lambda c, r: c/r, values['contribution'], values['net_revenue']) if values['net_revenue'].status == 'ok' and values['net_revenue'].value > 0 else missing('ratio', 'positive net revenue required'))
        checkpoints[str(h)] = values
    return channel, monthly, checkpoints, coverage, launch, threshold
