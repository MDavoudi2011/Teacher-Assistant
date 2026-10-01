import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic'; // Prevent any caching on Vercel

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

const token = process.env.BALE_BOT_TOKEN || '';
const BALE_API = `https://tapi.bale.ai/bot${token}`;
const BALE_FILE_API = `https://tapi.bale.ai/file/bot${token}`;

async function sendMessage(chatId: string | number, text: string, replyMarkup?: any) {
  try {
    await fetch(`${BALE_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        ...(replyMarkup ? { reply_markup: replyMarkup } : {})
      })
    });
  } catch (e) {
    console.error("SendMessage Error:", e);
  }
}

async function answerCallbackQuery(callbackQueryId: string) {
  try {
    await fetch(`${BALE_API}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: callbackQueryId })
    });
  } catch(e) {}
}

async function getFile(fileId: string) {
  const res = await fetch(`${BALE_API}/getFile?file_id=${fileId}`);
  const data = await res.json();
  if (data.ok) return data.result;
  throw new Error("Cannot get file from Bale");
}

// Stateless bot! State functions removed.

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();

    if (update.message) {
      const msg = update.message;
      const chatId = msg.chat.id;

      // 1. /start command
      if (msg.text === '/start') {
        await sendMessage(chatId, 'سلام! به سامانه دریافت تکالیف خوش آمدید.\n\n👤 لطفاً **نام و نام خانوادگی** خود را وارد کنید:\n\n*(دقت کنید که متن خود را دقیقاً در پاسخ/Reply به همین پیام بفرستید)*', {
          force_reply: true,
          selective: true
        });
        return NextResponse.json({ ok: true });
      }

      // 2. User sends Name (replying to start)
      if (msg.text && msg.reply_to_message && msg.reply_to_message.text && msg.reply_to_message.text.includes('نام و نام خانوادگی')) {
        const name = msg.text.trim();
        let safeName = name;
        if (safeName.length > 25) safeName = safeName.substring(0, 25);

        const replyMarkup = {
          inline_keyboard: [
            [
              { text: '۹/۱', callback_data: `c|9/1|${safeName}` },
              { text: '۹/۲', callback_data: `c|9/2|${safeName}` }
            ],
            [
              { text: '۹/۳', callback_data: `c|9/3|${safeName}` },
              { text: '۹/۴', callback_data: `c|9/4|${safeName}` }
            ]
          ]
        };
        await sendMessage(chatId, `نام شما "${name}" دریافت شد.\n\n🏫 لطفاً کلاس خود را از دکمه‌های زیر انتخاب کنید:`, replyMarkup);
        return NextResponse.json({ ok: true });
      }

      // 3. User sends File (replying to confirm)
      if (msg.document) {
        if (!msg.reply_to_message || !msg.reply_to_message.text || !msg.reply_to_message.text.includes('ثبت موقت')) {
            await sendMessage(chatId, '❌ خطا: لطفاً فایل تحقیق را دقیقاً روی پیام "درخواست فایل" به صورت **پاسخ (Reply)** ارسال کنید. (یا برای شروع مجدد /start را بزنید)');
            return NextResponse.json({ ok: true });
        }

        const text = msg.reply_to_message.text;
        const nameMatch = text.match(/نام: (.*)/);
        const classMatch = text.match(/کلاس: (.*)/);
        
        const extractedName = nameMatch ? nameMatch[1].trim() : 'ناشناس';
        const extractedClass = classMatch ? classMatch[1].trim() : 'ناشناس';

        await sendMessage(chatId, '⏳ در حال آپلود و ذخیره فایل در سیستم... لطفاً چند لحظه صبر کنید.');

        try {
          const fileId = msg.document.file_id;
          const fileData = await getFile(fileId);
          const fileLink = `${BALE_FILE_API}/${fileData.file_path}`;
          
          const response = await fetch(fileLink);
          const blob = await response.blob();
          
          const fileName = `${Date.now()}_${msg.document.file_name}`;
          const { data: storageData, error: storageError } = await supabase
            .storage
            .from('homework')
            .upload(`files/${fileName}`, blob);
            
          if (storageError) throw storageError;

          const { data: publicUrlData } = supabase.storage.from('homework').getPublicUrl(`files/${fileName}`);
          const publicUrl = publicUrlData.publicUrl;

          const nameParts = extractedName.split(' ');
          const firstName = nameParts[0];
          const lastName = nameParts.slice(1).join(' ') || '-';

          const { error: dbError } = await supabase
            .from('submissions')
            .insert([
              {
                first_name: firstName,
                last_name: lastName,
                class_name: extractedClass,
                file_url: publicUrl
              }
            ]);

          if (dbError) {
             console.error("DB Insert Error:", dbError);
             throw dbError;
          }

          await sendMessage(chatId, '✅ تکلیف شما با موفقیت ثبت شد. خسته نباشید!');

        } catch (error) {
          console.error(error);
          await sendMessage(chatId, '❌ متأسفانه در ثبت نهایی فایل خطایی رخ داد. این خطا معمولاً به خاطر تنظیم نبودن پایگاه‌داده (متغیرهای Vercel) است.');
        }
        return NextResponse.json({ ok: true });
      }

      // If user sends normal text not matching flow
      if (msg.text) {
        await sendMessage(chatId, 'لطفاً برای شروع فرآیند ارسال تکلیف روی /start کلیک کنید.');
      }

    } else if (update.callback_query) {
      const callbackQuery = update.callback_query;
      const msg = callbackQuery.message;
      const data = callbackQuery.data;
      const chatId = msg.chat.id;
      
      if (data.startsWith('c|')) {
        const parts = data.split('|');
        const className = parts[1];
        const name = parts[2];
        
        const confirmText = `ثبت موقت:\nنام: ${name}\nکلاس: ${className}\n\n📥 لطفاً فایل تحقیق خود را دقیقاً در **پاسخ (Reply)** به همین پیام ارسال کنید.`;
        
        await sendMessage(chatId, confirmText, {
          force_reply: true,
          selective: true
        });
        
        try {
          await answerCallbackQuery(callbackQuery.id);
        } catch(e) {}
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
