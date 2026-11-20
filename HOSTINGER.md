# رفع موقع جولد سنتر على هوستنجر (الدومين من Namecheap)

## 1) الخطة المطلوبة
الخطة المناسبة: **Hostinger VPS — KVM 2** (معالجان vCPU، ذاكرة 8 جيجا، قرص NVMe 100 جيجا، نقل 8 تيرا).
الخطة تدعم Node.js: VPS أو Business/Cloud (Node.js Web App). الخطط المشتركة العادية لا تشغّل لوحة التحكم والأسعار.
لو الميزانية ضيقة: KVM 1 (4 جيجا) مع إضافة Swap، ولو الزيارات زادت: KVM 4.
قاعدة البيانات والصور تبقى على Lovable Cloud ولا تحتاج نقل.

## 2) متغيرات البيئة (Environment Variables)
انسخ القيم من ملف `.env` في المشروع:
- `VITE_SUPABASE_URL` و `SUPABASE_URL` (نفس الرابط)
- `VITE_SUPABASE_PUBLISHABLE_KEY` و `SUPABASE_PUBLISHABLE_KEY` (نفس المفتاح)
- `VITE_SUPABASE_PROJECT_ID`
- `LOVABLE_API_KEY` لتحليل الأسعار بالذكاء الاصطناعي (اطلبه من مساعد Lovable).
- `PORT=3000`

ملاحظة: دعوة وحذف مستخدمي لوحة التحكم تحتاج مفتاحًا خاصًا غير متاح خارج Lovable، فستعمل هذه الأزرار فقط من الموقع المنشور على Lovable. باقي الموقع يعمل بالكامل.

## 3) Node.js Web App (Business/Cloud)
1. اربط مستودع GitHub أو ارفع ملف ZIP للمشروع.
2. Node 22 (يُثبَّت من NodeSource كما في قسم VPS).
3. أمر التثبيت: `npm install`
4. أمر البناء: `npm run build:node`
5. أمر التشغيل: `npm start`  (الملف: `.output/server/index.mjs`)

### 3أ) طريقة سريعة: مجلد `.output` الجاهز
حزمة الرفع فيها مجلد `.output` مبنيّ وجاهز للتشغيل (لا يحتاج `npm install`).
1. ارفع محتويات `.output` إلى السيرفر.
2. اضبط المتغيرات: `PORT` و `SUPABASE_URL` و `SUPABASE_PUBLISHABLE_KEY`.
3. شغّل: `node .output/server/index.mjs` (أو `pm2 start .output/server/index.mjs --name goldcenter`).
ملاحظة: هذا المجلد ليس في مستودع GitHub (متجاهَل)، بل في حزمة الرفع فقط.
لو غيّرت الكود لاحقًا، أعد البناء بـ `npm run build:node` قبل الرفع.

## 3ب) VPS
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo bash - && sudo apt install -y nodejs nginx
git clone <رابط المستودع> goldcenter && cd goldcenter
# ضع المتغيرات في ملف .env
npm install && npm run build:node
sudo npm i -g pm2 && pm2 start .output/server/index.mjs --name goldcenter && pm2 save && pm2 startup
```
Nginx: `proxy_pass http://127.0.0.1:3000;` ثم `sudo certbot --nginx` لتفعيل SSL.

## 4) ربط دومين Namecheap
Namecheap → Domain List → Manage → Advanced DNS:
- سجل A: Host `@` → IP خادم هوستنجر
- سجل A أو CNAME: Host `www` → نفس IP / الدومين
احذف أي سجلات قديمة لنفس الأسماء. الانتشار قد يستغرق حتى 48 ساعة. فعّل SSL المجاني من هوستنجر.

## 5) تسجيل الدخول على الدومين الجديد
من Lovable: Cloud → Users → Auth settings → Advanced → Redirect URLs أضف:
`https://دومينك.com/**`
وإلا سيفشل الدخول بجوجل وروابط استعادة كلمة المرور.

## 6) فحص بعد الرفع
الرئيسية، الأسعار، المنتجات، السلة وواتساب، دخول العميل، /admin، افحص سبيكتك.
