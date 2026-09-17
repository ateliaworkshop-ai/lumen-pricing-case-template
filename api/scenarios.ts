import { DEFAULT_SCENARIOS } from '../src/data/defaultScenarios';

export default function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'GET') {
    const { id } = req.query || {};
    if (id) {
      const scenario = DEFAULT_SCENARIOS.find(s => s.id === id);
      if (!scenario) {
        return res.status(404).json({ error: `Scenario with id '${id}' not found` });
      }
      return res.status(200).json({ scenario });
    }

    return res.status(200).json({
      total: DEFAULT_SCENARIOS.length,
      scenarios: DEFAULT_SCENARIOS
    });
  }

  res.status(405).json({ error: 'Method Not Allowed. Use GET.' });
}
