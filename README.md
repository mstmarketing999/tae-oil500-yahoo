# Tae&oil500 Yahoo Scanner - Fetch Version

เวอร์ชันนี้ไม่ใช้ package `yahoo-finance2` แล้ว  
Netlify Function ใช้ native `fetch` เรียก Yahoo Finance quote endpoint โดยตรงจากฝั่ง server

## ไฟล์สำคัญ

- `index.html`
- `netlify.toml`
- `package.json`
- `netlify/functions/yahoo.js`

## วิธีอัปเดต GitHub

ให้อัปโหลดไฟล์ทั้งหมดนี้ไปไว้หน้าแรกของ repo:

- index.html
- netlify.toml
- package.json
- README.md
- netlify/functions/yahoo.js

จากนั้นกลับไป Netlify แล้วกด:

Deploys → Trigger deploy → Clear cache and deploy site

## Test Function

หลัง deploy เสร็จ ลองเปิด:

`https://YOUR-SITE.netlify.app/.netlify/functions/yahoo?symbols=MSFT,NVDA,PTT.BK`

ถ้าถูกต้องต้องได้ JSON ไม่ใช่ 404/502
