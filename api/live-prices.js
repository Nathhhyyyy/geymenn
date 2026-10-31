module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return res.status(200).json({
      success: false,
      error: 'GROQ_API_KEY is missing in Vercel settings.'
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
        model: 'openai/gpt-oss-20b',
        messages: [
          {
            role: 'system',
            content: 'You are a live JSON market endpoint. Output ONLY a valid JSON array of fuel station pricing objects for Zamboanga City (unleaded/premium/diesel prices strictly between 85.00 and 112.00 PHP). Do not use markdown syntax. Format: [{"id":"s1","name":"Petron Baliwasan","brand":"Petron","address":"Baliwasan, Zamboanga City","prices":{"unleaded":98.50,"premium":104.20,"diesel":88.50},"amenities":["Air & Water"],"updatedAt":"2026-10-31"}]'
          },
          {
            role: 'user',
            content: 'Provide current realistic retail fuel prices for Petron Baliwasan, Shell Guiwan, Caltex Tetuan, and Phoenix Putik in Zamboanga City.'
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
    const rawContent = data?.choices?.[0]?.message?.content?.trim() || '';
    const jsonMatch = rawContent.match(/\[[\s\S]*\]/);

    if (!jsonMatch) {
      return res.status(200).json({
        success: false,
        error: 'JSON parsing failed from AI output stream.',
        raw: rawContent
      });
    }

    const stations = JSON.parse(jsonMatch[0]);

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      provider: 'Groq (openai/gpt-oss-20b)',
      stations: stations
    });

  } catch (err) {
    return res.status(200).json({
      success: false,
      error: `Execution failure: ${err.message}`
    });
  }
};
