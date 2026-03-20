const TelegramBot = require("node-telegram-bot-api");
const puppeteer = require("puppeteer");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

const token = process.env.TOKEN;
const bot = new TelegramBot(token, { polling: true });

/* ============================= */
const MAIN_MENU = {
  reply_markup: {
    keyboard: [
      ["🟣 Новина", "💬 Цитата"],
      ["🎤 Side Quote", "📊 Факт"],
      ["🔥 MVP (гор)", "📈 MVP (верт)"],
      ["🧠 VETO BO1", "🧠 VETO BO3", "🧠 VETO BO5"],
      ["ℹ️ Інфо"]
    ],
    resize_keyboard: true
  }
};

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
/* MENU */
/* ============================= */
bot.on("message", (msg) => {
  if(!msg.text) return;

  let example = "";

  if(msg.text === "🧠 VETO BO1"){
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
  else if(msg.text === "🧠 VETO BO3"){
example = `/news6
navi vs falcons
blast
bo3
inferno pick navi
overpass pick falcons
ancient decider`;
  }
  else if(msg.text === "🧠 VETO BO5"){
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
  else return;

  bot.sendMessage(msg.chat.id, example, MAIN_MENU);
});

/* ============================= */
/* GENERATOR */
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
/* СТАРІ /news */
/* ============================= */
let label = "NEWS";
let text = "";
let author = "";
let stat1 = "", stat2 = "", stat3 = "";

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

/* normalize */
maps = maps.map(m=>{
if(!m.team) return m;

if(m.team === team1 || m.team === "team1") m.team = "team1";
else if(m.team === team2 || m.team === "team2") m.team = "team2";

return m;
});

/* formats */
let maxMaps = 5;
if(format === "bo1") maxMaps = 7;
if(format === "bo3") maxMaps = 3;
if(format === "bo5") maxMaps = 7;

while(maps.length < maxMaps) maps.push({});

/* helpers */
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

/* render */
html = html
.replace(/{{TEAM1}}/g, team1.toUpperCase())
.replace(/{{TEAM2}}/g, team2.toUpperCase())
.replace(/{{TOURNAMENT}}/g, tournament.toUpperCase());

for(let i=0;i<7;i++){
const m = maps[i] || {};

html = html
.replace(`{{MAP${i+1}_IMAGE}}`, m.name ? img(`/maps/${m.name}.png`) : "")
.replace(`{{MAP${i+1}_NAME}}`, (m.name||"").toUpperCase())
.replace(`{{MAP${i+1}_TYPE}}`, (m.type||"").toUpperCase())
.replace(`{{MAP${i+1}_TYPE_CLASS}}`,
  m.type === "ban" ? "ban" :
  m.type === "pick" ? "pick" :
  m.type === "decider" ? "decider" : ""
)
.replace(`{{MAP${i+1}_LOGO}}`, logo(m))
.replace(
  `{{MAP${i+1}_CLASS}}`,
  (format==="bo3" && i>2) ? "hidden" : ""
);
}

}

/* ============================= */
/* IMAGE (тільки не news6) */
/* ============================= */
let imageBase64 = "";

if(commandKey !== "news6"){
  if(!msg.photo){
    return bot.sendMessage(msg.chat.id, "Додай фото 📸", MAIN_MENU);
  }

  const fileId = msg.photo[msg.photo.length - 1].file_id;
  const file = await bot.getFile(fileId);
  const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;

  const imgBuffer = (await axios.get(fileUrl, { responseType: "arraybuffer" })).data;
  imageBase64 = `data:image/jpeg;base64,${Buffer.from(imgBuffer).toString("base64")}`;
}

/* ============================= */
/* ЗАГАЛЬНИЙ РЕНДЕР */
/* ============================= */
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

/* ============================= */
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
