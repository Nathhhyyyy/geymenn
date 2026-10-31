import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Always set JSON content type and CORS headers
  res.setHeader('Content-Type', 'application/json');

  try {
    const groqApiKey = process.env.GROQ_API_KEY;

    // Guard check for key existence
    if (!groqApiKey) {
      return res.status(200).json({ 
        success: false, 
        error: 'GROQ_API_KEY is not defined in Vercel Environment Variables.' 
      });
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
            content: 'You are a JSON backend provider. Output strict JSON array format only. Format: [{"id": "s1", "name": "Petron Baliwasan", "brand": "Petron", "address": "Baliwasan, Zamboanga City", "prices": {"unleaded": 98.50, "premium": 104.20, "diesel": 88.50}, "amenities": ["Air & Water"], "updatedAt": "2026-10-31"}]'
          },
          {
            role: 'user',
            content: 'Provide current retail fuel prices in Zamboanga City for Petron Baliwasan, Shell Guiwan, Caltex Tetuan, and Phoenix Putik.'
          }
        ],
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      return res.status(200).json({ 
        success: false, 
        error: `Groq API HTTP Error ${response.status}: ${errBody}` 
      });
    }

    const data: any = await response.json();
    const rawContent = data?.choices?.[0]?.message?.content || '';

    // Extract JSON array cleanly
    const jsonMatch = rawContent.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return res.status(200).json({ 
        success: false, 
        error: 'Failed to extract valid JSON array from AI payload.',
        raw: rawContent 
      });
    }

    const liveStations = JSON.parse(jsonMatch[0]);

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      stations: liveStations
    });

  } catch (error: any) {
    // Return 200 with success: false to prevent 500 Function Crash pages in browser
    return res.status(200).json({ 
      success: false, 
      error: error?.message || 'Unknown server error' 
    });
  }
}
