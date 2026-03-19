const TelegramBot = require("node-telegram-bot-api");
const puppeteer = require("puppeteer");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

const token = process.env.TOKEN;
const bot = new TelegramBot(token, { polling: true });

function getFontSize(text){
  if(text.length > 180) return 28;
  if(text.length > 120) return 34;
  if(text.length > 80) return 42;
  return 52;
}

bot.on("message", async (msg)=>{
  try{
    if(!msg.caption || !msg.caption.startsWith("/news")) return;

    console.log("NEWS TRIGGER");

    const lines = msg.caption.split("\n").slice(1);

    const label = lines[0] || "NEWS";
    const text = lines.slice(1).join(" ");

    if(!msg.photo){
      return bot.sendMessage(msg.chat.id, "Додай фото 📸");
    }

    const fileId = msg.photo[msg.photo.length - 1].file_id;

    const file = await bot.getFile(fileId);
    const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;

    const imgBuffer = (await axios.get(fileUrl, { responseType: "arraybuffer" })).data;
    const imageBase64 = `data:image/jpeg;base64,${Buffer.from(imgBuffer).toString("base64")}`;

    let html = await fs.readFile(path.join(__dirname, "news-template.html"), "utf8");

    html = html
      .replace("{{IMAGE}}", imageBase64)
      .replace("{{LABEL}}", label.toUpperCase())
      .replace("{{TEXT}}", text.toUpperCase())
      .replace("{{FONTSIZE}}", getFontSize(text) + "px");

    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();

    await page.setViewport({ width: 900, height: 900 });
    await page.setContent(html, { waitUntil: "networkidle0" });

    const filePath = path.join(__dirname, "news.png");

    await page.screenshot({ path: filePath });

    await browser.close();

    await bot.sendPhoto(msg.chat.id, filePath);

  }catch(e){
    console.log(e);
    bot.sendMessage(msg.chat.id, "Помилка news 💀");
  }
});
