"""Run from repo root: python -m examples.run --output work/engine-example.json"""
import argparse
from dataclasses import replace
import json
from pathlib import Path
from lumen_engine.contracts import load_scenario, snapshot, DecisionPolicy
from lumen_engine.historical import RidgeForecaster, read_sales, german_season_profile
from lumen_engine.engine import evaluate, incremental_roi, recommend, uncertainty
from .make_fixture import p, d


def run(path=None):
    root = Path(__file__).resolve().parents[1]
    scenario = load_scenario(json.loads(Path(path or root/'examples/scenario.json').read_text()))
    model = RidgeForecaster()
    # Origin preceding July 1 supplies complete 12-calendar-month coverage with 53 weeks.
    artifact = model.fit(read_sales(root/'data/historical_sales_weekly.csv'), '2026-06-29')
    forecast = model.predict(artifact, 53)
    profile = german_season_profile(forecast, 'Netherlands|DTC Online', scenario.launch,
        d('Transfer normalized seasonal component only, no historical level or growth'))
    base = replace(scenario, commercial=replace(scenario.commercial, season=profile))
    variants = {label: replace(base, revision=label, commercial=replace(base.commercial, level=p(level, 'can/month')))
                for label, level in [('pessimistic', 8000), ('base', 10000), ('optimistic', 12000)]}
    sensitivity = uncertainty(variants)
    alternative_mix = {'DTC Online': p(.3, 'ratio'), 'Retail/Grocery': p(.7, 'ratio')}
    alternative = replace(base, scenario_id='demo-retail', commercial=replace(base.commercial, mix=alternative_mix),
                          economics=replace(base.economics, constant_mix=alternative_mix))
    evaluated = evaluate(base)
    other = evaluate(alternative)
    policy = DecisionPolicy('contribution', p(10000, 'EUR'), d('Prefer contribution within marketing budget; qualitative premium assessment remains human'))
    return {'artifact': snapshot(artifact), 'forecast': snapshot(forecast), 'evaluation': snapshot(evaluated),
            'uncertainty': snapshot(sensitivity), 'recommendation': snapshot(recommend((evaluated, other), policy)),
            'roi_without_counterfactual': snapshot(incremental_roi(evaluated, None))}


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', type=Path)
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    encoded = json.dumps(run(args.input), indent=2, allow_nan=False)+'\n'
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(encoded)
    else:
        print(encoded, end='')
