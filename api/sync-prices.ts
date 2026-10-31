import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers['authorization'];
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized cron request' });
  }

  try {
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return res.status(500).json({ error: 'Missing GROQ_API_KEY environment variable' });
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqApiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are an API data parser. Search recent Philippine news or DOE advisories for the latest weekly fuel price adjustments (Diesel, Unleaded, Premium). Return ONLY valid JSON format like: {"diesel": 120, "unleaded": -30, "premium": 0}'
          },
          {
            role: 'user',
            content: 'What are the latest official Department of Energy (DOE) weekly fuel price adjustments in the Philippines this week?'
          }
        ],
        temperature: 0.1
      })
    });

    const data = await response.json();
    const parsedChanges = JSON.parse(data.choices[0].message.content);

    return res.status(200).json({
      success: true,
      message: 'Successfully synced weekly DOE price adjustments',
      adjustments: parsedChanges,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
