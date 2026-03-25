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
      ["📰 Новини"],
      ["🎤 Side Quote", "💬 Цитата"],
      ["📊 Факт"],
      ["🔥 MVP (гор)", "📈 MVP (верт)"],
      ["📊 RESULT", "📅 MATCHES"],
      ["🧠 VETO BO1", "🧠 VETO BO3", "🧠 VETO BO5"],
      ["🏆 Переможець"],
      ["ℹ️ Інфо"]
    ],
    resize_keyboard: true
  }
};

const NEWS_MENU = {
  reply_markup: {
    keyboard: [
      ["🟣 Новина 1", "🆕 Новина 2"],
      ["🆕 Новина 10"],
      ["🔙 Назад"]
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
NEWS_TEMPLATES["news9"] = "news9-template.html";
NEWS_TEMPLATES["news10"] = "news10-template.html";

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

  if(text === "📰 Новини"){
    return bot.sendMessage(msg.chat.id, "Обери тип новини:", NEWS_MENU);
  }

  if(text === "🏆 Переможець"){
    example = `/news11
ESL PRO LEAGUE S23
https://www.hltv.org/team/4608/natus-vincere`;
    return bot.sendMessage(msg.chat.id, example, MAIN_MENU);
  }

  if(text === "/news10"){
    example = `/news10
RESULT`;
    return bot.sendMessage(msg.chat.id, example, MAIN_MENU);
  }

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
BLAST Open rotterdam 2026
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

  else if(text === "🟣 Новина 1"){
example = `/news
RESULT
FURIA WIN 2-0`;
  }

  else if(text === "🆕 Новина 2"){
example = `/news9
RESULT
FURIA WIN 2-0`;
  }

  else if(text === "🆕 Новина 10"){
example = `/news10
RESULT`;
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
nuke ban navi
dust2 ban falcons
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

/* DEFAULT */
let label = "NEWS";
let textValue = "";
let author = "";
let stat1 = "", stat2 = "", stat3 = "";

/* ============================= */
/* 🔥 NEWS11 FIX */
/* ============================= */
/* ============================= */
/* 🔥 NEWS11 (FINAL WORKING) */
/* ============================= */
if(commandKey === "news11"){

const tournament = (lines[0] || "").toUpperCase();
const teamUrl = (lines[1] || "").trim();

/* ============================= */
/* 🔥 PARSE HLTV TEAM (REAL IMG) */
/* ============================= */
async function getPlayersImages(url){
  try{
    const res = await axios.get(url, {
      headers:{ "User-Agent":"Mozilla/5.0" }
    });

    const html = res.data;

    // 🔥 беремо ГОТОВІ bodyshot картинки
    const matches = [...html.matchAll(/class="bodyshot-team-img"[^>]+src="([^"]+)"/g)];

    let images = matches.map(m => {
      let src = m[1];

      // прибираємо query (?ixlib...)
      src = src.split("?")[0];

      return src;
    });

    // беремо тільки 5 гравців
    images = images.slice(0,5);

    /* ============================= */
    /* 🔥 CONVERT TO BASE64 */
    /* ============================= */
    const base64Images = [];

    for(let img of images){
      try{
        const res = await axios.get(img, { responseType:"arraybuffer" });
        const base64 = `data:image/png;base64,${Buffer.from(res.data).toString("base64")}`;
        base64Images.push(base64);
      }catch{
        base64Images.push("");
      }
    }

    // fallback до 5
    while(base64Images.length < 5){
      base64Images.push("");
    }

    return base64Images;

  }catch(e){
    console.log("HLTV PARSE ERROR", e);
    return ["","","","",""];
  }
}

/* ============================= */
/* LOAD IMAGES */
/* ============================= */
const imgs = await getPlayersImages(teamUrl);

/* ============================= */
/* INSERT INTO HTML */
/* ============================= */
html = html
.replace(/{{P1}}/g, imgs[0])
.replace(/{{P2}}/g, imgs[1])
.replace(/{{P3}}/g, imgs[2])
.replace(/{{P4}}/g, imgs[3])
.replace(/{{P5}}/g, imgs[4])
.replace(/{{TOURNAMENT}}/g, tournament);

}

/* ДАЛІ ВСЕ 1:1 ЯК У ТЕБЕ */


/* ============================= */
/* DEFAULT NEWS */
/* ============================= */
if(commandKey === "news" || commandKey === "news9"){
  label = (lines[0] || "NEWS").trim();
  textValue = (lines[1] || "").trim();

  if(!textValue){
    textValue = label;
    label = "NEWS";
  }
}

else if(commandKey === "news10"){
  label = (lines[0] || "NEWS").trim();
  textValue = "";
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

/* ============================= */
/* NEWS6 */
/* ============================= */
else if(commandKey === "news6"){

let vsLine = lines[0] || "";
let lineIndex = 1;

let tournament = "";
let format = "";

if(lines[1]?.toLowerCase().startsWith("bo")){
  format = lines[1].toLowerCase();
  lineIndex = 2;
} else {
  tournament = lines[1] || "";
  format = (lines[2] || "bo3").toLowerCase();
  lineIndex = 3;
}

const [team1, team2] = vsLine.toLowerCase().split("vs").map(s=>s.trim());

const mapLines = lines.slice(lineIndex);

function parse(line){
  line = line.toLowerCase().trim();
  const p = line.split(" ");

  if(p.includes("decider")){
    return { name:p[0], type:"decider" };
  }

  return { name:p[0], type:p[1], team:p[2] };
}

let maps = mapLines.map(parse);

maps = maps.map(m=>{
  if(!m.team) return m;

  if(m.team === team1 || m.team === "team1") m.team = "team1";
  else if(m.team === team2 || m.team === "team2") m.team = "team2";

  return m;
});

let maxMaps = 7;
while(maps.length < maxMaps) maps.push({});

const img = (file)=>{
  const p = path.join(__dirname,file);
  if(!fs.existsSync(p)) return "";
  return `data:image/png;base64,${fs.readFileSync(p).toString("base64")}`;
};

const logo = (m)=>{
  if(!m.team) return "";
  if(m.type === "decider") return "";
  const t = m.team === "team1" ? team1 : team2;
  return `<div class="logo"><img src="${img(`/logos/${t}.png`)}"></div>`;
};

html = html
.replace(/{{TEAM1}}/g, team1.toUpperCase())
.replace(/{{TEAM2}}/g, team2.toUpperCase())
.replace(/{{TOURNAMENT}}/g, tournament.toUpperCase());

for(let i=0;i<7;i++){
const m = maps[i] || {};
let typeClass = "";

if(m.type === "ban") typeClass = "ban";
else if(m.type === "pick" && m.team === "team1") typeClass = "pick1";
else if(m.type === "pick" && m.team === "team2") typeClass = "pick2";
else if(m.type === "decider") typeClass = "decider";

html = html
.replace(`{{MAP${i+1}_IMAGE}}`, m.name ? img(`/maps/${m.name}.png`) : "")
.replace(`{{MAP${i+1}_NAME}}`, (m.name||"").toUpperCase())
.replace(`{{MAP${i+1}_TYPE}}`, (m.type||"").toUpperCase())
.replace(`{{MAP${i+1}_TYPE_CLASS}}`, typeClass)
.replace(`{{MAP${i+1}_LOGO}}`, logo(m))
.replace(`{{MAP${i+1}_CLASS}}`, "");
}

}

/* ============================= */
/* NEWS7 */
/* ============================= */
else if(commandKey === "news7"){

let vsLine = lines[0] || "";
let tournament = lines[1] || "";
let format = (lines[2] || "bo3").toUpperCase();
let round = (lines[3] || "").toUpperCase();
let scoreLine = lines[4] || "0-0";

const [team1, team2] = vsLine.toLowerCase().split("vs").map(s=>s.trim());
const [score1, score2] = scoreLine.split("-").map(s=>s.trim());

const mapLines = lines.slice(5);

const img = (file)=>{
  const p = path.join(__dirname,file);
  if(!fs.existsSync(p)) return "";
  return `data:image/png;base64,${fs.readFileSync(p).toString("base64")}`;
};

html = html
.replace(/{{TEAM1}}/g, team1.toUpperCase())
.replace(/{{TEAM2}}/g, team2.toUpperCase())
.replace(/{{TEAM1_LOGO}}/g, img(`/logos/${team1}.png`))
.replace(/{{TEAM2_LOGO}}/g, img(`/logos/${team2}.png`))
.replace(/{{TOURNAMENT}}/g, tournament.toUpperCase())
.replace(/{{FORMAT}}/g, format)
.replace(/{{FORMAT_CLASS}}/g, format.toLowerCase())
.replace(/{{ROUND}}/g, round)
.replace(/{{SCORE1}}/g, score1)
.replace(/{{SCORE2}}/g, score2);

let mapCount = format === "BO1" ? 1 : format === "BO5" ? 5 : 3;

for(let i=0;i<5;i++){

  const line = mapLines[i] || "";
  const p = line.toLowerCase().split(" ");

  let name = p[0] || "";
  let score = p[1] || "";
  let winner = p[2] || null;

  let cls = "";

  if(i >= mapCount) cls += " hidden";
  if(score === "-" || !name) cls += " disabled";

  if(winner === "team1") cls += " win1";
  if(winner === "team2") cls += " win2";

  html = html
  .replace(`{{MAP${i+1}_NAME}}`, name.toUpperCase())
  .replace(`{{MAP${i+1}_SCORE}}`, score)
  .replace(`{{MAP${i+1}_IMAGE}}`, name ? img(`/maps/${name}.png`) : "")
  .replace(`{{MAP${i+1}_CLASS}}`, cls)
  .replace(`{{MAP${i+1}_WINNER}}`,
    winner ? img(`/logos/${winner === "team1" ? team1 : team2}.png`) : img(`/logos/default.png`)
  );
}

}

/* ============================= */
/* NEWS8 */
/* ============================= */
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

let title = isSchedule ? "РОЗКЛАД МАТЧІВ" : "РЕЗУЛЬТАТИ МАТЧІВ";

html = html
.replace(/{{TITLE}}/g, title)
.replace(/{{TOURNAMENT}}/g, tournament)
.replace(/{{MATCHES}}/g, matchesHTML)
.replace(/{{GRID}}/g, grid);

}

let imageBase64 = "";

if(commandKey !== "news6" && commandKey !== "news7" && commandKey !== "news8" && commandKey !== "news11"){
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
await page.evaluateHandle('document.fonts.ready');

const filePath = path.join(__dirname,"news.png");

await page.screenshot({ path:filePath });

await browser.close();

await bot.sendPhoto(msg.chat.id,filePath,MAIN_MENU);

}catch(e){
console.log(e);
bot.sendMessage(msg.chat.id,"Помилка 💀",MAIN_MENU);
}
});
