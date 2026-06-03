# Tae&oil500 V9.2 Audit Final

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


## V8.1 Change
ปรับภาษา UI ให้เข้าใจง่ายสำหรับคนเล่นหุ้นไม่เป็น: ตัดคำเทคนิคเท่าที่ทำได้ เปลี่ยนปุ่ม 'สแกน V8' เป็น 'สแกนใหม่' และซ่อนศัพท์ที่ไม่จำเป็นจากหน้าใช้งาน


## V9 Change
เพิ่มระบบกันเหนียว: Yahoo สด → Stooq fallback สำหรับกราฟ US/ETF → cache ล่าสุดในเครื่อง → degraded mode ถ้าข้อมูลไม่พร้อม พร้อม confidence score และป้าย live/cache/stooq

## V9.2 Audit Final
- แก้ bug สำคัญ: DOCTYPE เคยเสียจากการแทนคำเทคนิค
- ตรวจว่าไม่มีปุ่ม "สแกน V8/V7"
- ตรวจว่าไม่มีช่อง JSON หลังบ้าน
- ตรวจ syntax ทั้ง Netlify Function และ inline script
- รักษาระบบกันเหนียว: ข้อมูลสด → แหล่งสำรอง → ข้อมูลสำรองล่าสุด → โหมดข้อมูลไม่พร้อม

## V9.3 Patch
แก้ id ช่องตั้งค่า deepLimit/fundLimit ที่เคยโดนแปลเป็นภาษาไทย ทำให้ปุ่มบันทึกค่าบางช่องเสี่ยงพัง

## V9.4 Real Fix
แก้บั๊กที่ทำให้หน้า Summary ไม่อัปเดต: id `sumUniverse` และ `showWatch` เคยโดนแปลเป็นภาษาไทย ทำให้ JavaScript หยุดกลางทาง ตอนนี้แก้แล้ว และเพิ่ม DOM binding ให้เสถียรกว่าเดิม

## V9.5 Settings Save Fix
แก้บั๊กปุ่มบันทึกค่าตั้งค่าไม่ติดและค่าถูกรีเซ็ตกลับ default โดยอ่านค่าจาก element จริงทุกครั้ง และช่องว่างจะไม่ล้างค่าเดิม

## V9.6 Settings Final
แก้ id ที่ยังโดนแปลอยู่: minTurnover, minRR, setUniverse และเพิ่มช่อง maxCacheHours กลับมาให้บันทึกได้ครบ
