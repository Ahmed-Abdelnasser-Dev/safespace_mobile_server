export function requestLoggerMiddleware(req, res, next) {
  if (process.env.NODE_ENV === "production") {
    return next();
  }

  const start = Date.now();
  const origJson = res.json.bind(res);

  let responseBodyPreview = null;

  res.json = (body) => {
    try {
      // Keep a small, safe preview for logging (truncate large bodies)
      const str = JSON.stringify(body);
      responseBodyPreview = str.length > 300 ? str.slice(0, 300) + "...(truncated)" : str;
    } catch {
      responseBodyPreview = "[unserializable]";
    }
    return origJson(body);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    const method = req.method;
    const path = req.originalUrl || req.url;
    const status = res.statusCode;

    // Simple dev-friendly line in the terminal
    const base = `[${status}] ${method} ${path} - ${duration}ms`;
    const preview = responseBodyPreview ? ` | body: ${responseBodyPreview}` : "";

    // eslint-disable-next-line no-console
    console.log(base + preview);
  });

  next();
}

