# Tae&oil500 Yahoo Scanner - Fallback V3

เวอร์ชันนี้แก้ปัญหา HTTP 502 โดยให้ Function ไม่พึ่ง Yahoo endpoint เดียว

## วิธีทำงาน

1. เรียก Yahoo quote endpoint
2. ถ้าบางตัวหรือทั้งหมดไม่มา จะ fallback ไป Yahoo chart endpoint รายตัว
3. Function จะตอบกลับ JSON เสมอเท่าที่ทำได้ เพื่อไม่ให้เว็บพัง

## ไฟล์ที่ต้องอยู่หน้าแรก GitHub repo

- index.html
- netlify.toml
- package.json
- README.md
- netlify/functions/yahoo.js

## หลังอัปโหลด

Netlify → Deploys → Trigger deploy → Clear cache and deploy site

## ทดสอบ

เปิด:
`https://YOUR-SITE.netlify.app/.netlify/functions/yahoo?symbols=MSFT,NVDA,PTT.BK`

ถ้าสำเร็จต้องได้ JSON ที่มี `"ok": true`
