const BASE_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "public, max-age=60"
};

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36";

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      "Accept": "application/json,text/plain,*/*",
      "Accept-Language": "en-US,en;q=0.9,th;q=0.8"
    }
  });

  const text = await res.text();

  if (!res.ok) {
    const err = new Error(`Upstream HTTP ${res.status}`);
    err.status = res.status;
    err.detail = text.slice(0, 300);
    throw err;
  }

  try {
    return JSON.parse(text);
  } catch (e) {
    const err = new Error("Upstream returned non-JSON");
    err.detail = text.slice(0, 300);
    throw err;
  }
}

async function quoteEndpoint(symbols) {
  const url =
    "https://query1.finance.yahoo.com/v7/finance/quote?symbols=" +
    encodeURIComponent(symbols.join(","));

  const data = await fetchJson(url);
  return data?.quoteResponse?.result || [];
}

async function chartEndpoint(symbol) {
  const url =
    "https://query1.finance.yahoo.com/v8/finance/chart/" +
    encodeURIComponent(symbol) +
    "?range=3mo&interval=1d";

  const data = await fetchJson(url);
  const result = data?.chart?.result?.[0];
  if (!result) return null;

  const meta = result.meta || {};
  const quote = result.indicators?.quote?.[0] || {};
  const closes = (quote.close || []).filter((v) => typeof v === "number");
  const opens = (quote.open || []).filter((v) => typeof v === "number");
  const highs = (quote.high || []).filter((v) => typeof v === "number");
  const lows = (quote.low || []).filter((v) => typeof v === "number");
  const vols = (quote.volume || []).filter((v) => typeof v === "number");

  const last = (arr) => arr.length ? arr[arr.length - 1] : undefined;
  const prev = closes.length >= 2 ? closes[closes.length - 2] : meta.previousClose;
  const recentVols = vols.slice(-20);
  const avgVol = recentVols.length
    ? Math.round(recentVols.reduce((a, b) => a + b, 0) / recentVols.length)
    : undefined;

  return {
    symbol,
    shortName: meta.shortName || symbol,
    longName: meta.longName || meta.shortName || symbol,
    currency: meta.currency,
    regularMarketPrice: meta.regularMarketPrice || last(closes),
    regularMarketPreviousClose: meta.previousClose || prev,
    regularMarketOpen: last(opens),
    regularMarketDayHigh: meta.regularMarketDayHigh || last(highs),
    regularMarketDayLow: meta.regularMarketDayLow || last(lows),
    regularMarketVolume: meta.regularMarketVolume || last(vols),
    averageDailyVolume10Day: avgVol,
    averageDailyVolume3Month: avgVol,
    marketState: meta.marketState || "CHART_FALLBACK"
  };
}

exports.handler = async (event) => {
  const headers = BASE_HEADERS;

  try {
    const raw = event.queryStringParameters?.symbols || "";
    const symbols = [...new Set(raw
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean))]
      .slice(0, 220);

    if (!symbols.length) {
      return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: "No symbols provided" }) };
    }

    let quotes = [];
    const errors = [];

    // Quote endpoint in batches to avoid huge URLs and reduce blocking.
    for (const group of chunk(symbols, 45)) {
      try {
        const q = await quoteEndpoint(group);
        quotes.push(...q);
      } catch (e) {
        errors.push({ stage: "quote", group: group.join(","), message: e.message, status: e.status || null, detail: e.detail || "" });
      }
    }

    const got = new Set((quotes || []).map((q) => String(q.symbol || "").toUpperCase()));
    const missing = symbols.filter((s) => !got.has(s));

    // Fallback chart endpoint, but cap to avoid timeout. Prioritize first 80 missing.
    const fallbackTargets = missing.slice(0, 80);
    for (const group of chunk(fallbackTargets, 8)) {
      const results = await Promise.allSettled(group.map((symbol) => chartEndpoint(symbol)));
      for (let i = 0; i < results.length; i++) {
        const r = results[i];
        const symbol = group[i];
        if (r.status === "fulfilled" && r.value && r.value.regularMarketPrice) {
          quotes.push(r.value);
        } else {
          errors.push({
            stage: "chart",
            symbol,
            message: r.status === "rejected" ? r.reason.message : "No chart data",
            status: r.status === "rejected" ? (r.reason.status || null) : null,
            detail: r.status === "rejected" ? (r.reason.detail || "") : ""
          });
        }
      }
    }

    // Deduplicate.
    const bySymbol = {};
    for (const q of quotes) {
      if (q && q.symbol) bySymbol[String(q.symbol).toUpperCase()] = q;
    }
    quotes = Object.values(bySymbol);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ok: true,
        source: "Yahoo Finance quote batches + chart fallback",
        requested: symbols.length,
        count: quotes.length,
        quotes,
        errors: errors.slice(0, 30)
      })
    };
  } catch (err) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: false, error: err.message || "Function failed", quotes: [] })
    };
  }
};
