const TelegramBot = require("node-telegram-bot-api");
const puppeteer = require("puppeteer");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

const token = process.env.TOKEN;
const bot = new TelegramBot(token, { polling: true });

/* ============================= */
/* 📱 MENU */
/* ============================= */
const MAIN_MENU = {
  reply_markup: {
    keyboard: [
      ["🟣 Новина", "💬 Цитата"],
      ["🎤 Side Quote", "📊 Факт"],
      ["🔥 MVP (гор)", "📈 MVP (верт)"],
      ["🧠 VETO"],
      ["ℹ️ Інфо"]
    ],
    resize_keyboard: true
  }
};

/* ============================= */
/* TEMPLATE MAP */
/* ============================= */
const NEWS_TEMPLATES = {
  news: "news-template.html",
  news1: "news1-template.html",
  news2: "news2-template.html",
  news3: "news3-template.html",
  news4: "news4-template.html",
  news5: "news5-template.html",
  news6: "news6-template.html"
};

/* ============================= */
/* FONT SIZE */
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
bot.on("message", (msg)=>{
  if(!msg.text) return;

  let example = "";

  if(msg.text === "🟣 Новина"){
    example = `/news\nRESULT\nFURIA WIN 2-0`;
  }
  else if(msg.text === "💬 Цитата"){
    example = `/news1\nWE ARE READY\nS1MPLE`;
  }
  else if(msg.text === "🎤 Side Quote"){
    example = `/news2\nWE DESTROYED THEM\nCAIRNE`;
  }
  else if(msg.text === "📊 Факт"){
    example = `/news3\nFAZE QUALIFIED`;
  }
  else if(msg.text === "🔥 MVP (гор)"){
    example = `/news4\nXKASPERKY\n2.24\n+12.24\n2.07`;
  }
  else if(msg.text === "📈 MVP (верт)"){
    example = `/news5\nXKASPERKY\n2.24\n+12.24\n2.07`;
  }
  else if(msg.text === "🧠 VETO"){
    example = `/news6
navi vs falcons
blast
bo3
inferno pick navi
overpass pick falcons
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

    if(!msg.caption) return;

    const command = msg.caption.split("\n")[0].toLowerCase();
    if(!command.startsWith("/news")) return;

    const commandKey = command.replace("/", "");
    const templateFile = NEWS_TEMPLATES[commandKey];

    const lines = msg.caption.split("\n").slice(1);

    let html = await fs.readFile(path.join(__dirname, templateFile),"utf8");

    /* ============================= */
    /* NEWS6 (VETO) */
    /* ============================= */
    if(commandKey === "news6"){

      let vsLine = lines[0] || "";
      let lineIndex = 1;

      let tournament = "";
      let format = "";

      if(lines[1]?.toLowerCase().startsWith("bo")){
        format = lines[1].toLowerCase();
        lineIndex = 2;
      } else {
        tournament = lines[1] || "";
        format = lines[2]?.toLowerCase() || "bo3";
        lineIndex = 3;
      }

      const [team1, team2] = vsLine.toLowerCase().split("vs").map(s=>s.trim());

      const mapLines = lines.slice(lineIndex);

      function parse(line){
        line = line.toLowerCase();

        if(line.includes(",")){
          const [name,type,team] = line.split(",");
          return { name:name.trim(), type:type.trim(), team:team?.trim() };
        }

        const parts = line.split(" ");

        if(parts.includes("decider")){
          return { name:parts[0], type:"decider" };
        }

        return { name:parts[0], type:parts[1], team:parts[2] };
      }

      let maps = mapLines.map(parse);

      function norm(m){
        if(!m.team) return m;
        if(m.team === team1 || m.team === "team1") m.team = "team1";
        else if(m.team === team2 || m.team === "team2") m.team = "team2";
        return m;
      }

      maps = maps.map(norm);

      if(format === "bo1") maps = maps.slice(0,7);
      if(format === "bo3") maps = maps.slice(0,3);
      if(format === "bo5") maps = maps.slice(0,5);

      while(maps.length < 5) maps.push({});

      function imgToBase64(file){
        const filePath = path.join(__dirname,file);
        if(!fs.existsSync(filePath)) return "";
        const buffer = fs.readFileSync(filePath);
        return `data:image/png;base64,${buffer.toString("base64")}`;
      }

      function logo(map){
        if(map.type === "ban" || map.type === "decider") return "";
        if(!map.team) return "";

        const team = map.team === "team1" ? team1 : team2;
        return `<div class="logo"><img src="${imgToBase64(`/logos/${team}.png`)}"></div>`;
      }

      html = html
        .replace("{{TEAM1}}", team1.toUpperCase())
        .replace("{{TEAM2}}", team2.toUpperCase())
        .replace("{{TOURNAMENT}}", tournament.toUpperCase());

      for(let i=0;i<5;i++){
        const m = maps[i] || {};

        html = html
          .replace(`{{MAP${i+1}_IMAGE}}`, m.name ? imgToBase64(`/maps/${m.name}.png`) : "")
          .replace(`{{MAP${i+1}_NAME}}`, (m.name||"").toUpperCase())
          .replace(`{{MAP${i+1}_TYPE}}`, (m.type||"").toUpperCase())
          .replace(`{{MAP${i+1}_LOGO}}`, logo(m))
          .replace(`{{MAP${i+1}_CLASS}}`, (format==="bo3" && i>2) ? "hidden" : "");
      }

    }

    /* ============================= */
    /* IMAGE */
    /* ============================= */
    const fileId = msg.photo[msg.photo.length - 1].file_id;
    const file = await bot.getFile(fileId);
    const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;

    const imgBuffer = (await axios.get(fileUrl,{responseType:"arraybuffer"})).data;
    const imageBase64 = `data:image/jpeg;base64,${Buffer.from(imgBuffer).toString("base64")}`;

    html = html.replace(/{{IMAGE}}/g, imageBase64);

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
