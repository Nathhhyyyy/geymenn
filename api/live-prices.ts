import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return res.status(500).json({ error: 'Missing GROQ_API_KEY environment variable' });
    }

    // Query Groq to pull current localized market pricing for Zamboanga City stations
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
            content: 'You are a fuel price data provider for Zamboanga City, Philippines. Return current realistic retail pump prices per liter in strict JSON array format only, with no extra markdown text, like this: [{"id": "s1", "name": "Petron Baliwasan", "brand": "Petron", "address": "Baliwasan, Zamboanga City", "prices": {"unleaded": 98.50, "premium": 104.20, "diesel": 88.50}, "amenities": ["Air & Water"], "updatedAt": "2026-10-31"}]'
          },
          {
            role: 'user',
            content: 'Provide the latest updated retail fuel prices for Petron Baliwasan, Shell Guiwan, Caltex Tetuan, and Phoenix Putik in Zamboanga City.'
          }
        ],
        temperature: 0.1
      })
    });

    const data = await response.json();
    const rawContent = data.choices[0].message.content;
    
    // Clean and parse the JSON payload from the AI response
    const jsonString = rawContent.substring(rawContent.indexOf('['), rawContent.lastIndexOf(']') + 1);
    const liveStations = JSON.parse(jsonString);

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      stations: liveStations
    });

  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
