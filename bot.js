const TelegramBot = require("node-telegram-bot-api");
const puppeteer = require("puppeteer");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

const token = process.env.TOKEN;
const bot = new TelegramBot(token, { polling: true });

/* ========================= */
async function launchBrowser(){
  return await puppeteer.launch({
    args: ["--no-sandbox","--disable-setuid-sandbox"]
  });
}

/* =========================
   DOWNLOAD IMAGE
========================= */
async function downloadImage(fileId){
  const file = await bot.getFile(fileId);
  const url = `https://api.telegram.org/file/bot${token}/${file.file_path}`;

  const res = await axios.get(url, { responseType: "arraybuffer" });

  return `data:image/jpeg;base64,${Buffer.from(res.data).toString("base64")}`;
}

/* =========================
   /news
========================= */
bot.on("message", async (msg) => {
  if (!msg.text) return;
  if (!msg.text.startsWith("/news")) return;

  try {
    console.log("NEWS TRIGGER");

    /* 🔥 РОЗБИВАЄМО ПОВІДОМЛЕННЯ */
    const lines = msg.text
      .replace(/^\/news(@\w+)?\s*/, "")
      .split("\n")
      .map(l => l.trim())
      .filter(Boolean);

    const label = lines[0] || "НОВИНА";
    const textRaw = lines.slice(1).join(" ");

    if (!textRaw) {
      return bot.sendMessage(msg.chat.id, "Нема тексту 💀");
    }

    /* 🔥 ФОРМАТУВАННЯ */
    const formattedText = textRaw
      .split("_")
      .map((part, i) =>
        i % 2 ? `<span class="line">${part}</span>` : part
      )
      .join("");

    /* 🔥 ФОТО */
    let imageBase64 = "";

    if (msg.photo && msg.photo.length) {
      const biggest = msg.photo[msg.photo.length - 1];
      imageBase64 = await downloadImage(biggest.file_id);
    } else {
      return bot.sendMessage(msg.chat.id, "Додай фото 📸");
    }

    /* 🔥 HTML */
    let html = await fs.readFile(
      path.join(__dirname, "news-template.html"),
      "utf8"
    );

    html = html
      .replace(/{{TEXT}}/g, formattedText)
      .replace(/{{LABEL}}/g, label)
      .replace(/{{IMAGE}}/g, imageBase64)
      .replace(/{{FONTSIZE}}/g, "48px");

    const browser = await launchBrowser();
    const page = await browser.newPage();

    await page.setViewport({ width: 900, height: 900 });

    await page.setContent(html, {
      waitUntil: "networkidle0"
    });

    await page.evaluateHandle("document.fonts.ready");

    const filePath = path.join(__dirname, "news.png");

    await page.screenshot({ path: filePath });

    await browser.close();

    await bot.sendPhoto(msg.chat.id, filePath);

  } catch (e) {
    console.log("NEWS ERROR:", e);
    bot.sendMessage(msg.chat.id, "Помилка news 💀");
  }
});

/* ========================= */
setInterval(() => {}, 1000);
