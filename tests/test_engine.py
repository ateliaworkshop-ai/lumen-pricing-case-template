import copy
from dataclasses import replace
import json
import unittest
from pathlib import Path
from examples.make_fixture import p, d, repeat, example_scenario
from lumen_engine.contracts import *
from lumen_engine.engine import *
from lumen_engine.economics import recovery, static_threshold, roi_ratio

class EngineTests(unittest.TestCase):
    def setUp(self):
        self.s = example_scenario()

    def zero_economics(self, s):
        return replace(s, economics=replace(s.economics, fixed_costs=repeat(0, 'EUR'), investment=p(0,'EUR'), prelaunch_marketing=p(0,'EUR')))

    def mode_b(self):
        channels = tuple(self.s.economics.channels)
        budgets = (p(1000,'EUR'),)+repeat(0,'EUR')[1:]
        campaign = Campaign('paid', 'paid', repeat(50,'EUR/customer'), repeat(1,'ratio'), repeat(.5,'ratio'),
            {channels[0]: repeat(.6,'ratio'), channels[1]: repeat(.4,'ratio')},
            {c: (p(6,'can/customer'),)+repeat(0,'can/customer')[1:] for c in channels}, repeat(1000,'EUR'), ())
        mode = ModeB('B', {c: repeat(0,'can') for c in channels}, (campaign,), d('Organic, CAC and cohorts already include price and season; no halo assumed'))
        return self.zero_economics(replace(self.s, commercial=mode, marketing={'paid': budgets}))

    def test_mode_b_recipe_and_no_double_conversion(self):
        r = evaluate(self.mode_b())
        self.assertAlmostEqual(r.sales['DTC Online'][0].value, 36)
        self.assertAlmostEqual(r.sales['Retail/Grocery'][0].value, 24)
        self.assertEqual(r.checkpoints['12']['units'].value, 60)
        self.assertEqual(r.checkpoints['12']['marketing'].value, 1000)

    def test_cohorts_delay_not_booked_at_acquisition(self):
        s = self.mode_b(); campaign = s.commercial.campaigns[0]
        units = {c:(p(0,'can/customer'),p(6,'can/customer'))+repeat(0,'can/customer')[2:] for c in campaign.cohort_units}
        r = evaluate(replace(s, commercial=replace(s.commercial,campaigns=(replace(campaign,cohort_units=units),))))
        self.assertEqual(r.monthly['units'][0].value,0)
        self.assertEqual(r.monthly['units'][1].value,60)

    def test_mode_b_zero_budget_missing_cac(self):
        s = self.mode_b(); campaign = s.commercial.campaigns[0]
        s = replace(s, marketing={'paid':repeat(0,'EUR')}, commercial=replace(s.commercial,campaigns=(replace(campaign,cac=repeat(None,'EUR/customer')),)))
        self.assertEqual(evaluate(s).checkpoints['12']['units'].value,0)

    def test_missing_cac_only_dependent_results(self):
        s = self.mode_b(); campaign = s.commercial.campaigns[0]
        s = replace(s, commercial=replace(s.commercial,campaigns=(replace(campaign,cac=repeat(None,'EUR/customer')),)))
        r = evaluate(s)
        self.assertIsNone(r.monthly['units'][0].value)
        self.assertEqual(r.unit_margin['DTC Online'][0].status,'ok')

    def test_budget_domain_and_referral(self):
        s = self.mode_b(); c = s.commercial.campaigns[0]
        for changed in (replace(c,budget_ceiling=repeat(999,'EUR')),replace(c,kind='referral',eligible_customers=repeat(10,'customer'))):
            r=evaluate(replace(s,commercial=replace(s.commercial,campaigns=(changed,))))
            self.assertEqual(r.monthly['units'][0].status,'not_calculable')

    def test_dtc_recipe(self):
        s = self.s
        mix={'DTC Online':p(1,'ratio'),'Retail/Grocery':p(0,'ratio')}
        s=replace(s,commercial=replace(s.commercial,level=p(100,'can/month'),mix=mix))
        r=evaluate(s)
        self.assertAlmostEqual(r.monthly['consumer_revenue'][0].value,219)
        self.assertAlmostEqual(r.monthly['net_revenue'][0].value,177.649)
        self.assertAlmostEqual(r.monthly['contribution'][0].value,115.649)

    def test_cost_sensitivity(self):
        r=evaluate(self.s)
        terms={c:replace(t,cogs=repeat(.72,'EUR/can')) for c,t in self.s.economics.channels.items()}
        changed=evaluate(replace(self.s,economics=replace(self.s.economics,channels=terms)))
        self.assertAlmostEqual(r.checkpoints['12']['contribution'].value-changed.checkpoints['12']['contribution'].value,12000)

    def test_roi_recipe(self):
        self.assertAlmostEqual(roi_ratio(ok(80,'EUR'),ok(50,'EUR')).value,.6)
        self.assertEqual(roi_ratio(ok(80,'EUR'),ok(0,'EUR')).status,'not_applicable')
        self.assertEqual(roi_ratio(ok(80,'EUR'),ok(-50,'EUR')).status,'not_calculable')

    def test_recovery_recipe_and_relapse(self):
        r=recovery(ok(-100,'EUR'),(ok(60,'EUR'),ok(60,'EUR')),ok(100,'EUR'))
        self.assertEqual(r.cumulative,(-100,-40,20)); self.assertEqual(r.delay.value,2)
        self.assertTrue(recovery(ok(-100,'EUR'),(ok(120,'EUR'),ok(-30,'EUR')),ok(100,'EUR')).relapse)
        self.assertEqual(recovery(ok(-100,'EUR'),(ok(60,'EUR'),),ok(100,'EUR')).delay.status,'not_reached')
        self.assertEqual(recovery(ok(0,'EUR'),(ok(60,'EUR'),),ok(0,'EUR')).delay.status,'not_applicable')
        self.assertEqual(recovery(ok(0,'EUR'),(ok(60,'EUR'),),ok(10,'EUR')).delay.status,'covered_at_start')

    def test_break_even_recipe(self):
        self.assertEqual(static_threshold(ok(120,'EUR'),ok(.6,'EUR/can')).value,200)
        self.assertEqual(static_threshold(ok(120,'EUR'),ok(-.6,'EUR/can')).status,'no_finite_threshold')

    def test_missing_level_keeps_margin(self):
        r=evaluate(replace(self.s,commercial=replace(self.s.commercial,level=p(None,'can/month'))))
        self.assertEqual(r.monthly['units'][0].status,'not_calculable')
        self.assertEqual(r.unit_margin['DTC Online'][0].status,'ok')

    def test_missing_fixed_costs_keeps_contribution(self):
        r=evaluate(replace(self.s,economics=replace(self.s.economics,fixed_costs=repeat(None,'EUR'))))
        self.assertEqual(r.monthly['contribution'][0].status,'ok')
        self.assertIsNone(r.launch_recovery.delay.value)
        self.assertEqual(r.monthly['result'][0].status,'not_calculable')

    def test_availability_capacity_no_carry(self):
        s=replace(self.s,full_availability=replace(self.s.full_availability,accepted=False))
        self.assertEqual(evaluate(s).monthly['units'][0].status,'not_calculable')
        r=evaluate(replace(s,capacity={c:repeat(10,'can') for c in s.economics.channels}))
        self.assertEqual(r.monthly['units'][0].value,20)
        self.assertEqual(sum(x.value for x in r.demand['DTC Online']),72000)

    def test_price_response_domain_and_constant(self):
        s=self.s; response=PriceResponse('points',d('Survey acceptance ratio as purchase proxy'),p(2.19,'EUR/can'),(1.79,2.19,2.59),(.617,.517,.267),False)
        s=replace(s,commercial=replace(s.commercial,price_response={c:response for c in s.economics.channels}))
        self.assertEqual(evaluate(s).monthly['units'][0].value,10000)
        terms={c:replace(t,price=repeat(3,'EUR/can')) for c,t in s.economics.channels.items()}
        r=evaluate(replace(s,economics=replace(s.economics,channels=terms)))
        self.assertIsNone(r.monthly['units'][0].value)
        self.assertEqual(r.unit_margin['DTC Online'][0].status,'ok')

    def test_unaccepted_assumption_blocks(self):
        level=replace(self.s.commercial.level,accepted=False)
        self.assertIsNone(evaluate(replace(self.s,commercial=replace(self.s.commercial,level=level))).monthly['units'][0].value)

    def test_reject_invalid_contracts(self):
        raw=snapshot(self.s)
        for modify in (
            lambda x:x.update(extra=1), lambda x:x.update(horizon=6), lambda x:x.update(country='Netherlands'),
            lambda x:x['commercial'].update(organic={}), lambda x:x['commercial']['level'].update(value=True),
            lambda x:x['commercial']['level'].update(value=float('nan')), lambda x:x['commercial']['level'].update(kind='DATA'),
            lambda x:x['commercial']['level'].update(unit='EUR'), lambda x:x['commercial']['level'].update(value=-1),
            lambda x:x['commercial']['mix']['DTC Online'].update(value=.9),lambda x:x.update(launch='2026-07-02'),
        ):
            changed=copy.deepcopy(raw); modify(changed)
            with self.subTest(changed=changed),self.assertRaises(ContractError):
                evaluate(load_scenario(changed))

    def test_budget_mode_a_does_not_change_demand(self):
        r=evaluate(self.s); other=evaluate(replace(self.s,marketing={'paid':repeat(1000,'EUR')}))
        self.assertEqual(r.demand,other.demand)
        self.assertAlmostEqual(r.checkpoints['12']['result'].value-other.checkpoints['12']['result'].value,7200)

    def test_static_break_even_rejects_variable_price(self):
        terms=dict(self.s.economics.channels); c='DTC Online'
        terms[c]=replace(terms[c],price=(p(3,'EUR/can'),)+terms[c].price[1:])
        self.assertEqual(evaluate(replace(self.s,economics=replace(self.s.economics,channels=terms))).break_even.status,'not_calculable')

    def test_prelaunch_counted_once(self):
        r=evaluate(self.s)
        self.assertEqual(r.checkpoints['12']['marketing'].value,4900)
        self.assertAlmostEqual(r.launch_recovery.cumulative[-1],r.checkpoints['12']['launch_balance'].value)
        self.assertEqual(r.launch_recovery.cumulative[0],-1100)

    def test_fingerprint_and_no_mutation(self):
        raw=snapshot(self.s); r=evaluate(self.s)
        self.assertEqual(snapshot(self.s),raw)
        self.assertEqual(r,evaluate(self.s))
        self.assertNotEqual(r.fingerprint,evaluate(replace(self.s,revision='2')).fingerprint)
        self.assertEqual(load_scenario(json.loads(json.dumps(raw))),self.s)

    def test_comparison_and_roi(self):
        s=self.mode_b(); r=evaluate(s)
        baseline=evaluate(replace(s,scenario_id='counterfactual',marketing={'paid':repeat(0,'EUR')}))
        roi=incremental_roi(r,baseline)
        self.assertEqual(roi.delta_budget.value,1000)
        self.assertIn('marketing ROI',roi.label)
        self.assertEqual(incremental_roi(r,None).ratio.status,'not_calculable')
        with self.assertRaises(ContractError):
            incremental_roi(r,evaluate(replace(s,launch='2026-08-01')))

    def test_recommendation_ties_missing_and_constraints(self):
        a=evaluate(self.s); b=evaluate(replace(self.s,scenario_id='b'))
        policy=DecisionPolicy('contribution',p(10000,'EUR'),d('Priority declared'))
        rec=recommend((a,b),policy)
        self.assertEqual(len(rec.proposed),2)
        self.assertEqual(recommend((a,b),replace(policy,priority=None)).status,'open')
        self.assertEqual(recommend((a,b),replace(policy,budget_limit=p(1,'EUR'))).status,'open')
        bad=evaluate(replace(self.s,scenario_id='bad',commercial=replace(self.s.commercial,level=p(None,'can/month'))))
        self.assertIn(bad.fingerprint,recommend((a,bad),policy).excluded)

    def test_uncertainty_keeps_missing_not_false_narrow_band(self):
        scenarios={k:replace(self.s,revision=k) for k in ('pessimistic','base','optimistic')}
        scenarios['pessimistic']=replace(scenarios['pessimistic'],commercial=replace(self.s.commercial,level=p(None,'can/month')))
        u=uncertainty(scenarios)
        self.assertIsNone(u.ranges['units'])

    def test_fixture_golden(self):
        fixture=load_scenario(json.loads(Path('examples/scenario.json').read_text()))
        r=evaluate(fixture)
        # Independent arithmetic for constant-profile, fixed mix synthetic fixture.
        self.assertEqual(r.checkpoints['12']['units'].value,120000)
        self.assertAlmostEqual(r.checkpoints['12']['consumer_revenue'].value,262800)
        self.assertAlmostEqual(r.checkpoints['12']['contribution'].value,113425.68)
        self.assertAlmostEqual(r.checkpoints['12']['launch_balance'].value,106325.68)

    def test_stale_snapshot_and_convention_block(self):
        a=evaluate(self.s)
        stale=copy.deepcopy(a)
        stale.input_snapshot['revision']='changed'
        with self.assertRaises(ContractError):
            incremental_roi(a,stale)
        different=evaluate(replace(self.s,economics=replace(self.s.economics,convention=d('Another economic convention'))))
        with self.assertRaises(ContractError):
            incremental_roi(a,different)

    def test_static_break_even_rejects_changed_actual_mix(self):
        s=replace(self.s,capacity={'DTC Online':repeat(0,'can'),'Retail/Grocery':repeat(10000,'can')})
        self.assertEqual(evaluate(s).break_even.status,'not_calculable')

    def test_price_interpolation_explicit_and_normalized(self):
        response=PriceResponse('points',d('Explicit illustrative interpolation'),p(2.19,'EUR/can'),(1.79,2.19,2.59),(.617,.517,.267),True)
        s=replace(self.s,commercial=replace(self.s.commercial,price_response={c:response for c in self.s.economics.channels}))
        terms={c:replace(t,price=repeat(1.99,'EUR/can')) for c,t in s.economics.channels.items()}
        s=replace(s,economics=replace(s.economics,channels=terms))
        self.assertAlmostEqual(evaluate(s).monthly['units'][0].value,10000*.567/.517)

    def test_integrated_roi_recipe(self):
        # Total reference contribution 100, variant 180; marketing 0/50.
        s=self.zero_economics(self.s)
        s=replace(s,marketing={'paid':repeat(0,'EUR')})
        terms={c:ChannelEconomics(repeat(1,'EUR/can'),p(0,'ratio'),p(0,'ratio'),p(0,'ratio'),p(0,'EUR/can'),repeat(0,'EUR/can')) for c in s.economics.channels}
        s=replace(s,economics=replace(s.economics,channels=terms),commercial=replace(s.commercial,level=p(100/12,'can/month')))
        variant=replace(s,scenario_id='variant',commercial=replace(s.commercial,level=p(15,'can/month')),marketing={'paid':(p(50,'EUR'),)+repeat(0,'EUR')[1:]})
        result=incremental_roi(evaluate(variant),evaluate(s))
        self.assertAlmostEqual(result.delta_contribution.value,80)
        self.assertAlmostEqual(result.ratio.value,.6)
        self.assertIn('strategy change',result.label)

    def test_generated_schemas_current(self):
        from lumen_engine.json_schema import schema_for
        from lumen_engine.historical import ModelArtifact, HistoricalForecast
        for cls in (Scenario,Evaluation,DecisionPolicy,Recommendation,ROIResult,UncertaintyResult,ModelArtifact,HistoricalForecast):
            stored=json.loads(Path(f'schemas/{cls.__name__}.schema.json').read_text())
            self.assertEqual(stored,schema_for(cls))

    def test_cli_success_and_invalid_input(self):
        import subprocess,sys,tempfile
        completed=subprocess.run([sys.executable,'-m','lumen_engine','examples/scenario.json'],capture_output=True,text=True)
        self.assertEqual(completed.returncode,0,completed.stderr)
        self.assertEqual(json.loads(completed.stdout)['engine_version'],ENGINE_VERSION)
        with tempfile.TemporaryDirectory() as tmp:
            path=Path(tmp)/'invalid.json'; path.write_text('{"extra":1}')
            failed=subprocess.run([sys.executable,'-m','lumen_engine',str(path)],capture_output=True,text=True)
            self.assertEqual(failed.returncode,2)
            self.assertEqual(json.loads(failed.stderr)['status'],'invalid_input')
