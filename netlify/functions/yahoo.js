const HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "public, max-age=60"
};
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36";

function chunk(arr,size){const out=[];for(let i=0;i<arr.length;i+=size)out.push(arr.slice(i,i+size));return out}
function avg(arr){const a=arr.filter(v=>typeof v==="number"&&!Number.isNaN(v));return a.length?a.reduce((x,y)=>x+y,0)/a.length:undefined}
function sma(values,n){return values.length>=n?avg(values.slice(-n)):undefined}
function high(values,n){const a=values.slice(-n).filter(v=>typeof v==="number");return a.length?Math.max(...a):undefined}
function low(values,n){const a=values.slice(-n).filter(v=>typeof v==="number");return a.length?Math.min(...a):undefined}
function raw(v){if(v==null)return undefined;if(typeof v==="number")return v;if(typeof v==="object"&&typeof v.raw==="number")return v.raw;return undefined}
function rsi(values,period=14){const closes=values.filter(v=>typeof v==="number");if(closes.length<period+1)return undefined;let gains=0,losses=0;const start=closes.length-period;for(let i=start;i<closes.length;i++){const diff=closes[i]-closes[i-1];if(diff>=0)gains+=diff;else losses-=diff}const avgGain=gains/period, avgLoss=losses/period;if(avgLoss===0)return 100;const rs=avgGain/avgLoss;return 100-(100/(1+rs))}
function atr(highs,lows,closes,period=14){const h=highs.filter(v=>typeof v==="number"),l=lows.filter(v=>typeof v==="number"),c=closes.filter(v=>typeof v==="number");const len=Math.min(h.length,l.length,c.length);if(len<period+1)return undefined;const trs=[];for(let i=len-period;i<len;i++){trs.push(Math.max(h[i]-l[i],Math.abs(h[i]-c[i-1]),Math.abs(l[i]-c[i-1])))}return avg(trs)}
async function fetchText(url){const res=await fetch(url,{headers:{"User-Agent":UA,"Accept":"application/json,text/plain,*/*","Accept-Language":"en-US,en;q=0.9,th;q=0.8"}});const text=await res.text();if(!res.ok){const e=new Error(`Upstream HTTP ${res.status}`);e.status=res.status;e.detail=text.slice(0,300);throw e}return text}
async function fetchJson(url){const text=await fetchText(url);try{return JSON.parse(text)}catch{const e=new Error("Upstream returned non-JSON");e.detail=text.slice(0,300);throw e}}
async function quoteEndpoint(symbols){const url="https://query1.finance.yahoo.com/v7/finance/quote?symbols="+encodeURIComponent(symbols.join(","));const data=await fetchJson(url);return data?.quoteResponse?.result||[]}

function enrichIndicators(base, arrays){
  const closes=arrays.closes||[], highs=arrays.highs||[], lows=arrays.lows||[];
  base.deep=true;
  base.indicators={rsi14:rsi(closes,14),sma5:sma(closes,5),sma20:sma(closes,20),sma50:sma(closes,50),atr14:atr(highs,lows,closes,14),high20:high(highs,20),low20:low(lows,20)};
  return base;
}
async function yahooChartEndpoint(symbol, withIndicators=true){
  const url="https://query1.finance.yahoo.com/v8/finance/chart/"+encodeURIComponent(symbol)+"?range=6mo&interval=1d";
  const data=await fetchJson(url);
  const result=data?.chart?.result?.[0];if(!result)return null;
  const meta=result.meta||{},q=result.indicators?.quote?.[0]||{};
  const closes=(q.close||[]).filter(v=>typeof v==="number"),opens=(q.open||[]).filter(v=>typeof v==="number"),highs=(q.high||[]).filter(v=>typeof v==="number"),lows=(q.low||[]).filter(v=>typeof v==="number"),vols=(q.volume||[]).filter(v=>typeof v==="number");
  const last=arr=>arr.length?arr[arr.length-1]:undefined;
  const base={symbol,shortName:meta.shortName||symbol,longName:meta.longName||meta.shortName||symbol,currency:meta.currency,regularMarketPrice:meta.regularMarketPrice||last(closes),regularMarketPreviousClose:meta.previousClose||(closes.length>=2?closes[closes.length-2]:undefined),regularMarketOpen:last(opens),regularMarketDayHigh:meta.regularMarketDayHigh||last(highs),regularMarketDayLow:meta.regularMarketDayLow||last(lows),regularMarketVolume:meta.regularMarketVolume||last(vols),averageDailyVolume10Day:avg(vols.slice(-10)),averageDailyVolume3Month:avg(vols.slice(-20)),marketState:meta.marketState||"YAHOO_CHART",source:"live"};
  return withIndicators?enrichIndicators(base,{closes,highs,lows}):base;
}

function stooqSymbol(symbol){
  const s=String(symbol).toLowerCase();
  if(s.endsWith(".bk"))return null;
  if(s.includes("="))return null;
  return s.replace(".us","")+".us";
}
function parseStooqCsv(text){
  const lines=text.trim().split(/\r?\n/);
  if(lines.length<2 || !/date/i.test(lines[0])) return null;
  const rows=[];
  for(const line of lines.slice(1)){
    const parts=line.split(",");
    if(parts.length<6)continue;
    const open=Number(parts[1]), high=Number(parts[2]), low=Number(parts[3]), close=Number(parts[4]), volume=Number(parts[5]);
    if(Number.isFinite(close))rows.push({open,high,low,close,volume});
  }
  return rows.length?rows:null;
}
async function stooqChartEndpoint(symbol, withIndicators=true){
  const mapped=stooqSymbol(symbol);
  if(!mapped)return null;
  const url="https://stooq.com/q/d/l/?s="+encodeURIComponent(mapped)+"&i=d";
  const text=await fetchText(url);
  const rows=parseStooqCsv(text);
  if(!rows)return null;
  const last=rows[rows.length-1], prev=rows.length>=2?rows[rows.length-2]:null;
  const closes=rows.map(r=>r.close), highs=rows.map(r=>r.high), lows=rows.map(r=>r.low), vols=rows.map(r=>r.volume);
  const base={symbol,shortName:symbol,longName:symbol,currency:"USD",regularMarketPrice:last.close,regularMarketPreviousClose:prev?prev.close:undefined,regularMarketOpen:last.open,regularMarketDayHigh:last.high,regularMarketDayLow:last.low,regularMarketVolume:last.volume,averageDailyVolume10Day:avg(vols.slice(-10)),averageDailyVolume3Month:avg(vols.slice(-20)),marketState:"STOOQ_FALLBACK",source:"stooq"};
  return withIndicators?enrichIndicators(base,{closes,highs,lows}):base;
}
async function chartEndpoint(symbol, withIndicators=true){
  try{return await yahooChartEndpoint(symbol,withIndicators)}catch(e){}
  return await stooqChartEndpoint(symbol,withIndicators);
}

function extractFundamentals(symbol,data){const result=data?.quoteSummary?.result?.[0];if(!result)return null;const fd=result.financialData||{},ks=result.defaultKeyStatistics||{},sd=result.summaryDetail||{},ap=result.assetProfile||{};const fund={hasFundamentals:true,sector:ap.sector,industry:ap.industry,targetMeanPrice:raw(fd.targetMeanPrice),returnOnEquity:raw(fd.returnOnEquity),profitMargins:raw(fd.profitMargins)||raw(ks.profitMargins),revenueGrowth:raw(fd.revenueGrowth),earningsGrowth:raw(fd.earningsGrowth),debtToEquity:raw(fd.debtToEquity),dividendYield:raw(sd.dividendYield),trailingPE:raw(sd.trailingPE)||raw(ks.trailingPE),forwardPE:raw(ks.forwardPE),priceToBook:raw(ks.priceToBook),marketCap:raw(sd.marketCap)||raw(ks.marketCap),beta:raw(ks.beta)||raw(sd.beta)};const hasAny=Object.keys(fund).some(k=>k!=="hasFundamentals"&&fund[k]!=null);return hasAny?fund:null}
async function fundamentalsEndpoint(symbol){const modules=["financialData","defaultKeyStatistics","summaryDetail","assetProfile"].join(",");const urls=["https://query1.finance.yahoo.com/v10/finance/quoteSummary/"+encodeURIComponent(symbol)+"?modules="+modules,"https://query2.finance.yahoo.com/v10/finance/quoteSummary/"+encodeURIComponent(symbol)+"?modules="+modules];let lastErr;for(const url of urls){try{const data=await fetchJson(url);const fund=extractFundamentals(symbol,data);if(fund)return fund}catch(e){lastErr=e}}if(lastErr)throw lastErr;return null}

exports.handler=async(event)=>{
  try{
    const rawSymbols=event.queryStringParameters?.symbols||"";
    const deepLimit=Math.max(10,Math.min(90,Number(event.queryStringParameters?.deepLimit||70)));
    const fundLimit=Math.max(0,Math.min(60,Number(event.queryStringParameters?.fundLimit||25)));
    const symbols=[...new Set(rawSymbols.split(",").map(s=>s.trim().toUpperCase()).filter(Boolean))].slice(0,220);
    if(!symbols.length)return{statusCode:400,headers:HEADERS,body:JSON.stringify({ok:false,error:"No symbols provided"})};
    let quotes=[],errors=[];
    for(const group of chunk(symbols,45)){try{quotes.push(...(await quoteEndpoint(group)).map(q=>({...q,source:"live"})))}catch(e){errors.push({stage:"quote",group:group.join(","),message:e.message,status:e.status||null,detail:e.detail||""})}}
    const got=new Set(quotes.map(q=>String(q.symbol||"").toUpperCase()));
    const missing=symbols.filter(s=>!got.has(s));
    for(const group of chunk(missing.slice(0,100),10)){
      const results=await Promise.allSettled(group.map(symbol=>chartEndpoint(symbol,false)));
      for(let i=0;i<results.length;i++){const r=results[i],symbol=group[i];if(r.status==="fulfilled"&&r.value&&r.value.regularMarketPrice)quotes.push(r.value);else errors.push({stage:"chart-fallback",symbol,message:r.status==="rejected"?r.reason.message:"No chart data"})}
    }
    const bySymbol={};for(const q of quotes){if(q&&q.symbol)bySymbol[String(q.symbol).toUpperCase()]=q}
    quotes=Object.values(bySymbol);

    const deepSymbols=quotes.map(q=>{const symbol=String(q.symbol).toUpperCase(),price=Number(q.regularMarketPrice||0),vol=Number(q.regularMarketVolume||0),avgVol=Number(q.averageDailyVolume3Month||q.averageDailyVolume10Day||0),prev=Number(q.regularMarketPreviousClose||q.regularMarketOpen||0);const change=prev>0?(price-prev)/prev*100:0,volSpike=avgVol>0?vol/avgVol:0;const isGold=["GC=F","GLD","IAU","SGOL","PHYS","GDX","GDXJ","NEM","GOLD","AEM","KGC","FNV","WPM","RGLD","AU","SIL","SLV"].includes(symbol);const score=Math.abs(change)*8+volSpike*20+(price*vol>0?10:0)+(isGold?100:0);return{symbol,score}}).sort((a,b)=>b.score-a.score).slice(0,deepLimit).map(x=>x.symbol);
    const deepResults=[];
    for(const group of chunk(deepSymbols,8)){
      const results=await Promise.allSettled(group.map(symbol=>chartEndpoint(symbol,true)));
      for(let i=0;i<results.length;i++){const r=results[i],symbol=group[i];if(r.status==="fulfilled"&&r.value&&r.value.regularMarketPrice)deepResults.push(r.value);else errors.push({stage:"chart-deep",symbol,message:r.status==="rejected"?r.reason.message:"No deep chart data"})}
    }
    for(const q of deepResults){if(q&&q.symbol)bySymbol[String(q.symbol).toUpperCase()]=q}
    quotes=Object.values(bySymbol);

    const fundSymbols=quotes.map(q=>{const symbol=String(q.symbol).toUpperCase();const price=Number(q.regularMarketPrice||0),vol=Number(q.regularMarketVolume||0);const isEtfOrGold=["GC=F","GLD","IAU","SGOL","PHYS","SPY","QQQ","DIA","IWM","XLK","XLF","XLE","XLV","XLY","XLP","TLT","HYG"].includes(symbol);const score=(price*vol>0?Math.log10(price*vol+1):0)+(isEtfOrGold?-100:0);return{symbol,score}}).sort((a,b)=>b.score-a.score).slice(0,fundLimit).map(x=>x.symbol);
    let fundCount=0;
    for(const group of chunk(fundSymbols,6)){
      const results=await Promise.allSettled(group.map(symbol=>fundamentalsEndpoint(symbol)));
      for(let i=0;i<results.length;i++){const r=results[i],symbol=group[i];if(r.status==="fulfilled"&&r.value&&bySymbol[symbol]){bySymbol[symbol].fundamentals=r.value;fundCount++}else if(r.status==="rejected"){errors.push({stage:"fundamentals",symbol,message:r.reason.message,status:r.reason.status||null,detail:r.reason.detail||""})}}
    }

    quotes=Object.values(bySymbol);
    const returned=new Set(quotes.map(q=>String(q.symbol||"").toUpperCase()));
    return{statusCode:200,headers:HEADERS,body:JSON.stringify({ok:true,source:"Yahoo + Stooq chart fallback + local cache ready V9",requested:symbols.length,count:quotes.length,deepCount:deepResults.length,fundCount,quotes,missing:symbols.filter(s=>!returned.has(s)),errors:errors.slice(0,60)})}
  }catch(err){return{statusCode:200,headers:HEADERS,body:JSON.stringify({ok:false,error:err.message||"Function failed",quotes:[]})}}
};
