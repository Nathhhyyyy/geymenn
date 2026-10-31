module.exports = async (req, res) => {
  // Always send JSON headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return res.status(200).json({
      success: false,
      error: 'GROQ_API_KEY environment variable is missing on Vercel.'
    });
  }

  try {
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
            content: 'You are a JSON backend. Output strict JSON array format only with retail pump prices per liter in Zamboanga City (range 85.00 to 112.00 PHP). Format: [{"id":"s1","name":"Petron Baliwasan","brand":"Petron","address":"Baliwasan, Zamboanga City","prices":{"unleaded":98.50,"premium":104.20,"diesel":88.50},"amenities":["Air & Water"],"updatedAt":"2026-10-31"}]'
          },
          {
            role: 'user',
            content: 'Provide current realistic fuel prices for Petron Baliwasan, Shell Guiwan, Caltex Tetuan, and Phoenix Putik.'
          }
        ],
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(200).json({
        success: false,
        error: `Groq HTTP ${response.status}: ${errText}`
      });
    }

    const data = await response.json();
    const rawContent = data.choices[0].message.content.trim();
    const jsonMatch = rawContent.match(/\[[\s\S]*\]/);

    if (!jsonMatch) {
      return res.status(200).json({
        success: false,
        error: 'Could not match JSON array format from API output.',
        raw: rawContent
      });
    }

    const stations = JSON.parse(jsonMatch[0]);

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      stations: stations
    });

  } catch (err) {
    return res.status(200).json({
      success: false,
      error: `Serverless error: ${err.message}`
    });
  }
};
