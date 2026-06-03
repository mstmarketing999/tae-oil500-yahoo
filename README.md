# Tae&oil500 Yahoo Scanner

เว็บนี้ใช้ Netlify Function เป็นตัวกลางดึงข้อมูลจาก Yahoo Finance ผ่าน package `yahoo-finance2`

## โครงสร้างไฟล์

- `index.html` เว็บหลัก
- `netlify/functions/yahoo.js` ตัวกลางดึง Yahoo Finance
- `netlify.toml` ตั้งค่า Netlify
- `package.json` dependency

## วิธี Deploy บน Netlify แบบง่าย

1. แตก ZIP
2. เอาโฟลเดอร์ทั้งหมดขึ้น GitHub หรือ Deploy ผ่าน Netlify
3. Netlify จะติดตั้ง dependency จาก `package.json`
4. เปิดเว็บ แล้วกด `ดึง Yahoo + สแกน`

## Ticker ตัวอย่าง

หุ้นสหรัฐ:
- MSFT
- NVDA
- AAPL
- TSLA
- SPY
- QQQ

หุ้นไทย:
- PTT.BK
- CPALL.BK
- AOT.BK
- ADVANC.BK

## ข้อจำกัด

Yahoo Finance ไม่ใช่ official paid market data API สำหรับระบบเทรดจริง อาจมี delay, เปลี่ยน endpoint, หรือบาง ticker ดึงไม่ได้ในบางช่วง
เว็บนี้เหมาะกับ MVP / screening เบื้องต้น ไม่ใช่คำสั่งซื้อขายอัตโนมัติ
