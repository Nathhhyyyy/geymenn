export const config = {
  runtime: 'nodejs',
};

export default async function handler(req: any, res: any) {
  // Guard headers
  if (res && typeof res.setHeader === 'function') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  try {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      const errPayload = {
        success: false,
        error: 'GROQ_API_KEY is not defined in Vercel Environment Variables.'
      };
      return res ? res.status(200).json(errPayload) : new Response(JSON.stringify(errPayload));
    }

    // Call Groq API via standard fetch
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
            content: 'You output valid JSON array format only. Do not wrap in markdown. Format: [{"id":"s1","name":"Petron Baliwasan","brand":"Petron","address":"Baliwasan, Zamboanga City","prices":{"unleaded":98.50,"premium":104.20,"diesel":88.50},"amenities":["Air & Water"],"updatedAt":"2026-10-31"}]'
          },
          {
            role: 'user',
            content: 'Provide retail fuel prices for Petron Baliwasan, Shell Guiwan, Caltex Tetuan, and Phoenix Putik in Zamboanga City.'
          }
        ],
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      const errPayload = {
        success: false,
        error: `Groq HTTP ${response.status}: ${errText}`
      };
      return res ? res.status(200).json(errPayload) : new Response(JSON.stringify(errPayload));
    }

    const data: any = await response.json();
    const rawContent = data?.choices?.[0]?.message?.content || '';

    const jsonMatch = rawContent.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      const errPayload = {
        success: false,
        error: 'Failed to parse JSON array from Groq output.',
        raw: rawContent
      };
      return res ? res.status(200).json(errPayload) : new Response(JSON.stringify(errPayload));
    }

    const stations = JSON.parse(jsonMatch[0]);

    const successPayload = {
      success: true,
      timestamp: new Date().toISOString(),
      stations: stations
    };

    return res ? res.status(200).json(successPayload) : new Response(JSON.stringify(successPayload));

  } catch (error: any) {
    const crashPayload = {
      success: false,
      error: `Execution Exception: ${error?.message || 'Unknown error'}`
    };
    return res ? res.status(200).json(crashPayload) : new Response(JSON.stringify(crashPayload));
  }
}
