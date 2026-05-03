export const config = {
  runtime: 'nodejs',
};

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
    });
  }

  try {
    // Get messages and system prompt from frontend
    const { messages, system } = req.body;

    // Check API key exists
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({
        error: 'Missing ANTHROPIC_API_KEY in environment variables',
      });
    }

    // Create timeout controller (20 seconds)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    // Send request to Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        system,
        messages,
      }),
    });

    // Clear timeout after response
    clearTimeout(timeout);

    // Handle Anthropic API errors
    if (!response.ok) {
      const errorData = await response.text();

      return res.status(response.status).json({
        error: 'Anthropic API Error',
        details: errorData,
      });
    }

    // Parse response data
    const data = await response.json();

    // Return successful response
    return res.status(200).json(data);

  } catch (error) {
    // Handle timeout or other server errors
    return res.status(500).json({
      error: error.message || 'Internal server error',
    });
  }
}
