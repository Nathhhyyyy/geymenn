import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS and JSON Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Access Groq key set in Vercel Environment Variables
  const groqApiKey = process.env.GROQ_API_KEY;

  if (!groqApiKey) {
    return res.status(200).json({
      success: false,
      error: 'GROQ_API_KEY missing in Vercel settings. Ensure it is added as GROQ_API_KEY.'
    });
  }

  try {
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
            content: `You are a real-time fuel data provider for Zamboanga City, Philippines. Return ONLY a valid JSON array of station objects with retail pump prices per liter in the current range (₱85.00 to ₱112.00/L). Do NOT output markdown code block ticks (\`\`\`json) or conversational text. Format strictly: [{"id":"s1","name":"Petron Baliwasan","brand":"Petron","address":"Baliwasan, Zamboanga City","prices":{"unleaded":98.50,"premium":104.20,"diesel":88.50},"amenities":["Air & Water","Treats Store"],"updatedAt":"${new Date().toISOString().split('T')[0]}"}]`
          },
          {
            role: 'user',
            content: 'Output current station pricing for Petron Baliwasan, Shell Guiwan, Caltex Tetuan, and Phoenix Putik in Zamboanga City.'
          }
        ],
        temperature: 0.1
      })
    });

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      return res.status(200).json({
        success: false,
        error: `Groq HTTP Error ${groqResponse.status}: ${errorText}`
      });
    }

    const data: any = await groqResponse.json();
    const rawContent = data?.choices?.[0]?.message?.content || '';

    // Safely extract standard JSON Array string from output
    const jsonMatch = rawContent.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return res.status(200).json({
        success: false,
        error: 'Backend failed to parse JSON array from Groq output.',
        raw: rawContent
      });
    }

    const liveStations = JSON.parse(jsonMatch[0]);

    return res.status(200).json({
      success: true,
      provider: 'Groq Cloud API (llama-3.3-70b-versatile)',
      timestamp: new Date().toISOString(),
      stations: liveStations
    });

  } catch (err: any) {
    return res.status(200).json({
      success: false,
      error: `Serverless exception: ${err?.message || 'Unknown execution error'}`
    });
  }
}
