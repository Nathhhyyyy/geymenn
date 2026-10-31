import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Enable CORS for browser requests
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return res.status(200).json({
      success: false,
      error: 'GROQ_API_KEY environment variable missing in Vercel.'
    });
  }

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are a JSON market data generator. Return ONLY a valid JSON array of fuel stations in Zamboanga City with retail prices in the range of 85 to 112 PHP. Format: [{"id":"s1","name":"Petron Baliwasan","brand":"Petron","address":"Baliwasan, Zamboanga City","prices":{"unleaded":98.50,"premium":104.20,"diesel":88.50},"amenities":["Air & Water"],"updatedAt":"2026-10-31"}]'
          },
          {
            role: 'user',
            content: 'Generate realistic fuel station prices for Petron Baliwasan, Shell Guiwan, Caltex Tetuan, and Phoenix Putik in Zamboanga City.'
          }
        ],
        temperature: 0.1
      })
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      return res.status(200).json({
        success: false,
        error: `Groq HTTP Error ${groqRes.status}: ${errText}`
      });
    }

    const data: any = await groqRes.json();
    const rawContent = data?.choices?.[0]?.message?.content || '';
    const jsonMatch = rawContent.match(/\[[\s\S]*\]/);

    if (!jsonMatch) {
      return res.status(200).json({
        success: false,
        error: 'Invalid JSON payload returned from backend parser.'
      });
    }

    const stations = JSON.parse(jsonMatch[0]);

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      stations: stations
    });

  } catch (error: any) {
    return res.status(200).json({
      success: false,
      error: error?.message || 'Server runtime error.'
    });
  }
}
