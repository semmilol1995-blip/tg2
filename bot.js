const TelegramBot = require("node-telegram-bot-api");
const puppeteer = require("puppeteer");
const fs = require("fs-extra");
const path = require("path");

const token = process.env.TOKEN;
const bot = new TelegramBot(token, { polling: true });

/* =========================
   FIX CONFLICT
========================= */
(async () => {
  try {
    await bot.deleteWebHook({ drop_pending_updates: true });
    console.log("Webhook removed");
  } catch {}
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
bot.on("message", async (msg)=>{
  if(!msg.text) return;
  if(!msg.text.startsWith("/news")) return;

  try{
    console.log("NEWS TRIGGER");

    const rawText = msg.text.replace("/news","").trim();

    if(!rawText){
      return bot.sendMessage(msg.chat.id,"Напиши текст новини");
    }

    const formattedText = rawText
      .split("_")
      .map((part,i)=> i%2 ? `<span class="purple">${part}</span>` : part)
      .join("");

    let html = await fs.readFile(
      path.join(__dirname,"news-template.html"),
      "utf8"
    );

    html = html.replace("{{TEXT}}", formattedText);

    const browser = await launchBrowser();
    const page = await browser.newPage();

    await page.setViewport({ width:900, height:900 });

    await page.setContent(html, {
      waitUntil: "networkidle0"
    });

    await page.evaluateHandle("document.fonts.ready");

    const filePath = path.join(__dirname,"news.png");

    await page.screenshot({ path:filePath });
    await browser.close();

    await bot.sendPhoto(msg.chat.id,filePath);

  }catch(e){
    console.log("NEWS ERROR:", e);
    bot.sendMessage(msg.chat.id,"Помилка news 💀");
  }
});

/* =========================
   KEEP ALIVE
========================= */
setInterval(() => {}, 1000);
