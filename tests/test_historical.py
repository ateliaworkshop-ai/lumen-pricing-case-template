from dataclasses import replace
from datetime import date, timedelta
import csv
import json
import math
import unittest
from pathlib import Path
from lumen_engine.contracts import ContractError, decode, snapshot
from lumen_engine.historical import *
from examples.make_fixture import d

class HistoricalTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.rows=read_sales('data/historical_sales_weekly.csv')
        cls.model=RidgeForecaster()
        cls.artifacts={origin:cls.model.fit(cls.rows,origin) for origin in ('2025-07-07','2026-01-05','2026-04-06','2026-06-29')}

    def test_poc_predictions_nonregression(self):
        forecasts={o:{(p.week,p.series):p.units for p in self.model.predict(a,52 if a.train_weeks==26 else 26 if a.train_weeks==52 else 13).points} for o,a in self.artifacts.items() if a.train_weeks != 77}
        by_origin={a.train_weeks:o for o,a in self.artifacts.items()}
        count=0
        with open('analysis/forecasting/predictions.csv') as f:
            for row in csv.DictReader(f):
                if row['model']=='ridge' and row['sensitivity']=='all':
                    actual=forecasts[by_origin[int(row['origin'])]][(row['date'],row['country']+'|'+row['channel'])]
                    self.assertAlmostEqual(actual,float(row['prediction']),delta=1e-7)
                    count+=1
        self.assertEqual(count,1287)

    def test_future_target_poisoning_and_determinism(self):
        origin='2026-01-05'
        poisoned=tuple(replace(r,units=-999999) if r.week>=origin else r for r in self.rows)
        artifact=self.model.fit(poisoned,origin)
        self.assertEqual(snapshot(artifact),snapshot(self.artifacts[origin]))
        restored=decode(ModelArtifact,json.loads(json.dumps(snapshot(artifact))))
        self.assertEqual(self.model.predict(artifact,13),self.model.predict(restored,13))

    def test_no_german_series_or_gaps(self):
        with self.assertRaises(ContractError):
            self.model.fit(tuple(replace(r,country='Germany') for r in self.rows),'2026-01-05')
        with self.assertRaises(ContractError):
            self.model.fit(tuple(r for r in self.rows if r.week!='2025-02-03'),'2026-01-05')
        with self.assertRaises(ContractError):
            self.model.fit(self.rows,'2025-02-03')

    def test_conflicting_duplicates(self):
        with self.assertRaises(ContractError):
            self.model.fit(self.rows+(replace(self.rows[0],units=self.rows[0].units+1),),'2026-01-05')

    def test_calendar_conservation_and_coverage(self):
        forecast=self.model.predict(self.artifacts['2026-06-29'],53)
        key='Netherlands|DTC Online'
        months,excluded=calendarize(forecast,key,'2026-07-01')
        self.assertAlmostEqual(sum(months)+excluded,sum(p.units for p in forecast.points if p.series==key),places=7)
        with self.assertRaises(ContractError):
            calendarize(self.model.predict(self.artifacts['2026-06-29'],52),key,'2026-07-01')

    def test_profile_strips_level_and_trend(self):
        a=self.artifacts['2026-06-29']; forecast=self.model.predict(a,53)
        coefficients=(a.coefficients[0]+.5,)+a.coefficients[1:]
        changed=replace(a,intercept=a.intercept+.3,coefficients=coefficients)
        profile=german_season_profile(forecast,'Netherlands|DTC Online','2026-07-01',d('Explicit transfer'))
        other=german_season_profile(self.model.predict(changed,53),'Netherlands|DTC Online','2026-07-01',d('Explicit transfer'))
        self.assertEqual([p.value for p in profile],[p.value for p in other])
        self.assertAlmostEqual(sum(p.value for p in profile),12)
        self.assertTrue(all(p.kind=='ASSUMPTION' for p in profile))
        with self.assertRaises(ContractError):
            german_season_profile(forecast,'Netherlands|DTC Online','2026-07-01',replace(d('Transfer'),accepted=False))

    def test_explicit_fallback(self):
        f=baseline_forecast(self.rows,'2025-02-03',13,'last','insufficient Ridge training history')
        self.assertEqual(f.model_version,'last/1.0.0')
        with self.assertRaises(ContractError):
            baseline_forecast(self.rows,'2025-02-03',13,'seasonal52','explicit comparison')
        with self.assertRaises(ContractError):
            german_season_profile(f,'Netherlands|DTC Online','2025-02-01',d('Transfer'))

    def test_invalid_artifact_version(self):
        with self.assertRaises(ContractError):
            self.model.predict(replace(self.artifacts['2026-01-05'],model_version='other'),13)

class EndToEndTests(unittest.TestCase):
    def test_complete_example(self):
        from examples.run import run
        result=run()
        self.assertEqual(result['evaluation']['checkpoints']['12']['units']['status'],'ok')
        self.assertEqual(result['recommendation']['status'],'conditional')
        self.assertEqual(len(result['uncertainty']['evaluations']),3)
        self.assertEqual(result['roi_without_counterfactual']['ratio']['status'],'not_calculable')
        json.dumps(result,allow_nan=False)
