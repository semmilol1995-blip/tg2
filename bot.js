const TelegramBot = require("node-telegram-bot-api");
const puppeteer = require("puppeteer");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

const token = process.env.TOKEN;
const bot = new TelegramBot(token, { polling: true });

/* ============================= */
/* 🧠 TEMPLATE MAP               */
/* ============================= */
const NEWS_TEMPLATES = {};

NEWS_TEMPLATES["news"] = "news-template.html";

for (let i = 1; i <= 15; i++) {
  NEWS_TEMPLATES[`news${i}`] = `news${i}-template.html`;
}

/* ============================= */
/* 🔤 FONT SIZE                  */
/* ============================= */
function getFontSize(text){
  if(text.length > 180) return 28;
  if(text.length > 120) return 34;
  if(text.length > 80) return 42;
  return 52;
}

/* ============================= */
/* 📘 INFO COMMAND               */
/* ============================= */
bot.onText(/\/info/, (msg) => {

const text = `
📘 ПРИКЛАДИ:

/news
НОВИНА, ЗАГОЛОВОК
FURIA WIN 2-0

/news1
ЦИТАТА WE ARE READY
S1MPLE

/news3
ФАКТ FAZE QUALIFIED

/news4
ГОРИЗОНТАЛЬНА СТАТА
XKASPERKY НА ANCIENT
2.24
+12.24
2.07

/news5
ВЕРТИКАЛЬНА СТАТА
XKASPERKY НА ANCIENT
2.24
+12.24
2.07

📸 + фото обов’язково
`;

bot.sendMessage(msg.chat.id, text);

});

/* ============================= */
/* 🚀 START + КНОПКИ             */
/* ============================= */
bot.onText(/\/start/, (msg) => {

bot.sendMessage(msg.chat.id, "Обери тип поста 👇", {
  reply_markup: {
    inline_keyboard: [
      [
        { text: "🟣 Новина", callback_data: "news" },
        { text: "💬 Цитата", callback_data: "news1" },
        { text: "📊 Факт", callback_data: "news3" }
      ],
      [
        { text: "🔥 MVP (гор)", callback_data: "news4" },
        { text: "📈 MVP (верт)", callback_data: "news5" }
      ]
    ]
  }
});

});

/* ============================= */
/* 🔘 CALLBACK HANDLER           */
/* ============================= */
bot.on("callback_query", (query) => {

const cmd = query.data;

let example = "";

if(cmd === "news"){
example = `/news
RESULT
FURIA WIN 2-0`;
}
else if(cmd === "news1"){
example = `/news1
WE ARE READY
S1MPLE`;
}
else if(cmd === "news3"){
example = `/news3
FAZE QUALIFIED`;
}
else if(cmd === "news4"){
example = `/news4
XKASPERKY НА ANCIENT
2.24
+12.24
2.07`;
}
else if(cmd === "news5"){
example = `/news5
XKASPERKY НА ANCIENT
2.24
+12.24
2.07`;
}

bot.sendMessage(query.message.chat.id, example);
bot.answerCallbackQuery(query.id);

});

/* ============================= */
/* 🚀 MAIN HANDLER               */
/* ============================= */
bot.on("message", async (msg)=>{
  try{
    if(!msg.caption) return;

    const command = msg.caption.split("\n")[0].trim().toLowerCase();
    if(!command.startsWith("/news")) return;

    const commandKey = command.replace("/", "");
    const templateFile = NEWS_TEMPLATES[commandKey] || "news-template.html";

    const lines = msg.caption.split("\n").slice(1);

    let label = "NEWS";
    let text = "";
    let author = "";

    let stat1 = "";
    let stat2 = "";
    let stat3 = "";

    /* ============================= */
    /* 🧠 LOGIC                     */
    /* ============================= */

    if(commandKey === "news1" || commandKey === "news2"){
      text = lines[0] || "";
      author = lines[1] || "";
      label = "";
    } 
    else if(commandKey === "news3"){
      text = lines.join(" ");
      label = "";
    } 
    else if(commandKey === "news4" || commandKey === "news5"){
      text = lines[0] || "";

      stat1 = lines[1] || "";
      stat2 = lines[2] || "";
      stat3 = lines[3] || "";

      label = "СТАТИСТИКА";
    }
    else {
      label = lines[0] || "NEWS";
      text = lines.slice(1).join(" ");
    }

    /* ============================= */
    /* 📸 PHOTO CHECK               */
    /* ============================= */
    if(!msg.photo){
      return bot.sendMessage(msg.chat.id, "Додай фото 📸");
    }

    const fileId = msg.photo[msg.photo.length - 1].file_id;
    const file = await bot.getFile(fileId);
    const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;

    const imgBuffer = (await axios.get(fileUrl, { responseType: "arraybuffer" })).data;
    const imageBase64 = `data:image/jpeg;base64,${Buffer.from(imgBuffer).toString("base64")}`;

    /* ============================= */
    /* 📄 LOAD HTML                 */
    /* ============================= */
    let html = await fs.readFile(
      path.join(__dirname, templateFile),
      "utf8"
    );

    /* ============================= */
    /* 🔄 REPLACE                   */
    /* ============================= */
    html = html
      .replace(/{{IMAGE}}/g, imageBase64)
      .replace(/{{PLAYER_IMAGE}}/g, imageBase64)
      .replace(/{{LABEL}}/g, label.toUpperCase())
      .replace(/{{TEXT}}/g, text.toUpperCase())
      .replace(/{{AUTHOR}}/g, author.toUpperCase())
      .replace(/{{FONTSIZE}}/g, getFontSize(text) + "px")
      .replace(/{{STAT1}}/g, stat1)
      .replace(/{{STAT2}}/g, stat2)
      .replace(/{{STAT3}}/g, stat3);

    /* ============================= */
    /* 🖥️ PUPPETEER                */
    /* ============================= */
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();

    await page.setViewport({ width: 900, height: 900 });
    await page.setContent(html, { waitUntil: "networkidle0" });

    const filePath = path.join(__dirname, "news.png");

    await page.screenshot({ path: filePath });

    await browser.close();

    /* ============================= */
    /* 📤 SEND                     */
    /* ============================= */
    await bot.sendPhoto(msg.chat.id, filePath);

  }catch(e){
    console.log(e);
    bot.sendMessage(msg.chat.id, "Помилка news 💀");
  }
});
