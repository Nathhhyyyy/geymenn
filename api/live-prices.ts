import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return res.status(500).json({ success: false, error: 'Missing GROQ_API_KEY in Vercel settings.' });
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqApiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are a fuel price server. Return ONLY a valid JSON array of fuel station pricing objects for Zamboanga City with no extra markdown formatting or conversational text. Format: [{"id": "s1", "name": "Petron Baliwasan", "brand": "Petron", "address": "Baliwasan, Zamboanga City", "prices": {"unleaded": 98.50, "premium": 104.20, "diesel": 88.50}, "amenities": ["Air & Water"], "updatedAt": "2026-10-31"}]'
          },
          {
            role: 'user',
            content: 'Return current retail fuel price estimates for Petron Baliwasan, Shell Guiwan, Caltex Tetuan, and Phoenix Putik in Zamboanga City.'
          }
        ],
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ success: false, error: `Groq API Error: ${errText}` });
    }

    const data = await response.json();
    const rawContent = data.choices[0].message.content.trim();
    
    // Safely extract JSON array
    const jsonMatch = rawContent.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("Could not find valid JSON array in response.");
    }
    
    const liveStations = JSON.parse(jsonMatch[0]);

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      stations: liveStations
    });

  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
