import {
  COMPETITOR_PROFILES,
  COMPETITOR_PRICES_BY_CHANNEL,
  COMPETITOR_PRICE_HISTORY,
  GERMAN_CONSUMER_SURVEY_SUMMARY
} from '../src/data/competitorData';

export default function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'GET') {
    return res.status(200).json({
      profiles: COMPETITOR_PROFILES,
      pricesByChannel: COMPETITOR_PRICES_BY_CHANNEL,
      priceHistory: COMPETITOR_PRICE_HISTORY,
      surveySummary: GERMAN_CONSUMER_SURVEY_SUMMARY
    });
  }

  res.status(405).json({ error: 'Method Not Allowed. Use GET.' });
}
