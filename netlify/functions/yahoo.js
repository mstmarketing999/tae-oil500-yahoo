exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "public, max-age=60"
  };

  try {
    const raw = event.queryStringParameters?.symbols || "";
    const symbols = raw
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean)
      .slice(0, 50);

    if (!symbols.length) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ ok: false, error: "No symbols provided" })
      };
    }

    const yahooUrl =
      "https://query1.finance.yahoo.com/v7/finance/quote?symbols=" +
      encodeURIComponent(symbols.join(","));

    const response = await fetch(yahooUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        "Accept": "application/json,text/plain,*/*"
      }
    });

    const text = await response.text();

    if (!response.ok) {
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({
          ok: false,
          error: "Yahoo upstream HTTP " + response.status,
          detail: text.slice(0, 500)
        })
      };
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({
          ok: false,
          error: "Yahoo returned non-JSON response",
          detail: text.slice(0, 500)
        })
      };
    }

    const quotes = data?.quoteResponse?.result || [];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ok: true,
        source: "Yahoo Finance query1 quote endpoint via Netlify Function",
        requested: symbols.length,
        count: quotes.length,
        quotes
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        ok: false,
        error: err.message || "Function failed"
      })
    };
  }
};
