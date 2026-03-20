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
      ["🗺️ VETO BO1", "🗺️ VETO BO3", "🗺️ VETO BO5"],
      ["ℹ️ Інфо"]
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
/* 📘 INFO                       */
/* ============================= */
bot.onText(/\/info/, (msg) => {
const text = `
📘 VETO:

BO1:
/news6
blast open
navi vs b8
navi inferno BAN
b8 mirage BAN
navi nuke BAN
b8 overpass BAN
decider ancient

BO3:
/news6
blast open
navi vs b8
navi inferno PICK
b8 mirage PICK
decider nuke

📸 фото НЕ потрібно
`;
bot.sendMessage(msg.chat.id, text, MAIN_MENU);
});

/* ============================= */
/* 🚀 START                      */
/* ============================= */
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "Обери тип поста 👇", MAIN_MENU);
});

/* ============================= */
/* 🔥 NEWS6 PARSER (NEW)         */
/* ============================= */
function parseNews6(text){
  const lines = text.split("\n").map(l=>l.trim()).filter(Boolean)

  const tournament = lines[1]
  const match = lines[2]
  const [team1, team2] = match.split(" vs ").map(t=>t.toLowerCase())

  const maps = lines.slice(3).map(line=>{
    const parts = line.split(" ")

    if(parts[0].toLowerCase() === "decider"){
      return { team:"decider", map:parts[1], type:"DECIDER" }
    }

    return {
      team: parts[0],
      map: parts[1],
      type: (parts[2] || "PICK").toUpperCase()
    }
  })

  return { tournament, team1, team2, maps }
}

/* ============================= */
/* 🎨 MAP HTML                   */
/* ============================= */
function generateMapsHTML(maps){
  return maps.map(m=>{

    let extraClass = ""
    if(m.type === "BAN") extraClass = "ban"
    if(m.type === "DECIDER") extraClass = "decider"

    return `
    <div class="map ${extraClass}">
      <img class="bg" src="file://${process.cwd()}/maps/${m.map}.png"/>
      <div class="blur"></div>
      <div class="overlay"></div>

      ${m.team !== "decider"
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
async function handleNews6(chatId, text){
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
/* 📩 MENU                       */
/* ============================= */
bot.on("message", (msg) => {

  if(!msg.text) return;

  const text = msg.text;
  let example = "";

  if(text === "🗺️ VETO BO1"){
    example = `/news6
blast open
navi vs b8
navi inferno BAN
b8 mirage BAN
navi nuke BAN
b8 overpass BAN
decider ancient`;
  }

  else if(text === "🗺️ VETO BO3"){
    example = `/news6
blast open
navi vs b8
navi inferno PICK
b8 mirage PICK
decider nuke`;
  }

  else if(text === "🗺️ VETO BO5"){
    example = `/news6
blast open
navi vs b8
navi inferno PICK
b8 mirage PICK
navi nuke PICK
b8 overpass PICK
decider ancient`;
  }

  if(example){
    bot.sendMessage(msg.chat.id, example, MAIN_MENU);
  }

});

/* ============================= */
/* 🚀 MAIN GENERATOR             */
/* ============================= */
bot.on("message", async (msg)=>{
  try{

    if(msg.text && msg.text.startsWith("/news6")){
      return handleNews6(msg.chat.id, msg.text)
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
