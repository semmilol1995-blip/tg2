const TelegramBot = require("node-telegram-bot-api");
const puppeteer = require("puppeteer");
const fs = require("fs-extra");
const path = require("path");

const token = process.env.TOKEN;
const bot = new TelegramBot(token, { polling: true });

/* =========================
   ANTI WEBHOOK
========================= */
(async () => {
  try {
    await bot.deleteWebHook({ drop_pending_updates: true });
    console.log("Webhook removed");
  } catch (e) {}
})();

/* =========================
   PUPPETEER
========================= */
async function launchBrowser(){
  return await puppeteer.launch({
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu"
    ]
  });
}

/* =========================
   /news
========================= */
bot.on("message", async (msg) => {
  if (!msg.text) return;
  if (!msg.text.startsWith("/news")) return;

  try {
    console.log("NEWS TRIGGER");

    /* 🔥 ПРАВИЛЬНИЙ ПАРСИНГ */
    const rawText = msg.text
      .replace(/^\/news(@\w+)?\s*/, "")
      .trim();

    console.log("TEXT:", rawText);

    if (!rawText) {
      return bot.sendMessage(msg.chat.id, "Нема тексту 💀");
    }

    /* 🔥 ПІДСВІТКА ЧЕРЕЗ _text_ */
    const formattedText = rawText
      .split("_")
      .map((part, i) =>
        i % 2 ? `<span class="purple">${part}</span>` : part
      )
      .join("");

    let html = await fs.readFile(
      path.join(__dirname, "news-template.html"),
      "utf8"
    );

    /* 🔥 ВАЖЛИВО: replace ALL */
    html = html.replace(/{{TEXT}}/g, formattedText);

    const browser = await launchBrowser();
    const page = await browser.newPage();

    await page.setViewport({ width: 900, height: 900 });

    /* 🔥 ФІКС ШРИФТІВ */
    await page.setContent(html, {
      waitUntil: "networkidle0"
    });

    await page.evaluateHandle("document.fonts.ready");
    await new Promise(r => setTimeout(r, 200));

    const filePath = path.join(__dirname, "news.png");

    await page.screenshot({ path: filePath });

    await browser.close();

    await bot.sendPhoto(msg.chat.id, filePath);

  } catch (e) {
    console.log("NEWS ERROR:", e);
    bot.sendMessage(msg.chat.id, "Помилка news 💀");
  }
});

/* =========================
   KEEP ALIVE
========================= */
setInterval(() => {}, 1000);
