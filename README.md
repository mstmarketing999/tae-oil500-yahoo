# Tae&oil500 V8 Fundamental Upgrade

รวมทุกอย่างจาก V7 และเพิ่ม Yahoo fundamentals ฟรี:
- quote batch
- chart 6 เดือน: RSI14, SMA5/20/50, ATR14, High/Low 20 วัน
- quoteSummary fundamentals: PE, PB, ROE, Margin, Debt/Equity, Growth, Dividend, Sector, Industry
- fallback/manual สำหรับหุ้นที่ Yahoo ไม่มีข้อมูลพื้นฐานครบ
- A+ / B / 0
- ซ่อน JSON เหมือนเดิม

## Upload
อัปไฟล์ทั้งหมดไปที่ root ของ GitHub repo:
- index.html
- netlify.toml
- package.json
- README.md
- netlify/functions/yahoo.js

## Deploy
Netlify → Deploys → Trigger deploy → Clear cache and deploy site

หลัง deploy ถ้าค่าเก่าค้าง กด ⚙️ → รีเซ็ตค่าในเครื่อง

## Note
Yahoo Finance เป็นแหล่งข้อมูลฟรี/ไม่เป็นทางการ อาจ delay หรือข้อมูลพื้นฐานไม่ครบ โดยเฉพาะหุ้นไทยบางตัว
