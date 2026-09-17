import { evaluateScenario } from '../src/engine/calculator';
import { DEFAULT_SCENARIOS } from '../src/data/defaultScenarios';
import { Scenario } from '../src/types/simulator';

export default function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method Not Allowed. Send a POST request with a scenario payload or scenarioId.'
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    let scenarioToEvaluate: Scenario | undefined;

    if (body.scenario) {
      scenarioToEvaluate = body.scenario;
    } else if (body.scenarioId) {
      const queryId = String(body.scenarioId).toLowerCase().trim();
      scenarioToEvaluate = DEFAULT_SCENARIOS.find(s => 
        s.id.toLowerCase() === queryId || 
        s.id.toLowerCase().includes(queryId) ||
        s.name.toLowerCase().includes(queryId)
      );
      if (!scenarioToEvaluate) {
        return res.status(404).json({
          error: `Scenario '${body.scenarioId}' not found. Available IDs: ${DEFAULT_SCENARIOS.map(s => s.id).join(', ')}`
        });
      }
    } else if (body.id && body.commercialA) {
      // Direct scenario object
      scenarioToEvaluate = body;
    } else {
      // Default to reference scenario if none provided
      scenarioToEvaluate = DEFAULT_SCENARIOS[0];
    }

    const evaluation = evaluateScenario(scenarioToEvaluate!);

    return res.status(200).json({
      scenarioId: scenarioToEvaluate!.id,
      scenarioName: scenarioToEvaluate!.name,
      evaluation
    });
  } catch (err: any) {
    return res.status(400).json({
      error: 'Evaluation failed',
      details: err.message || 'Unknown calculation error'
    });
  }
}
