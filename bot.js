const TelegramBot = require("node-telegram-bot-api");
const puppeteer = require("puppeteer");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

const token = process.env.TOKEN;
const bot = new TelegramBot(token, { polling: true });

/* ============================= */
/* 🧠 TEMPLATE MAP (AUTO x15)    */
/* ============================= */
const NEWS_TEMPLATES = {};

// базовий
NEWS_TEMPLATES["news"] = "news-template.html";

// /news1 → /news15
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
/* 🚀 MAIN HANDLER               */
/* ============================= */
bot.on("message", async (msg)=>{
  try{
    if(!msg.caption) return;

    /* ============================= */
    /* 🎯 DETECT COMMAND             */
    /* ============================= */
    const command = msg.caption.split("\n")[0].trim().toLowerCase();

    if(!command.startsWith("/news")) return;

    const commandKey = command.replace("/", "");

    console.log("NEWS TRIGGER:", commandKey);

    /* ============================= */
    /* 📄 TEMPLATE SELECT (SAFE)     */
    /* ============================= */
    const templateFile = NEWS_TEMPLATES[commandKey] || "news-template.html";

    /* ============================= */
    /* 🧾 PARSE TEXT                 */
    /* ============================= */
    const lines = msg.caption.split("\n").slice(1);

    const label = lines[0] || "NEWS";
    const text = lines.slice(1).join(" ");

    /* ============================= */
    /* 📸 CHECK PHOTO                */
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
    /* 🧱 LOAD HTML TEMPLATE         */
    /* ============================= */
    let html = await fs.readFile(
      path.join(__dirname, templateFile),
      "utf8"
    );

    /* ============================= */
    /* 🔄 REPLACE DATA               */
    /* ============================= */
    html = html
      .replace("{{IMAGE}}", imageBase64)
      .replace("{{LABEL}}", label.toUpperCase())
      .replace("{{TEXT}}", text.toUpperCase())
      .replace("{{FONTSIZE}}", getFontSize(text) + "px");

    /* ============================= */
    /* 🖥️ PUPPETEER RENDER           */
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
    /* 📤 SEND RESULT                */
    /* ============================= */
    await bot.sendPhoto(msg.chat.id, filePath);

  }catch(e){
    console.log(e);
    bot.sendMessage(msg.chat.id, "Помилка news 💀");
  }
});
