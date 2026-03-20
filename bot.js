const TelegramBot = require("node-telegram-bot-api");
const puppeteer = require("puppeteer");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

const token = process.env.TOKEN;
const bot = new TelegramBot(token, { polling: true });

/* ============================= */
/* 📱 MAIN MENU                  */
/* ============================= */
const MAIN_MENU = {
  reply_markup: {
    keyboard: [
      ["🟣 Новина", "💬 Цитата"],
      ["🎤 Side Quote", "📊 Факт"],
      ["🔥 MVP (гор)", "📈 MVP (верт)"],
      ["🗺️ Veto", "ℹ️ Інфо"]
    ],
    resize_keyboard: true
  }
};

/* ============================= */
/* 🧠 TEMPLATE MAP               */
/* ============================= */
const NEWS_TEMPLATES = {};

NEWS_TEMPLATES["news"] = "news-template.html";

for (let i = 1; i <= 15; i++) {
  NEWS_TEMPLATES[`news${i}`] = `news${i}-template.html`;
}

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

/news2
SIDE QUOTE
CAIRNE

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

/news6
blast open rotterdam 2026
navi vs b8
navi inferno
b8 mirage
decider nuke

📸 + фото обов’язково (крім news6)
`;

bot.sendMessage(msg.chat.id, text, MAIN_MENU);

});

/* ============================= */
/* 🚀 START                      */
/* ============================= */
bot.onText(/\/start/, (msg) => {

bot.sendMessage(msg.chat.id, "Обери тип поста 👇", {
  reply_markup: {
    keyboard: MAIN_MENU.reply_markup.keyboard,
    resize_keyboard: true
  }
});

});

/* ============================= */
/* 🔥 NEWS6 PARSER               */
/* ============================= */
function parseNews6(text){
  const lines = text.split("\n").map(l=>l.trim()).filter(Boolean)

  const tournament = lines[1]
  const match = lines[2]

  const [team1, team2] = match.split(" vs ").map(t=>t.trim().toLowerCase())

  const maps = lines.slice(3).map(line=>{
    const parts = line.split(" ")

    if(parts[0].toLowerCase()==="decider"){
      return {
        team:"decider",
        map:parts[1].toLowerCase(),
        type:"DECIDER"
      }
    }

    return {
      team:parts[0].toLowerCase(),
      map:parts[1].toLowerCase(),
      type:"PICK"
    }
  })

  return {tournament, team1, team2, maps}
}

/* ============================= */
/* 🎨 MAP HTML                   */
/* ============================= */
function generateMapsHTML(maps){
  return maps.map(m=>{
    const isDecider = m.team === "decider"

    return `
    <div class="map ${isDecider ? "decider" : ""}">
      <img class="bg" src="file://${process.cwd()}/maps/${m.map}.jpg"/>
      <div class="blur"></div>
      <div class="overlay"></div>

      ${!isDecider
        ? `<img class="logo" src="file://${process.cwd()}/logos/${m.team}.png"/>`
        : ""
      }

      <div class="map-name">${m.map.toUpperCase()}</div>
      <div class="map-type">${m.type}</div>
    </div>
    `
  }).join("")
}

/* ============================= */
/* 🚀 HANDLE NEWS6               */
/* ============================= */
async function handleNews6(bot, chatId, text){
  const data = parseNews6(text)

  let html = await fs.readFile(
    path.join(__dirname, "news6-template.html"),
    "utf8"
  )

  html = html
    .replace("{{TEAM1}}", data.team1.toUpperCase())
    .replace("{{TEAM2}}", data.team2.toUpperCase())
    .replace("{{TOURNAMENT}}", data.tournament.toUpperCase())
    .replace("{{MAPS}}", generateMapsHTML(data.maps))

  const browser = await puppeteer.launch({
    args:["--no-sandbox","--disable-setuid-sandbox"]
  })

  const page = await browser.newPage()
  await page.setViewport({ width:1200, height:630 })
  await page.setContent(html, { waitUntil:"networkidle0" })

  const filePath = path.join(__dirname, "news6.png")
  await page.screenshot({ path:filePath })

  await browser.close()

  await bot.sendPhoto(chatId, filePath, MAIN_MENU)
}

/* ============================= */
/* 📩 MENU → TEMPLATE            */
/* ============================= */
bot.on("message", (msg) => {

  if(!msg.text) return;

  const text = msg.text;

  let example = "";

  if(text === "🟣 Новина"){
    example = `/news
RESULT
FURIA WIN 2-0`;
  }
  else if(text === "💬 Цитата"){
    example = `/news1
WE ARE READY
S1MPLE`;
  }
  else if(text === "🎤 Side Quote"){
    example = `/news2
WE DESTROYED THEM
CAIRNE`;
  }
  else if(text === "📊 Факт"){
    example = `/news3
FAZE QUALIFIED`;
  }
  else if(text === "🔥 MVP (гор)"){
    example = `/news4
XKASPERKY НА ANCIENT
2.24
+12.24
2.07`;
  }
  else if(text === "📈 MVP (верт)"){
    example = `/news5
XKASPERKY НА ANCIENT
2.24
+12.24
2.07`;
  }
  else if(text === "🗺️ Veto"){
    example = `/news6
blast open rotterdam 2026
navi vs b8
navi inferno
b8 mirage
decider nuke`;
  }
  else if(text === "ℹ️ Інфо"){
    return bot.sendMessage(msg.chat.id, "/info", MAIN_MENU);
  }
  else{
    return;
  }

  bot.sendMessage(msg.chat.id, example, MAIN_MENU);

});

/* ============================= */
/* 🚀 MAIN GENERATOR             */
/* ============================= */
bot.on("message", async (msg)=>{
  try{

    // 🔥 NEWS6
    if(msg.text && msg.text.startsWith("/news6")){
      return handleNews6(bot, msg.chat.id, msg.text)
    }

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

    if(!msg.photo){
      return bot.sendMessage(msg.chat.id, "Додай фото 📸", MAIN_MENU);
    }

    const fileId = msg.photo[msg.photo.length - 1].file_id;
    const file = await bot.getFile(fileId);
    const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;

    const imgBuffer = (await axios.get(fileUrl, { responseType: "arraybuffer" })).data;
    const imageBase64 = `data:image/jpeg;base64,${Buffer.from(imgBuffer).toString("base64")}`;

    let html = await fs.readFile(
      path.join(__dirname, templateFile),
      "utf8"
    );

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

    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();

    await page.setViewport({ width: 900, height: 900 });
    await page.setContent(html, { waitUntil: "networkidle0" });

    const filePath = path.join(__dirname, "news.png");

    await page.screenshot({ path: filePath });

    await browser.close();

    await bot.sendPhoto(msg.chat.id, filePath, MAIN_MENU);

  }catch(e){
    console.log(e);
    bot.sendMessage(msg.chat.id, "Помилка news 💀", MAIN_MENU);
  }
});
