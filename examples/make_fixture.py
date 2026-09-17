"""Generate the reviewable synthetic JSON input. No German default in the engine."""
import json
from pathlib import Path
from lumen_engine.contracts import *


def p(value, unit):
    return Parameter(value, unit, 'ASSUMPTION', 'Synthetic MD-08/example input, not German evidence', True)


def d(text):
    return Declaration(text, 'ASSUMPTION', 'Synthetic demonstration, pending business validation', True)


def repeat(value, unit):
    return (p(value, unit),)*12


def example_scenario():
    channels = ('DTC Online', 'Retail/Grocery')
    terms = {c: ChannelEconomics(repeat(2.19, 'EUR/can'), p(0 if c == channels[0] else .35, 'ratio'),
                p(0 if c == channels[0] else .08, 'ratio'), p(.029 if c == channels[0] else 0, 'ratio'),
                p(.35 if c == channels[0] else 0, 'EUR/can'), repeat(.62, 'EUR/can')) for c in channels}
    mix = {channels[0]: p(.6, 'ratio'), channels[1]: p(.4, 'ratio')}
    mode = ModeA('A', p(10000, 'can/month'), mix, {c: repeat(1, 'ratio') for c in channels}, repeat(1, 'ratio'),
                 {c: PriceResponse('constant', d('Volume fixed at all prices; no price elasticity claimed'), p(2.19, 'EUR/can'), (), (), False) for c in channels})
    economics = EconomicsInput(terms, repeat(100, 'EUR'), p(1000, 'EUR'), p(100, 'EUR'),
        d('Illustrative MD-05 convention; rates on same consumer price, no double fulfillment; taxes/consigne excluded explicitly for this synthetic example'), mix,
        d('Budget and fixed costs independent of volume'))
    return Scenario(SCHEMA_VERSION, 'demo-dtc', '1', 'DE', '2026-07-01', 12, mode, {'paid': repeat(400, 'EUR')}, economics,
                    d('All conditional demand satisfied; no stock or distribution constraint in this example'), {})


if __name__ == '__main__':
    Path('examples/scenario.json').write_text(json.dumps(snapshot(example_scenario()), indent=2)+'\n')
