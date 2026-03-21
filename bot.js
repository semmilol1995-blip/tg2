const TelegramBot = require("node-telegram-bot-api");
const puppeteer = require("puppeteer");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

const token = process.env.TOKEN;
const bot = new TelegramBot(token, { polling: true });

/* ============================= */
/* MENU */
/* ============================= */
const MAIN_MENU = {
  reply_markup: {
    keyboard: [
      ["🟣 Новина", "💬 Цитата"],
      ["🎤 Side Quote", "📊 Факт"],
      ["🔥 MVP (гор)", "📈 MVP (верт)"],
      ["📊 RESULT", "📅 MATCHES"],
      ["🧠 VETO BO1", "🧠 VETO BO3", "🧠 VETO BO5"],
      ["ℹ️ Інфо"]
    ],
    resize_keyboard: true
  }
};

const MATCH_MENU = {
  reply_markup: {
    keyboard: [
      ["📅 Розклад", "🏁 Результати"],
      ["🔙 Назад"]
    ],
    resize_keyboard: true
  }
};

/* ============================= */
/* TEMPLATE MAP */
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
/* MENU BUTTONS */
/* ============================= */
bot.on("message", (msg) => {

  if(!msg.text) return;

  const text = msg.text;
  let example = "";

  if(text === "📅 MATCHES"){
    return bot.sendMessage(msg.chat.id, "Обери режим:", MATCH_MENU);
  }

  if(text === "🔙 Назад"){
    return bot.sendMessage(msg.chat.id, "Меню", MAIN_MENU);
  }

  if(text === "📅 Розклад"){
example = `/news8
BLAST Open Lisbon 2026
navi vs faze 13:00 bo3
faze vs tyloo 15:30 bo3
falcons vs navi 18:00 bo3
aurora vs furia 20:30 bo3`;
  }

  else if(text === "🏁 Результати"){
example = `/news8
BLAST Open Lisbon 2026
nrg 2:0 b8
faze 1:2 tyloo
falcons 1:2 navi
aurora 2:0 furia`;
  }

  else if(text === "📊 RESULT"){
example = `/news7
aurora vs furia
blast
bo3
round 2
2-0
dust2 16:14 team1
inferno 13:6 team1
overpass -`;
  }
  else if(text === "🟣 Новина"){
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
XKASPERKY
2.24
+12.24
2.07`;
  }
  else if(text === "📈 MVP (верт)"){
example = `/news5
XKASPERKY
2.24
+12.24
2.07`;
  }
  else if(text === "🧠 VETO BO1"){
example = `/news6
navi vs falcons
blast
bo1
inferno ban navi
overpass ban falcons
anubis ban navi
mirage ban falcons
nuke ban navi
dust2 ban falcons
ancient decider`;
  }
  else if(text === "🧠 VETO BO3"){
example = `/news6
navi vs falcons
blast
bo3
inferno ban navi
overpass ban falcons
anubis pick navi
mirage pick falcons
nuke pick navi
dust2 pick falcons
ancient decider`;
  }
  else if(text === "🧠 VETO BO5"){
example = `/news6
navi vs falcons
blast
bo5
inferno ban navi
overpass ban falcons
anubis pick navi
mirage pick falcons
nuke pick navi
dust2 pick falcons
ancient decider`;
  }
  else if(text === "ℹ️ Інфо"){
    return bot.sendMessage(msg.chat.id, "/info", MAIN_MENU);
  }
  else return;

  bot.sendMessage(msg.chat.id, example, MAIN_MENU);

});
/* ============================= */
/* MAIN GENERATOR */
/* ============================= */
bot.on("message", async (msg)=>{

try{

const input = msg.caption || msg.text;
if(!input) return;

const command = input.split("\n")[0].trim().toLowerCase();
if(!command.startsWith("/news")) return;

const commandKey = command.replace("/", "");
const templateFile = NEWS_TEMPLATES[commandKey] || "news-template.html";

const lines = input.split("\n").slice(1);

let html = await fs.readFile(path.join(__dirname, templateFile),"utf8");

/* ============================= */
/* DEFAULT NEWS */
/* ============================= */
let label = "NEWS";
let textValue = "";
let author = "";
let stat1 = "", stat2 = "", stat3 = "";
if(commandKey === "news"){
  label = (lines[0] || "NEWS").trim();
  textValue = (lines[1] || "").trim();

  if(!textValue){
    textValue = label;
    label = "NEWS";
  }
}

else if(commandKey === "news1" || commandKey === "news2"){
  textValue = lines[0] || "";
  author = lines[1] || "";
  label = "";
}
else if(commandKey === "news3"){
  textValue = lines.join(" ");
  label = "";
}
else if(commandKey === "news4" || commandKey === "news5"){
  textValue = lines[0] || "";
  stat1 = lines[1] || "";
  stat2 = lines[2] || "";
  stat3 = lines[3] || "";
  label = "СТАТИСТИКА";
}
else if(commandKey === "news8"){

const tournament = (lines[0] || "").toUpperCase();
const matchLinesRaw = lines.slice(1).filter(l => l.trim());

const isSchedule = matchLinesRaw.some(l => l.includes("vs"));
const isResults = matchLinesRaw.some(l => l.includes(":"));

const img = (file)=>{
  const p = path.join(__dirname,file);
  if(!fs.existsSync(p)){
    const d = path.join(__dirname,"/logos/default.png");
    if(!fs.existsSync(d)) return "";
    return `data:image/png;base64,${fs.readFileSync(d).toString("base64")}`;
  }
  return `data:image/png;base64,${fs.readFileSync(p).toString("base64")}`;
};

let matchesHTML = "";

matchLinesRaw.forEach(line=>{
  line = line.toLowerCase().trim();

  let team1="", team2="", center="", format="";

  if(isSchedule){
    const parts = line.split(" ");
    const vsIndex = parts.indexOf("vs");

    team1 = parts.slice(0,vsIndex).join("");
    team2 = parts[vsIndex+1];
    center = parts[vsIndex+2] || "";
    format = (parts[vsIndex+3] || "").toUpperCase();
  }

  if(isResults){
    const parts = line.split(" ");
    team1 = parts[0];
    center = parts[1];
    team2 = parts[2];
  }

  matchesHTML += `
  <div class="card">
    <div class="team">
      <div class="logoBox">
        <img src="${img(`/logos/${team1}.png`)}">
      </div>
      ${team1.toUpperCase()}
    </div>

    <div class="center">
      ${center}
      ${isSchedule ? `<div class="format">${format}</div>` : ``}
    </div>

    <div class="team">
      ${team2.toUpperCase()}
      <div class="logoBox">
        <img src="${img(`/logos/${team2}.png`)}">
      </div>
    </div>
  </div>
  `;
});

let grid = "grid-1";
if(matchLinesRaw.length >= 6) grid = "grid-2";

let title = isSchedule ? "МАТЧІ ДНЯ" : "РЕЗУЛЬТАТИ МАТЧІВ";

html = html
.replace(/{{TITLE}}/g, title)
.replace(/{{TOURNAMENT}}/g, tournament)
.replace(/{{MATCHES}}/g, matchesHTML)
.replace(/{{GRID}}/g, grid);

}
let imageBase64 = "";

if(commandKey === "news6"){
  imageBase64 = "";
}
else if(commandKey === "news7"){
  if(msg.photo){
    const fileId = msg.photo[msg.photo.length - 1].file_id;
    const file = await bot.getFile(fileId);
    const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
    const imgBuffer = (await axios.get(fileUrl, { responseType: "arraybuffer" })).data;
    imageBase64 = `data:image/jpeg;base64,${Buffer.from(imgBuffer).toString("base64")}`;
  }
}
else if(commandKey !== "news8"){
  if(!msg.photo){
    return bot.sendMessage(msg.chat.id, "Додай фото 📸", MAIN_MENU);
  }

  const fileId = msg.photo[msg.photo.length - 1].file_id;
  const file = await bot.getFile(fileId);
  const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
  const imgBuffer = (await axios.get(fileUrl, { responseType: "arraybuffer" })).data;
  imageBase64 = `data:image/jpeg;base64,${Buffer.from(imgBuffer).toString("base64")}`;
}

html = html
.replace(/{{IMAGE}}/g, imageBase64)
.replace(/{{PLAYER_IMAGE}}/g, imageBase64)
.replace(/{{LABEL}}/g, label.toUpperCase())
.replace(/{{TEXT}}/g, textValue.toUpperCase())
.replace(/{{AUTHOR}}/g, author.toUpperCase())
.replace(/{{FONTSIZE}}/g, getFontSize(textValue) + "px")
.replace(/{{STAT1}}/g, stat1)
.replace(/{{STAT2}}/g, stat2)
.replace(/{{STAT3}}/g, stat3);

const browser = await puppeteer.launch({
  args:["--no-sandbox","--disable-setuid-sandbox"]
});

const page = await browser.newPage();

await page.setViewport({ width:900, height:900 });
await page.setContent(html,{waitUntil:"networkidle0"});

const filePath = path.join(__dirname,"news.png");

await page.screenshot({ path:filePath });

await browser.close();

await bot.sendPhoto(msg.chat.id,filePath,MAIN_MENU);

}catch(e){
console.log(e);
bot.sendMessage(msg.chat.id,"Помилка 💀",MAIN_MENU);
}
});  
