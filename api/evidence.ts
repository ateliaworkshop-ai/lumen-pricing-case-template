import { EVIDENCE_CATALOG } from '../src/data/evidenceCatalog';

export default function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'GET') {
    const { id } = req.query || {};
    if (id) {
      const exhibit = EVIDENCE_CATALOG.find(e => e.id === id);
      if (!exhibit) {
        return res.status(404).json({ error: `Exhibit with id '${id}' not found` });
      }
      return res.status(200).json({ exhibit });
    }

    return res.status(200).json({
      total: EVIDENCE_CATALOG.length,
      exhibits: EVIDENCE_CATALOG
    });
  }

  res.status(405).json({ error: 'Method Not Allowed. Use GET.' });
}
