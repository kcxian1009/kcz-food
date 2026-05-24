import { useState, useEffect } from "react";
import RAW_IG_DATA from "./igData.json";

// City display config (color + category) - keeps design info separate from IG data
const CITY_CONFIG = {
  "高雄吃痣": { color: "#E85D3A", category: "taiwan" },
  "台南吃痣": { color: "#D4A259", category: "taiwan" },
  "台中吃痣": { color: "#4A9B7F", category: "taiwan" },
  "台北吃痣": { color: "#6B5CE7", category: "taiwan" },
  "新北吃痣": { color: "#5B8DB8", category: "taiwan" },
  "桃園吃痣": { color: "#7B9E6B", category: "taiwan" },
  "新竹吃痣": { color: "#A07850", category: "taiwan" },
  "苗栗吃痣": { color: "#8B7355", category: "taiwan" },
  "彰化吃痣": { color: "#C07840", category: "taiwan" },
  "雲林吃痣": { color: "#7A9E7E", category: "taiwan" },
  "嘉義吃痣": { color: "#C8944A", category: "taiwan" },
  "屏東吃痣": { color: "#6BAA75", category: "taiwan" },
  "宜蘭吃痣": { color: "#5B9EA0", category: "taiwan" },
  "花蓮吃痣": { color: "#4A7FA5", category: "taiwan" },
  "台東吃痣": { color: "#6B8E6B", category: "taiwan" },
  "澎湖吃痣": { color: "#4A9B9B", category: "taiwan" },
  "金門吃痣": { color: "#A08040", category: "taiwan" },
  "基隆吃痣": { color: "#607080", category: "taiwan" },
  "南投吃痣": { color: "#7A9060", category: "taiwan" },
  "韓國吃痣": { color: "#2E86AB", category: "overseas" },
  "日本吃痣": { color: "#C23B22", category: "overseas" },
  "宅配吃痣": { color: "#8B6914", category: "delivery" },
};
const DEFAULT_CONFIG = { color: "#999999", category: "taiwan" };

// Merge IG data with display config
const MOCK_DATA = Object.fromEntries(
  Object.entries(RAW_IG_DATA).map(([city, districts]) => [
    city,
    {
      ...(CITY_CONFIG[city] || DEFAULT_CONFIG),
      districts,
    }
  ])
);


// Total posts count from real IG data
const TOTAL_POSTS = Object.values(MOCK_DATA).reduce((sum, city) =>
  sum + Object.values(city.districts).reduce((s, posts) => s + posts.length, 0), 0
) || 1156;

// Geographic order S→N for each city's districts (index = south to north priority)
const DISTRICT_GEO_ORDER = {
  "高雄吃痣": ["小港區","林園區","大寮區","鳳山區","前鎮區","苓雅區","新興區","鹽埕區","鼓山區","旗津區","三民區","楠梓區","仁武區","大樹區","鳥松區","左營區","岡山區","橋頭區","燕巢區","田寮區","阿蓮區","路竹區","湖內區","茄萣區","永安區","彌陀區","梓官區","旗山區","美濃區","六龜區","甲仙區","杉林區","內門區","茂林區","桃源區","那瑪夏區"],
  "台中吃痣": ["大肚區","龍井區","烏日區","南屯區","西區","中區","東區","北區","西屯區","北屯區","大里區","太平區","霧峰區","南區","大甲區","外埔區","大安區","清水區","沙鹿區","梧棲區","神岡區","豐原區","潭子區","大雅區","后里區","石岡區","東勢區","新社區","和平區"],
  "台南吃痣": ["南區","北門區","學甲區","鹽水區","新營區","後壁區","白河區","東山區","麻豆區","下營區","六甲區","官田區","大內區","佳里區","七股區","善化區","安定區","新市區","山上區","玉井區","楠西區","南化區","左鎮區","仁德區","歸仁區","關廟區","龍崎區","永康區","安南區","安平區","中西區","東區","南區","北區","西港區","將軍區","頭份區"],
  "台北吃痣": ["文山區","大安區","信義區","中正區","萬華區","中山區","松山區","內湖區","南港區","士林區","北投區","大同區"],
  "韓國吃痣": ["釜山","濟州島","光州","大邱","仁川","首爾"],
  "日本吃痣": ["沖繩","福岡","廣島","大阪","京都","名古屋","東京","北海道","札幌"],
};

// Sort districts by geo order S→N, fallback to original order
function sortDistrictsStoN(cityName, districtKeys) {
  const order = DISTRICT_GEO_ORDER[cityName];
  if (!order) return districtKeys;
  return [...districtKeys].sort((a, b) => {
    const ai = order.indexOf(a);
    const bi = order.indexOf(b);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

function AnimatedNumber({ target, duration = 1200 }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let s = 0; const step = target / (duration / 16);
    const id = setInterval(() => { s += step; if (s >= target) { setVal(target); clearInterval(id); } else setVal(Math.floor(s)); }, 16);
    return () => clearInterval(id);
  }, [target]);
  return <span>{val.toLocaleString()}</span>;
}

// Addresses that shouldn't get a map link (delivery / online only)
const NO_MAP_KEYWORDS = ["宅配全台", "產地直送", "線上訂購", "線上通路", "限量發售", "全年供應", "季節限定"];

function getMapsUrl(name, address) {
  if (!address) return null;
  if (NO_MAP_KEYWORDS.some(k => address.includes(k))) return null;
  const query = encodeURIComponent(`${name} ${address}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

function PostModal({ post, onClose }) {
  if (!post) return null;
  const mapsUrl = getMapsUrl(post.name, post.address);
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backdropFilter: "blur(4px)", animation: "fadeIn 0.2s ease" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, maxWidth: 480, width: "100%", maxHeight: "85vh", overflow: "auto", animation: "slideUp 0.3s ease" }}>
        <div style={{ position: "relative" }}>
          {/* Gradient placeholder header */}
          {(() => {
            const [g1, g2] = getGradient(post.name || post.id);
            return (
              <div style={{
                width: "100%", aspectRatio: "4/5",
                background: `linear-gradient(145deg, ${g1}, ${g2})`,
                borderRadius: "16px 16px 0 0",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <div style={{ textAlign: "center", padding: 20 }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📍</div>
                  <div style={{ color: "#fff", fontSize: 16, fontWeight: 500, textShadow: "0 1px 3px rgba(0,0,0,0.2)", lineHeight: 1.4 }}>{post.name}</div>
                  {post.cuisine && <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 8, background: "rgba(0,0,0,0.15)", padding: "3px 12px", borderRadius: 20, display: "inline-block" }}>{post.cuisine}</div>}
                </div>
              </div>
            );
          })()}
          <button onClick={onClose} style={{ position: "absolute", top: 12, right: 12, width: 34, height: 34, borderRadius: "50%", background: "rgba(0,0,0,0.3)", border: "none", color: "#fff", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}>✕</button>
          <div style={{ position: "absolute", bottom: 12, left: 12, display: "flex", gap: 6 }}>
            <span style={{ background: "rgba(0,0,0,0.3)", color: "#fff", fontSize: 11, padding: "4px 10px", borderRadius: 20 }}>{post.date}</span>
          </div>
        </div>
        <div style={{ padding: "18px 20px 22px" }}>
          <h2 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 500 }}>{post.name}</h2>

          {/* Address row with optional map link */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <p style={{ margin: 0, fontSize: 13, color: "#888", flex: 1 }}>📍 {post.address}</p>
            {mapsUrl && (
              <a href={mapsUrl} target="_blank" rel="noopener"
                onClick={e => e.stopPropagation()}
                style={{
                  flexShrink: 0,
                  display: "flex", alignItems: "center", gap: 5,
                  background: "#f0f7ff", color: "#1a73e8",
                  textDecoration: "none", padding: "5px 11px",
                  borderRadius: 20, fontSize: 12, fontWeight: 500,
                  border: "1px solid #d0e8ff",
                  whiteSpace: "nowrap"
                }}>
                <span style={{ fontSize: 14 }}>🗺️</span> Google Maps
              </a>
            )}
          </div>

          {post.hours && <p style={{ margin: "0 0 12px", fontSize: 12, color: "#aaa" }}>🕐 {post.hours}</p>}
          <p style={{ margin: "0 0 14px", fontSize: 14, color: "#444", lineHeight: 1.7 }}>{post.caption}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
            {post.items.map((it, i) => <span key={i} style={{ background: "#f8f4f0", color: "#8B6914", fontSize: 12, padding: "5px 12px", borderRadius: 20, fontWeight: 400 }}>{it}</span>)}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
            {post.tags.map((t, i) => <span key={i} style={{ color: "#3897f0", fontSize: 12, fontWeight: 400 }}>{t}</span>)}
          </div>
          <a href={post.igLink} target="_blank" rel="noopener" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "linear-gradient(135deg, #833AB4, #E1306C, #F77737)", color: "#fff", textDecoration: "none", padding: "12px 0", borderRadius: 12, fontSize: 14, fontWeight: 500 }}>📸 前往 Instagram 看完整貼文</a>

          {/* Bottom close button for easy thumb reach on mobile */}
          <button onClick={onClose} style={{ width: "100%", marginTop: 10, padding: "11px 0", borderRadius: 12, border: "1px solid #eee", background: "#fafafa", color: "#aaa", fontSize: 13, fontWeight: 400, cursor: "pointer", fontFamily: "'Noto Sans TC'" }}>關閉</button>
        </div>
      </div>
    </div>
  );
}

// Gradient palettes for placeholder cards
const GRADIENTS = [
  ["#f8b4a0", "#e85d3a"], ["#a8d8b0", "#4a9b7f"], ["#b8b0e8", "#6b5ce7"],
  ["#f8d4a0", "#d4a259"], ["#a0c8d8", "#2e86ab"], ["#e8a0b0", "#c23b22"],
  ["#c8d8a0", "#7a9e50"], ["#d8c0a8", "#8b6914"], ["#a8c0e8", "#4a6fa5"],
  ["#e8c0d8", "#a05080"],
];

function getGradient(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

function GridCell({ post, onClick, index }) {
  const [hover, setHover] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [g1, g2] = getGradient(post.name || post.id);
  const showGradient = !post.imageUrl || imgError;

  return (
    <div onClick={() => onClick(post)} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        position: "relative", paddingBottom: "125%", cursor: "pointer", overflow: "hidden",
        background: `linear-gradient(145deg, ${g1}, ${g2})`,
        animation: `fadeIn 0.35s ease ${Math.min(index * 0.03, 0.4)}s both`,
        transition: "transform 0.2s",
        transform: hover ? "scale(1.02)" : "scale(1)"
      }}>

      {/* Real IG image - try to load, fallback to gradient */}
      {post.imageUrl && !imgError && (
        <img src={post.imageUrl} alt={post.name} loading="lazy"
          onError={() => setImgError(true)}
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover", transition: "opacity 0.4s"
          }} />
      )}

      {/* Content overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: showGradient ? "none" : "linear-gradient(transparent 45%, rgba(0,0,0,0.65) 100%)",
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        padding: "10px 8px"
      }}>
        {post.cuisine && (
          <div style={{
            alignSelf: "flex-start",
            background: "rgba(0,0,0,0.28)", color: "#fff",
            fontSize: 9, padding: "2px 7px", borderRadius: 10, fontWeight: 400
          }}>{post.cuisine}</div>
        )}
        <div style={{ flex: 1 }} />
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 3,
          background: "rgba(255,255,255,0.18)",
          backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.28)",
          borderRadius: 20, padding: "3px 8px 3px 5px", maxWidth: "100%"
        }}>
          <span style={{ fontSize: 9, flexShrink: 0 }}>📍</span>
          <span style={{
            color: "#fff", fontSize: 10, fontWeight: 500,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            textShadow: "0 1px 3px rgba(0,0,0,0.4)"
          }}>{post.name}</span>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("home");
  const [selectedCity, setSelectedCity] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalPost, setModalPost] = useState(null);
  const [activeFilter, setActiveFilter] = useState("全部");
  const [filterMode, setFilterMode] = useState("district"); // "district" or "cuisine"
  const [sortOrder, setSortOrder] = useState("newest"); // "newest" | "popular"

  // Disable browser scroll restoration so back nav always starts at top
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (modalPost) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [modalPost]);

  const cities = Object.keys(MOCK_DATA);
  // Auto-detect all cities from real IG data, sorted S→N for taiwan
  const TAIWAN_CITY_ORDER = ["高雄吃痣","台南吃痣","嘉義吃痣","台中吃痣","彰化吃痣","雲林吃痣","南投吃痣","苗栗吃痣","新竹吃痣","桃園吃痣","新北吃痣","台北吃痣","基隆吃痣","宜蘭吃痣","花蓮吃痣","台東吃痣","屏東吃痣","澎湖吃痣","金門吃痣"];
  const taiwanCities = cities
    .filter(c => MOCK_DATA[c].category === "taiwan")
    .sort((a, b) => {
      const ai = TAIWAN_CITY_ORDER.indexOf(a);
      const bi = TAIWAN_CITY_ORDER.indexOf(b);
      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  const overseasCities = cities.filter(c => MOCK_DATA[c].category === "overseas");
  const deliveryCities = cities.filter(c => MOCK_DATA[c].category === "delivery");

  const allPosts = [];
  Object.entries(MOCK_DATA).forEach(([city, data]) => {
    Object.entries(data.districts).forEach(([district, posts]) => {
      posts.forEach(p => allPosts.push({ ...p, city, district }));
    });
  });

  const filteredSearch = searchQuery.trim()
    ? allPosts.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
        p.caption.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.items.some(it => it.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.cuisine && p.cuisine.toLowerCase().includes(searchQuery.toLowerCase()))
      ) : [];

  const nav = (v, city = null) => {
    setView(v); setSelectedCity(city); setActiveFilter("全部"); setFilterMode("district"); setSortOrder("newest");
    // More reliable scroll-to-top for iOS
    setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 0);
  };

  // Get all posts for current city
  const getAllCityPosts = () => {
    if (!selectedCity) return [];
    return Object.values(MOCK_DATA[selectedCity].districts).flat();
  };

  // Get unique cuisines for current city
  const getCityCuisines = () => {
    const posts = getAllCityPosts();
    const cuisines = [...new Set(posts.map(p => p.cuisine).filter(Boolean))];
    return cuisines.sort();
  };

  // Sort helper
  const applySorted = (posts) => {
    if (sortOrder === "popular") {
      return [...posts].sort((a, b) => (b.likes || 0) - (a.likes || 0));
    }
    // newest: sort by date desc
    return [...posts].sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  // Filter posts based on mode and active filter
  const getFilteredPosts = () => {
    const all = getAllCityPosts();
    let filtered;
    if (activeFilter === "全部") filtered = all;
    else if (filterMode === "district") filtered = MOCK_DATA[selectedCity].districts[activeFilter] || [];
    else filtered = all.filter(p => p.cuisine === activeFilter);
    return applySorted(filtered);
  };

  const cityColor = selectedCity ? MOCK_DATA[selectedCity]?.color : "#E85D3A";

  const CityCard = ({ city, idx }) => {
    const d = MOCK_DATA[city];
    const pc = Object.values(d.districts).flat().length;
    const dc = Object.keys(d.districts).length;
    return (
      <div onClick={() => nav("city", city)}
        style={{ background: "#fff", borderRadius: 12, padding: "14px 16px", cursor: "pointer", transition: "all 0.25s", boxShadow: "0 1px 6px rgba(0,0,0,0.03)", border: "1px solid #f0f0f0", position: "relative", overflow: "hidden", animation: `fadeIn 0.4s ease ${idx * 0.06}s both` }}
        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 8px 20px ${d.color}15`; }}
        onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 1px 6px rgba(0,0,0,0.03)"; }}
      >
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: d.color }} />
        <div style={{ fontSize: 15, fontWeight: 500, color: "#1a1a1a", marginBottom: 3 }}>{city}</div>
        <div style={{ fontSize: 11, color: "#ccc", fontFamily: "'DM Sans'", fontWeight: 400 }}>{dc} 分類 · {pc} 篇</div>
      </div>
    );
  };

  const SectionDivider = ({ icon, label, sublabel }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "28px 0 12px" }}>
      <div style={{ fontSize: 14, fontWeight: 500, color: "#1a1a1a", letterSpacing: 0.5 }}>{icon} {label}</div>
      <div style={{ flex: 1, height: 1, background: "#eee" }} />
      <div style={{ fontSize: 10, color: "#ccc", fontFamily: "'DM Sans'", fontWeight: 400, letterSpacing: 2 }}>{sublabel}</div>
    </div>
  );

  // Build filter options based on mode
  const getFilterOptions = () => {
    if (!selectedCity) return [];
    if (filterMode === "district") {
      const keys = Object.keys(MOCK_DATA[selectedCity].districts);
      return sortDistrictsStoN(selectedCity, keys);
    }
    return getCityCuisines();
  };

  const getFilterLabel = (key) => {
    if (key === "全部") return "全部";
    if (filterMode === "cuisine") return key;
    const cat = MOCK_DATA[selectedCity]?.category;
    if (cat === "delivery" || cat === "overseas") return key;
    return `吃痣在${key}`;
  };

  const getFilterCount = (key) => {
    if (key === "全部") return getAllCityPosts().length;
    if (filterMode === "district") return (MOCK_DATA[selectedCity].districts[key] || []).length;
    return getAllCityPosts().filter(p => p.cuisine === key).length;
  };

  // Dynamic SEO
  const getSeoTitle = () => {
    if (view === "city" && selectedCity) return `${selectedCity} 美食食記 | 愛吃痣 KCZ Food`;
    return "愛吃痣 | 高雄台南台中台北美食食記導覽 by kcz_food";
  };
  const getSeoDesc = () => {
    if (view === "city" && selectedCity) {
      const count = getAllCityPosts().length;
      return `愛吃痣 kcz_food 精選 ${selectedCity} ${count} 篇美食食記，依區域與類別分類，附地址、營業時間與 Google Maps 導航。`;
    }
    return `Kc 跟詹哥的愛吃痣！收錄 ${TOTAL_POSTS} 篇全台及海外美食食記，高雄、台南、台中、台北、韓國、日本，依區域與類別分類瀏覽。`;
  };
  const structuredData = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "愛吃痣 KCZ Food Directory",
    "description": getSeoDesc(),
    "author": { "@type": "Person", "name": "kcz_food", "sameAs": "https://www.instagram.com/kcz_food/" },
    "potentialAction": { "@type": "SearchAction", "target": "https://kcz-food.vercel.app/?q={search_term_string}", "query-input": "required name=search_term_string" }
  });

  return (
    <div style={{ minHeight: "100vh", background: "#FAFAFA", fontFamily: "'Noto Sans TC', 'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;700;900&family=DM+Sans:ital,wght@0,400;0,500;0,700;1,400&display=swap" rel="stylesheet" />
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />

      {/* SEO Meta Tags */}
      <title>{getSeoTitle()}</title>
      <meta name="description" content={getSeoDesc()} />
      <meta name="keywords" content="愛吃痣,高雄美食,kcz_food,高雄吃痣,台南美食,台中美食,台北美食,食記,韓國美食,日本美食,高雄餐廳推薦" />
      <meta name="robots" content="index, follow" />
      <meta name="author" content="kcz_food" />

      {/* Open Graph (FB / LINE 分享預覽) */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={getSeoTitle()} />
      <meta property="og:description" content={getSeoDesc()} />
      <meta property="og:site_name" content="愛吃痣 KCZ Food Directory" />
      <meta property="og:locale" content="zh_TW" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={getSeoTitle()} />
      <meta name="twitter:description" content={getSeoDesc()} />

      {/* JSON-LD Structured Data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredData }} />

      {/* Header */}
      <header style={{ background: "#fff", borderBottom: "1px solid #eee", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer", flexShrink: 0 }} onClick={() => { nav("home"); setSearchQuery(""); }}>
            <img src="data:image/png;base64,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" alt="愛吃痣 logo" style={{ width: 38, height: 38, objectFit: "contain", borderRadius: "50%", background: "#fff9f9", padding: 2 }} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a", lineHeight: 1.1 }}>愛吃痣</div>
              <div style={{ fontSize: 8, color: "#ccc", fontFamily: "'DM Sans'", fontWeight: 400, letterSpacing: 1.5 }}>KCZ FOOD DIRECTORY</div>
            </div>
          </div>
          <div style={{ position: "relative", flex: 1, maxWidth: 360 }}>
            <input type="text" placeholder="搜尋餐廳、地址、類別..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              style={{ width: "100%", padding: "8px 14px 8px 34px", borderRadius: 10, border: "1px solid #eee", background: "#f5f5f5", fontSize: 16, outline: "none", boxSizing: "border-box", fontFamily: "'Noto Sans TC'", transition: "border-color 0.2s" }}
              onFocus={e => e.target.style.borderColor = "#ccc"} onBlur={e => e.target.style.borderColor = "#eee"} />
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#ccc" }}>🔍</span>
          </div>
          <a href="https://www.instagram.com/kcz_food/" target="_blank" rel="noopener"
            style={{ color: "#aaa", textDecoration: "none", fontSize: 12, fontFamily: "'DM Sans'", fontWeight: 400, display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
            <span style={{ fontSize: 15 }}>📸</span><span className="ig-handle">@kcz_food</span>
          </a>
        </div>
      </header>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 16px" }}>

        {/* SEARCH */}
        {searchQuery.trim() ? (
          <div style={{ paddingTop: 20, paddingBottom: 40 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <p style={{ margin: 0, fontSize: 14, color: "#999" }}>搜尋「<strong style={{ color: "#333" }}>{searchQuery}</strong>」找到 {filteredSearch.length} 筆</p>
              <button onClick={() => { setSearchQuery(""); setTimeout(() => { window.scrollTo(0,0); document.documentElement.scrollTop = 0; }, 0); }} style={{ background: "none", border: "1px solid #e0e0e0", borderRadius: 8, padding: "4px 12px", cursor: "pointer", fontSize: 12, color: "#999" }}>清除</button>
            </div>
            {filteredSearch.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
                {filteredSearch.map((post, i) => (
                  <div key={post.id} style={{ position: "relative" }}>
                    <GridCell post={post} onClick={setModalPost} index={i} />
                    <div style={{ position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,0.55)", color: "#fff", fontSize: 8, padding: "2px 6px", borderRadius: 8, fontWeight: 400, maxWidth: "60%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {post.city.replace("吃痣","")} {post.district}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#ccc" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
                <div style={{ fontSize: 14 }}>找不到相關結果</div>
              </div>
            )}
          </div>

        ) : view === "home" ? (
          /* HOME */
          <div style={{ paddingBottom: 50 }}>
            <div style={{ textAlign: "center", padding: "36px 16px 24px" }}>
              <img src="data:image/png;base64,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" alt="愛吃痣" style={{ width: 90, height: 90, objectFit: "contain", marginBottom: 10, display: "block", margin: "0 auto 10px" }} />
              <div style={{ fontSize: 10, color: "#B8860B", fontFamily: "'DM Sans'", fontWeight: 400, letterSpacing: 3, marginBottom: 10, textTransform: "uppercase" }}>Kc 跟詹哥的愛吃痣</div>
              <h1 style={{ fontSize: "clamp(26px, 7vw, 42px)", fontWeight: 600, color: "#1a1a1a", margin: "0 0 8px", lineHeight: 1.2 }}>
                欸今天吃<span style={{ background: "linear-gradient(135deg, #E85D3A, #D4A259)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>__</span>？
              </h1>
              <p style={{ fontSize: 13, color: "#aaa", margin: "0 auto 18px", lineHeight: 1.8, maxWidth: 360 }}>
                愛吃痣｜高雄美食小小食記 📍<br/>
                KC 與詹哥的日常覓食帳號，喜歡到處吃、到處拍，<br/>
                把吃過的店留下小小痕跡。<br/>
                不是專業食評人，只是單純愛分享好吃與生活感，<br/>
                偶爾踩雷、偶爾驚喜，慢慢記錄我們的美食日記 ✨
              </p>
              <div style={{ display: "inline-flex", gap: 24, background: "#fff", padding: "12px 28px", borderRadius: 12, boxShadow: "0 1px 8px rgba(0,0,0,0.03)", border: "1px solid #f0f0f0" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 600, color: "#E85D3A", fontFamily: "'DM Sans'" }}><AnimatedNumber target={TOTAL_POSTS} /></div>
                  <div style={{ fontSize: 10, color: "#ccc", fontWeight: 400 }}>篇食記</div>
                </div>
                <div style={{ width: 1, background: "#f0f0f0" }} />
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 600, color: "#4A9B7F", fontFamily: "'DM Sans'" }}><AnimatedNumber target={cities.length} /></div>
                  <div style={{ fontSize: 10, color: "#ccc", fontWeight: 400 }}>個分類</div>
                </div>
              </div>
            </div>

            {/* Compact contact button */}
            <a href="https://ig.me/m/kcz_food" target="_blank" rel="noopener"
              style={{
                display: "flex", alignItems: "center", gap: 8,
                margin: "14px auto 0", padding: "9px 18px",
                borderRadius: 30, width: "fit-content",
                background: "linear-gradient(135deg, #833AB4, #E1306C, #F77737)",
                textDecoration: "none",
                boxShadow: "0 3px 12px rgba(225,48,108,0.22)"
              }}>
              <span style={{ fontSize: 14 }}>💬</span>
              <span style={{ color: "#fff", fontSize: 12, fontWeight: 500, fontFamily: "'Noto Sans TC'" }}>合作邀約 / 聯絡我</span>
              <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>→</span>
            </a>

            <SectionDivider icon="🇹🇼" label="台灣美食" sublabel="TAIWAN" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))", gap: 10 }}>
              {taiwanCities.map((c, i) => <CityCard key={c} city={c} idx={i} />)}
            </div>

            <SectionDivider icon="✈️" label="海外美食" sublabel="OVERSEAS" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))", gap: 10 }}>
              {overseasCities.map((c, i) => <CityCard key={c} city={c} idx={i} />)}
            </div>

            <SectionDivider icon="📦" label="宅配美食" sublabel="DELIVERY" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))", gap: 10 }}>
              {deliveryCities.map((c, i) => <CityCard key={c} city={c} idx={i} />)}
            </div>

          </div>

        ) : view === "city" && selectedCity ? (
          /* CITY VIEW */
          <div style={{ paddingTop: 14, paddingBottom: 50 }}>
            {/* Breadcrumb */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14, fontSize: 12, color: "#ccc" }}>
              <span style={{ cursor: "pointer", color: "#B8860B" }} onClick={() => nav("home")}>首頁</span>
              <span>›</span>
              <span style={{ color: "#666", fontWeight: 400 }}>{selectedCity}</span>
            </div>

            {/* Title */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <button onClick={() => nav("home")} style={{ background: "#fff", border: "1px solid #eee", borderRadius: 10, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 15 }}>←</button>
              <div>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: "#1a1a1a" }}>{selectedCity}</h1>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "#bbb" }}>
                  {Object.keys(MOCK_DATA[selectedCity].districts).length} 個{MOCK_DATA[selectedCity].category === "taiwan" ? "區域" : "分類"} · {getAllCityPosts().length} 篇食記
                </p>
              </div>
            </div>

            {/* Mode toggle: 依區域 / 依類別 */}
            <div style={{ display: "flex", gap: 0, marginBottom: 12, background: "#f0f0f0", borderRadius: 10, padding: 3, width: "fit-content" }}>
              {[
                { key: "district", label: "📍 依區域" },
                { key: "cuisine", label: "🍴 依類別" },
              ].map(m => (
                <button key={m.key} onClick={() => {
                  setFilterMode(m.key);
                  setActiveFilter("全部");
                  setTimeout(() => {
                    window.scrollTo(0, 0);
                    document.documentElement.scrollTop = 0;
                    document.body.scrollTop = 0;
                  }, 0);
                }}
                  style={{
                    padding: "7px 16px", borderRadius: 8, border: "none",
                    background: filterMode === m.key ? "#fff" : "transparent",
                    color: filterMode === m.key ? "#1a1a1a" : "#999",
                    fontSize: 13, fontWeight: 400, cursor: "pointer",
                    fontFamily: "'Noto Sans TC'", transition: "all 0.2s",
                    boxShadow: filterMode === m.key ? "0 1px 4px rgba(0,0,0,0.08)" : "none"
                  }}>
                  {m.label}
                </button>
              ))}
            </div>

            {/* Filter tags */}
            <div style={{ display: "flex", alignItems: "center", gap: 7, overflowX: "auto", paddingBottom: 10, marginBottom: 12, WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}>
              {filterMode === "district" && (
                <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 3, color: "#bbb", fontSize: 10, fontFamily: "'DM Sans'", fontWeight: 400, letterSpacing: 0.5, paddingRight: 2 }}>
                  <span>南</span>
                  <span style={{ fontSize: 8 }}>▶</span>
                  <span>北</span>
                </div>
              )}
              {["全部", ...getFilterOptions()].map(key => {
                const isActive = activeFilter === key;
                return (
                  <button key={key} onClick={() => {
                    setActiveFilter(key);
                    setTimeout(() => {
                      window.scrollTo(0, 0);
                      document.documentElement.scrollTop = 0;
                      document.body.scrollTop = 0;
                    }, 0);
                  }}
                    style={{
                      flexShrink: 0, padding: "7px 14px", borderRadius: 20,
                      border: isActive ? "none" : "1px solid #e0e0e0",
                      background: isActive ? cityColor : "#fff",
                      color: isActive ? "#fff" : "#777",
                      fontSize: 12, fontWeight: 400, cursor: "pointer",
                      fontFamily: "'Noto Sans TC'", transition: "all 0.2s",
                      boxShadow: isActive ? `0 2px 10px ${cityColor}35` : "none"
                    }}>
                    {getFilterLabel(key)}
                    <span style={{ marginLeft: 4, fontSize: 10, opacity: isActive ? 0.85 : 0.5 }}>{getFilterCount(key)}</span>
                  </button>
                );
              })}
            </div>

            {/* Sort order toggle */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", marginBottom: 8, gap: 6 }}>
              <span style={{ fontSize: 11, color: "#bbb", marginRight: 2 }}>排序</span>
              {[
                { key: "newest", label: "🕐 最新" },
                { key: "popular", label: "🔥 熱門" },
              ].map(s => (
                <button key={s.key} onClick={() => setSortOrder(s.key)}
                  style={{
                    padding: "5px 12px", borderRadius: 20, border: "none",
                    background: sortOrder === s.key ? cityColor : "#f0f0f0",
                    color: sortOrder === s.key ? "#fff" : "#888",
                    fontSize: 11, fontWeight: 400, cursor: "pointer",
                    fontFamily: "'Noto Sans TC'", transition: "all 0.2s",
                    boxShadow: sortOrder === s.key ? `0 2px 8px ${cityColor}30` : "none"
                  }}>
                  {s.label}
                </button>
              ))}
            </div>

            {/* IG Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2, borderRadius: 4, overflow: "hidden" }}>
              {getFilteredPosts().map((post, i) => <GridCell key={post.id} post={post} onClick={setModalPost} index={i} />)}
            </div>
            {getFilteredPosts().length === 0 && (
              <div style={{ textAlign: "center", padding: "50px 0", color: "#ccc", fontSize: 14 }}>此分類暫無食記</div>
            )}
          </div>
        ) : null}
      </div>

      <footer style={{ background: "#fff", borderTop: "1px solid #f0f0f0", padding: "18px 16px", textAlign: "center", marginTop: 20 }}>
        <button onClick={() => { window.scrollTo(0,0); document.documentElement.scrollTop = 0; }}
          style={{ background: "#f5f5f5", border: "none", borderRadius: 20, padding: "6px 16px", cursor: "pointer", fontSize: 11, color: "#bbb", marginBottom: 8, fontFamily: "'Noto Sans TC'" }}>
          ↑ 回到頂部
        </button>
        <div style={{ color: "#ccc", fontSize: 11, fontFamily: "'DM Sans'" }}>
          © 2025 愛吃痣 KCZ Food Directory · <a href="https://www.instagram.com/kcz_food/" target="_blank" rel="noopener" style={{ color: "#aaa", textDecoration: "none" }}>@kcz_food</a>
        </div>
      </footer>

      <PostModal post={modalPost} onClose={() => setModalPost(null)} />

      <style>{`
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes slideUp { from { opacity:0; transform:translateY(30px) } to { opacity:1; transform:translateY(0) } }
        @keyframes shimmer { 0% { background-position: -200% 0 } 100% { background-position: 200% 0 } }
        * { box-sizing: border-box; }
        html { scroll-behavior: auto !important; }
        body { margin: 0; overscroll-behavior: none; }
        input { font-size: 16px !important; }
        input::placeholder { color: #bbb; }
        div::-webkit-scrollbar { display: none; }
        @media (max-width: 500px) { .ig-handle { display: none !important; } }
      `}</style>
    </div>
  );
}
