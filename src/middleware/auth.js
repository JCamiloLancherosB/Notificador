function apiKeyAuth(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  const configuredApiKey = process.env.API_KEY;

  if (!configuredApiKey) {
    // If no API key is configured, allow all requests (dev mode)
    console.warn('Warning: No API_KEY configured. Running in open mode.');
    return next();
  }

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'API key required. Please provide X-API-Key header.'
    });
  }

  if (apiKey !== configuredApiKey) {
    return res.status(403).json({
      success: false,
      error: 'Invalid API key'
    });
  }

  next();
}

module.exports = { apiKeyAuth };
