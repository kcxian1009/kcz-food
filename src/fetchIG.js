// ============================================
// 愛吃痣 IG 自動同步程式 v2
// 使用方式: node src/fetchIG.js
// ============================================

const TOKEN = "IGAAS4HSVIktpBZAFp5NVB4b01MclRjYWZAZARmZA0ZADJhYTIxZAXVGbVZAQb3BlVDBHM0hTOS1tTFJmWGdPMDN0Nm8taUNDSXAycUIxUy1ORFp5TXZAUaHRTT2hQMzA4VWtMQlZABWXFxRXBacVFFZAE5vODJ1VzNVd1FnTjdsNHYwRVdlNAZDZD";
const BASE = "https://graph.instagram.com";

// 所有縣市名稱（自動辨識用）
const TAIWAN_CITIES = ["高雄","台南","台中","台北","新北","桃園","新竹","苗栗","彰化","南投","雲林","嘉義","屏東","宜蘭","花蓮","台東","澎湖","金門","基隆"];
const OVERSEAS_CITIES = {
  "韓國": "韓國吃痣",
  "首爾": "韓國吃痣", "釜山": "韓國吃痣", "濟州": "韓國吃痣", "大邱": "韓國吃痣", "仁川": "韓國吃痣",
  "日本": "日本吃痣",
  "東京": "日本吃痣", "大阪": "日本吃痣", "京都": "日本吃痣", "沖繩": "日本吃痣", "北海道": "日本吃痣", "福岡": "日本吃痣", "名古屋": "日本吃痣",
};

// 智慧分類：從標籤自動判斷城市/區域
function classifyPost(tags) {
  // 優先找最精確的：吃痣在XX縣市XX區
  for (const tag of tags) {
    const m1 = tag.match(/^吃痣在(.+)$/);
    if (m1) {
      const loc = m1[1];
      for (const city of TAIWAN_CITIES) {
        if (loc.startsWith(city)) {
          const district = loc.replace(city, "").trim();
          return { city: `${city}吃痣`, district: district || "其他" };
        }
      }
      for (const [place, cityKey] of Object.entries(OVERSEAS_CITIES)) {
        if (loc.includes(place)) return { city: cityKey, district: loc };
      }
    }
  }

  // 次要：XX吃痣（城市層級，不含類別）
  for (const tag of tags) {
    const m2 = tag.match(/^(.+)吃痣$/);
    if (m2) {
      const place = m2[1];
      for (const city of TAIWAN_CITIES) {
        if (place === city) return { city: `${city}吃痣`, district: "其他" };
      }
      for (const [overseas, cityKey] of Object.entries(OVERSEAS_CITIES)) {
        if (place === overseas) return { city: cityKey, district: place };
      }
    }

    // XX吃痣YY（城市+類別，例: 高雄吃痣義式）→ 抓城市，區域填其他
    const m3 = tag.match(/^(.+)吃痣.+$/);
    if (m3) {
      const place = m3[1];
      for (const city of TAIWAN_CITIES) {
        if (place === city) return { city: `${city}吃痣`, district: "其他" };
      }
    }

    if (tag.includes("宅配吃痣") || tag.includes("宅配美食")) {
      return { city: "宅配吃痣", district: "甜點類" };
    }
  }
  return null;
}

// 智慧類別辨識：從 #XX吃痣YY 格式抓類別
function classifyCuisine(tags) {
  for (const tag of tags) {
    // 格式: XX吃痣YY → YY 是類別（排除純區域）
    const m1 = tag.match(/^.+吃痣(.+)$/);
    if (m1) {
      const suffix = m1[1].trim();
      if (suffix && !suffix.endsWith("區") && !suffix.endsWith("市") && suffix.length >= 2) {
        return suffix;
      }
    }
  }
  return null;
}

// 解析 caption/留言裡的所有 hashtag
function extractTags(text) {
  if (!text) return [];
  const matches = text.match(/#[\u4e00-\u9fa5a-zA-Z0-9_]+/g) || [];
  return matches.map(t => t.replace("#", ""));
}

// 從 caption 解析店名（第一行）
function extractStoreName(caption) {
  if (!caption) return "未命名";
  const firstLine = caption.split("\n")[0];

  // 格式1: 「欸今天吃｜店名 說明」or「欸今天吃 | 店名」
  const pipeMatch = firstLine.match(/[｜|]\s*(.+?)(?:\s{2}|$)/);
  if (pipeMatch) {
    const name = pipeMatch[1].trim();
    if (name.length > 1 && name.length < 40) return name;
  }

  // 格式2: 第一行直接是店名（去除 emoji 和符號）
  const clean = firstLine.replace(/^[欸今天吃✔✅📍🍽️🔥💬■▪•✓\-\s]+/, "").trim();
  if (clean.length > 1 && clean.length < 50 && !clean.startsWith("#")) return clean;

  // 格式3: 找 INFORMATION 區塊後的第一行（通常是店名）
  const lines = caption.split("\n");
  const infoIdx = lines.findIndex(l => l.includes("INFORMATION") || l.includes("information"));
  if (infoIdx !== -1 && lines[infoIdx + 1]) {
    const infoName = lines[infoIdx + 1].replace(/^[✔✅📍🍽️🔥💬■▪•\-\s]+/, "").trim();
    if (infoName.length > 1 && !infoName.startsWith("#")) return infoName;
  }

  return "未命名";
}

// 從 caption 解析地址
function extractAddress(caption) {
  if (!caption) return "";
  const lines = caption.split("\n");
  for (const line of lines) {
    if ((line.includes("市") || line.includes("縣")) &&
        (line.includes("路") || line.includes("街") || line.includes("號") || line.includes("巷"))) {
      return line.replace(/[📍地址：:addr\s]/gi, "").trim();
    }
  }
  return "";
}

// 從 caption 解析營業時間
function extractHours(caption) {
  if (!caption) return "";
  const lines = caption.split("\n");
  for (const line of lines) {
    if (line.match(/\d{1,2}:\d{2}/) && (line.includes("～") || line.includes("~") || line.includes("-"))) {
      return line.replace(/[🕐⏰時間營業：:\s]/g, "").trim();
    }
  }
  return "";
}

// 從 caption 解析推薦菜色（含價格的行）
function extractItems(caption) {
  if (!caption) return [];
  const lines = caption.split("\n");
  const items = [];
  for (const line of lines) {
    if ((line.includes("$") || line.includes("元") || line.includes("NT")) && line.length < 50) {
      const clean = line.replace(/^[✔✅▪•\-\s]+/, "").trim();
      if (clean) items.push(clean);
    }
  }
  return items.slice(0, 5);
}

// 抓某篇貼文的留言標籤
async function fetchCommentTags(mediaId) {
  try {
    const url = `${BASE}/${mediaId}/comments?fields=text,username&limit=50&access_token=${TOKEN}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.data) return [];
    const myComments = data.data.filter(c => c.username === "kcz_food");
    const tags = [];
    for (const c of myComments) tags.push(...extractTags(c.text));
    return tags;
  } catch { return []; }
}

// 主程式：抓所有貼文
async function fetchAllPosts() {
  const results = [];
  let url = `${BASE}/me/media?fields=id,caption,media_type,media_url,thumbnail_url,timestamp,like_count&limit=100&access_token=${TOKEN}`;
  let page = 1;

  console.log("開始抓取 IG 貼文...");

  while (url) {
    console.log(`抓取第 ${page} 頁...`);
    const res = await fetch(url);
    const data = await res.json();
    if (!data.data) { console.log("API 錯誤:", data); break; }

    for (const post of data.data) {
      if (post.media_type === "STORY") continue;

      const captionTags = extractTags(post.caption);
      let allTags = [...captionTags];

      // 一律去留言找標籤（因為你的區域標籤都放留言）
      const commentTags = await fetchCommentTags(post.id);
      allTags = [...new Set([...captionTags, ...commentTags])];

      const classification = classifyPost(allTags);
      if (!classification) continue;

      const cuisine = classifyCuisine(allTags);
      const imageUrl = post.media_type === "VIDEO" ? post.thumbnail_url : post.media_url;
      const igPostId = post.id;

      results.push({
        id: igPostId,
        name: extractStoreName(post.caption),
        address: extractAddress(post.caption),
        hours: extractHours(post.caption),
        caption: (post.caption || "").substring(0, 300),
        items: extractItems(post.caption),
        tags: allTags.filter(t => t.includes("吃痣") || t.includes("美食")).slice(0, 5).map(t => `#${t}`),
        igLink: `https://www.instagram.com/p/${igPostId}/`,
        date: (post.timestamp || "").substring(0, 10),
        imageUrl: imageUrl || "",
        likes: post.like_count || 0,
        cuisine: cuisine || "",
        city: classification.city,
        district: classification.district,
      });
    }

    url = data.paging?.next || null;
    page++;
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\n總共抓到 ${results.length} 篇有分類的貼文`);
  return results;
}

// 轉成網站格式
function buildSiteData(posts) {
  const data = {};
  for (const post of posts) {
    if (!data[post.city]) data[post.city] = {};
    if (!data[post.city][post.district]) data[post.city][post.district] = [];
    data[post.city][post.district].push(post);
  }
  // 每個區域內按日期排序（最新在前）
  for (const city of Object.values(data)) {
    for (const district of Object.values(city)) {
      district.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
  }
  return data;
}

async function main() {
  const posts = await fetchAllPosts();
  const siteData = buildSiteData(posts);

  const fs = await import("fs");
  fs.writeFileSync("./src/igData.json", JSON.stringify(siteData, null, 2), "utf-8");

  console.log("✅ 完成！存到 src/igData.json");
  console.log("\n城市分類：");
  const sorted = Object.entries(siteData).sort((a,b) => {
    const ta = Object.values(b[1]).flat().length;
    const tb = Object.values(a[1]).flat().length;
    return ta - tb;
  });
  for (const [city, districts] of sorted) {
    const total = Object.values(districts).flat().length;
    const distList = Object.entries(districts)
      .sort((a,b) => b[1].length - a[1].length)
      .slice(0, 3)
      .map(([d, ps]) => `${d}(${ps.length})`)
      .join(", ");
    console.log(`  ${city}: ${Object.keys(districts).length} 區 / ${total} 篇 → ${distList}...`);
  }
}

main().catch(console.error);
