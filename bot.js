require('dotenv').config({ path: '.env.local' });
const TelegramBot = require('node-telegram-bot-api');
const { createClient } = require('@supabase/supabase-js');

// Bot configuration
const token = process.env.BALE_BOT_TOKEN;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!token || !supabaseUrl || !supabaseKey) {
  console.error("Missing environment variables. Please check .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Setup Telegram bot with Bale base URL
const options = {
  polling: true,
  baseApiUrl: 'https://tapi.bale.ai'
};

const bot = new TelegramBot(token, options);

// In-memory state (in production, use a database or Redis for state management)
const userState = {};

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  userState[chatId] = { step: 'NAME' };
  bot.sendMessage(chatId, 'سلام! به سامانه دریافت تکالیف خوش آمدید.\nلطفاً نام و نام خانوادگی خود را وارد کنید:');
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  
  if (msg.text === '/start') return; 

  const state = userState[chatId];
  if (!state) {
    return bot.sendMessage(chatId, 'لطفاً برای شروع روی /start کلیک کنید یا آن را تایپ کنید.');
  }

  if (state.step === 'NAME') {
    if (!msg.text) {
      return bot.sendMessage(chatId, 'لطفاً نام خود را به صورت متنی وارد کنید.');
    }
    state.name = msg.text;
    state.step = 'CLASS';
    
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
    bot.sendMessage(chatId, `نام شما "${state.name}" ثبت شد.\nلطفاً کلاس خود را از منوی زیر (دکمه‌های شیشه‌ای) انتخاب کنید:`, opts);
  } else if (state.step === 'FILE') {
    if (!msg.document) {
      return bot.sendMessage(chatId, 'لطفاً یک فایل ارسال کنید (به صورت فایل/Document).');
    }

    bot.sendMessage(chatId, 'در حال دریافت و ذخیره فایل...');
    
    try {
      const fileId = msg.document.file_id;
      const fileLink = await bot.getFileLink(fileId);
      
      // Fetch file from Bale API
      const response = await fetch(fileLink);
      const blob = await response.blob();
      
      // Upload to Supabase Storage
      const fileName = `${Date.now()}_${msg.document.file_name}`;
      const { data: storageData, error: storageError } = await supabase
        .storage
        .from('homework')
        .upload(`files/${fileName}`, blob);
        
      if (storageError) throw storageError;

      const { data: publicUrlData } = supabase.storage.from('homework').getPublicUrl(`files/${fileName}`);
      const publicUrl = publicUrlData.publicUrl;

      // Parse name
      const nameParts = state.name.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || '-';

      // Insert into Database
      const { error: dbError } = await supabase
        .from('submissions')
        .insert([
          {
            first_name: firstName,
            last_name: lastName,
            class_name: state.className,
            file_url: publicUrl
          }
        ]);

      if (dbError) throw dbError;

      bot.sendMessage(chatId, 'تکلیف شما با موفقیت ثبت شد. خسته نباشید!');
      delete userState[chatId];

    } catch (error) {
      console.error(error);
      bot.sendMessage(chatId, 'متأسفانه در ثبت فایل خطایی رخ داد. لطفاً دوباره تلاش کنید.');
    }
  }
});

bot.on('callback_query', (callbackQuery) => {
  const msg = callbackQuery.message;
  const data = callbackQuery.data;
  const chatId = msg.chat.id;
  
  const state = userState[chatId];
  if (!state || state.step !== 'CLASS') return;

  if (data.startsWith('class_')) {
    const className = data.replace('class_', '');
    state.className = className;
    state.step = 'FILE';
    
    bot.sendMessage(chatId, `کلاس ${className} انتخاب شد.\nلطفاً فایل تحقیق خود را ارسال کنید.`);
    bot.answerCallbackQuery(callbackQuery.id);
  }
});

console.log("Bale Bot is running...");
