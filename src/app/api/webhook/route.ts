import { NextRequest, NextResponse } from "next/server";
const TelegramBot = require("node-telegram-bot-api");
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Bot without polling
const token = process.env.BALE_BOT_TOKEN || '';
const bot = new TelegramBot(token, { 
  polling: false,
  baseApiUrl: 'https://tapi.bale.ai' 
});

async function getState(chatId: number) {
  const { data, error } = await supabase
    .from('bot_state')
    .select('*')
    .eq('chat_id', chatId)
    .single();
  if (error) return null;
  return data;
}

async function saveState(chatId: number, stateData: any) {
  await supabase
    .from('bot_state')
    .upsert({ chat_id: chatId, ...stateData, updated_at: new Date().toISOString() });
}

async function deleteState(chatId: number) {
  await supabase
    .from('bot_state')
    .delete()
    .eq('chat_id', chatId);
}

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();

    if (update.message) {
      const msg = update.message;
      const chatId = msg.chat.id;

      if (msg.text === '/start') {
        await saveState(chatId, { step: 'NAME', name: null, class_name: null });
        await bot.sendMessage(chatId, 'سلام! به سامانه دریافت تکالیف خوش آمدید.\nلطفاً نام و نام خانوادگی خود را وارد کنید:');
        return NextResponse.json({ ok: true });
      }

      const state = await getState(chatId);
      if (!state) {
        await bot.sendMessage(chatId, 'لطفاً برای شروع روی /start کلیک کنید یا آن را تایپ کنید.');
        return NextResponse.json({ ok: true });
      }

      if (state.step === 'NAME') {
        if (!msg.text) {
          await bot.sendMessage(chatId, 'لطفاً نام خود را به صورت متنی وارد کنید.');
          return NextResponse.json({ ok: true });
        }
        
        await saveState(chatId, { step: 'CLASS', name: msg.text, class_name: null });
        
        const opts = {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '۹/۱', callback_data: 'class_9/1' },
                { text: '۹/۲', callback_data: 'class_9/2' }
              ],
              [
                { text: '۹/۳', callback_data: 'class_9/3' },
                { text: '۹/۴', callback_data: 'class_9/4' }
              ]
            ]
          }
        };
        await bot.sendMessage(chatId, `نام شما "${msg.text}" ثبت شد.\nلطفاً کلاس خود را از منوی زیر انتخاب کنید:`, opts);
      } else if (state.step === 'FILE') {
        if (!msg.document) {
          await bot.sendMessage(chatId, 'لطفاً یک فایل ارسال کنید (به صورت فایل/Document).');
          return NextResponse.json({ ok: true });
        }

        await bot.sendMessage(chatId, 'در حال دریافت و ذخیره فایل...');
        
        try {
          const fileId = msg.document.file_id;
          const fileLink = await bot.getFileLink(fileId);
          
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

          const nameParts = (state.name || '').trim().split(' ');
          const firstName = nameParts[0];
          const lastName = nameParts.slice(1).join(' ') || '-';

          const { error: dbError } = await supabase
            .from('submissions')
            .insert([
              {
                first_name: firstName,
                last_name: lastName,
                class_name: state.class_name,
                file_url: publicUrl
              }
            ]);

          if (dbError) throw dbError;

          await bot.sendMessage(chatId, 'تکلیف شما با موفقیت ثبت شد. خسته نباشید!');
          await deleteState(chatId);

        } catch (error) {
          console.error(error);
          await bot.sendMessage(chatId, 'متأسفانه در ثبت فایل خطایی رخ داد. لطفاً دوباره تلاش کنید.');
        }
      }
    } else if (update.callback_query) {
      const callbackQuery = update.callback_query;
      const msg = callbackQuery.message;
      const data = callbackQuery.data;
      const chatId = msg.chat.id;
      
      const state = await getState(chatId);
      if (!state || state.step !== 'CLASS') {
        return NextResponse.json({ ok: true });
      }

      if (data.startsWith('class_')) {
        const className = data.replace('class_', '');
        await saveState(chatId, { ...state, step: 'FILE', class_name: className });
        
        await bot.sendMessage(chatId, `کلاس ${className} انتخاب شد.\nلطفاً فایل تحقیق خود را ارسال کنید.`);
        // answerCallbackQuery requires query id
        try {
          await bot.answerCallbackQuery(callbackQuery.id);
        } catch(e) {}
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
