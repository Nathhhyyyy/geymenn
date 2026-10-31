module.exports = async (req, res) => {
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
        model: 'openai/gpt-oss-20b',
        messages: [
          {
            role: 'system',
            content: `You are a real-time DTI SRP commodity market backend for Zamboanga City, Philippines. Return ONLY a valid JSON array of basic commodities with official DTI Suggested Retail Prices (SRP) in PHP and Centavos integer representations. Do NOT include markdown blocks (\`\`\`json). Output MUST strictly follow this structure:
[
  {"id":"c1","name":"Café Puro 3-in-1 (17g)","brand":"Café Puro","category":"Beverages","pricePHP":4.70,"priceCentavos":470},
  {"id":"c2","name":"Kopiko Black (30g)","brand":"Kopiko","category":"Beverages","pricePHP":8.50,"priceCentavos":850},
  {"id":"c3","name":"Saba Phil. Sardines (155g)","brand":"Saba","category":"Canned Goods","pricePHP":17.50,"priceCentavos":1750},
  {"id":"c4","name":"Argentina Corned Beef (150g)","brand":"Argentina","category":"Canned Goods","pricePHP":36.75,"priceCentavos":3675},
  {"id":"c5","name":"Pinoy Tasty Bread (450g)","brand":"Pinoy","category":"Bakery","pricePHP":44.00,"priceCentavos":4400},
  {"id":"c6","name":"Bear Brand Powdered Milk (135g)","brand":"Bear Brand","category":"Dairy","pricePHP":50.00,"priceCentavos":5000},
  {"id":"c7","name":"Jersey Powdered Milk (300g)","brand":"Jersey","category":"Dairy","pricePHP":96.25,"priceCentavos":9625}
]`
          },
          {
            role: 'user',
            content: 'Generate DTI commodity SRP list for Zamboanga City basic necessities with PHP and centavos integer values.'
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
        error: 'JSON extraction failed from API response.',
        raw: rawContent
      });
    }

    const items = JSON.parse(jsonMatch[0]);

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      provider: 'Groq (openai/gpt-oss-20b)',
      items: items
    });

  } catch (err) {
    return res.status(200).json({
      success: false,
      error: `Execution Failure: ${err.message}`
    });
  }
};
