const yahooFinance = require("yahoo-finance2").default;

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json; charset=utf-8"
  };

  try {
    const raw = event.queryStringParameters?.symbols || "";
    const symbols = raw
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean)
      .slice(0, 50);

    if (!symbols.length) {
      return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: "No symbols provided" }) };
    }

    const result = await yahooFinance.quote(symbols, {
      fields: [
        "symbol",
        "shortName",
        "longName",
        "currency",
        "regularMarketPrice",
        "regularMarketPreviousClose",
        "regularMarketOpen",
        "regularMarketDayHigh",
        "regularMarketDayLow",
        "regularMarketVolume",
        "averageDailyVolume10Day",
        "averageDailyVolume3Month",
        "marketState"
      ]
    });

    const quotes = Array.isArray(result) ? result : [result];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ok: true,
        source: "Yahoo Finance via yahoo-finance2",
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
        error: err.message || "Yahoo Finance function failed"
      })
    };
  }
};
