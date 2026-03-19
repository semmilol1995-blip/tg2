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
/* 🚀 MAIN HANDLER               */
/* ============================= */
bot.on("message", async (msg)=>{
  try{
    if(!msg.caption) return;

    const command = msg.caption.split("\n")[0].trim().toLowerCase();
    if(!command.startsWith("/news")) return;

    const commandKey = command.replace("/", "");
    console.log("NEWS TRIGGER:", commandKey);

    const templateFile = NEWS_TEMPLATES[commandKey] || "news-template.html";

    const lines = msg.caption.split("\n").slice(1);

    let label = "NEWS";
    let text = "";
    let author = "";

    /* ============================= */
    /* 🧠 COMMAND LOGIC              */
    /* ============================= */

    if(commandKey === "news1" || commandKey === "news2"){
      // 💬 цитати
      text = lines[0] || "";
      author = lines[1] || "";
      label = "";
    } 
    else if(commandKey === "news3"){
      // 📊 факт
      text = lines.join(" ");
      label = "";
    } 
    else {
      // 🟣 стандарт
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
      .replace("{{IMAGE}}", imageBase64)
      .replace("{{LABEL}}", label.toUpperCase())
      .replace("{{TEXT}}", text.toUpperCase())
      .replace("{{FONTSIZE}}", getFontSize(text) + "px")
      .replace("{{AUTHOR}}", author.toUpperCase());

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
