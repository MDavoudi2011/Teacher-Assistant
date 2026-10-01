# سامانه دریافت تکالیف (مدارس)

این سیستم شامل یک ربات پیام‌رسان بله و یک پنل مدیریت وب با Next.js است که کاملاً برای اجرا روی پلتفرم‌های Serverless مانند **Vercel** بهینه‌سازی شده است.

## پیش‌نیازها
- حساب کاربری Supabase (یا پایگاه داده Postgres).
- حساب کاربری Vercel برای دیپلوی رایگان.

## راه‌اندازی پایگاه داده (Supabase)
۱. در پروژه Supabase خود، فایل `schema.sql` که در ریشه پروژه قرار دارد را در بخش SQL Editor اجرا کنید تا جدول‌های `submissions` و `bot_state` ساخته شوند.
۲. یک Storage Bucket جدید به نام `homework` بسازید.
۳. در تنظیمات Storage، قابلیت Public را برای این باکت فعال کنید (یا Policy بنویسید) تا لینک‌های دانلود برای مدیر معتبر باشد.

## متغیرهای محیطی
در بخش Environment Variables در تنظیمات پروژه در Vercel مقادیر زیر را جایگذاری کنید:
- `NEXT_PUBLIC_SUPABASE_URL`: لینک پروژه Supabase شما.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: کلید عمومی (anon key) مربوط به Supabase.
- `SUPABASE_SERVICE_ROLE_KEY`: کلید Service Role مربوط به Supabase برای ثبت فایل‌ها از سمت ربات.
- `BALE_BOT_TOKEN`: توکن دریافتی ربات بله از @BotFather.
- `PANEL_PASSWORD`: رمز عبور ورود به پنل مدیریت (پیش‌فرض: 1234)

## راه‌اندازی ربات بله (Webhook)
چون پروژه در Vercel قرار می‌گیرد، ربات با سیستم Webhook کار می‌کند:
۱. پس از دیپلوی پروژه در Vercel، آدرس دامنه خود را کپی کنید (مثلاً `https://my-app.vercel.app`).
۲. آدرس Webhook را در مرورگر با فرمت زیر تنظیم کنید (لینک زیر را در مرورگر باز کنید):
`https://tapi.bale.ai/bot<BALE_BOT_TOKEN>/setWebhook?url=https://my-app.vercel.app/api/webhook`
*دقت کنید که به جای `<BALE_BOT_TOKEN>` توکن ربات خود و به جای `my-app.vercel.app` دامنه Vercel خود را قرار دهید.*
۳. پس از باز کردن لینک باید پیام موفقیت آمیز دریافت کنید. از این پس پیام‌های کاربران در بله مستقیماً به API سایت شما ارسال می‌شود.

## امکانات پنل:
- طراحی زیبا و Glassmorphism
- دسته‌بندی بر اساس کلاس‌های ۹/۱ تا ۹/۴
- قابلیت مشاهده آنلاین و دانلود فایل تحقیق
- طراحی کاملا واکنش‌گرا (Responsive)
- یکپارچگی کامل ربات و پنل بر بستر Serverless Next.js
