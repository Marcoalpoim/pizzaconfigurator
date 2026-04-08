import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactDOM from "react-dom/client";
import { ReceiptContent } from "./PizzaBuilder/Pizzareceipt";

// ── Receipt download helper ───────────────────────────────────────────────────

async function downloadRecipeAsReceipt(recipe) {
  // Track download count
  const downloads = JSON.parse(localStorage.getItem("downloads") || "{}");
  downloads[recipe.id] = (downloads[recipe.id] || 0) + 1;
  localStorage.setItem("downloads", JSON.stringify(downloads));

  // Build the data object PizzaReceipt expects
  const TOPPING_PRICES  = { pepperoni:1.8, mushroom:1.2, olive:1.0, basil:0.8, ananas:1.5, cebola:0.9 };
  const BASE_PRICES     = { thin:4.5, medium:5.5, thick:6.5 };
  const SIZE_PRICES     = { 28:0, 33:1.5, 40:3.0 };
  const SAUCE_PRICES    = { tomate:1.0, tomato:1.0, carbonara:1.8, pesto:2.0, barbecue:1.5 };
  const CHEESE_PRICES   = { mozzarella:2.0, cheddar:2.2, parmesan:2.5, gorgonzola:2.8, none:0 };
  const TOPPING_NAMES   = { pepperoni:"Salame Piccante", mushroom:"Funghi Porcini", olive:"Olive Taggiasche", basil:"Basilico Fresco", ananas:"Ananas (con coraggio)", cebola:"Cipolla Caramellata" };

  // Rebuild ingredientCounts from the toppings array stored on the recipe
  const ingredientCounts = {};
  (recipe.toppings || []).forEach((t) => {
    if (t.id) ingredientCounts[t.id] = (ingredientCounts[t.id] || 0) + 1;
  });

  const basePrice   = BASE_PRICES[recipe.baseType]    ?? 5.5;
  const sizePrice   = SIZE_PRICES[recipe.baseSize]    ?? 0;
  const saucePrice  = SAUCE_PRICES[recipe.sauceType]  ?? 1.0;
  const cheesePrice = CHEESE_PRICES[recipe.cheeseType] ?? 2.0;

  const toppingLines = Object.entries(ingredientCounts).map(([id, count]) => ({
    id,
    name: TOPPING_NAMES[id] ?? id,
    count,
    price: (TOPPING_PRICES[id] ?? 1.0) * count,
  }));

  const coperto  = 2.5;
  const subtotal = basePrice + sizePrice + saucePrice + cheesePrice +
                   toppingLines.reduce((s, l) => s + l.price, 0) + coperto;
  const vat   = subtotal * 0.22;
  const total = subtotal + vat;

  const data = {
    orderId:   `#${recipe.id.toString().slice(-4)}`,
    timestamp: new Date(recipe.createdAt || Date.now()).toLocaleString("it-IT", {
      day: "2-digit", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    }),
    baseType:         recipe.baseType,
    baseSize:         recipe.baseSize,
    sauceType:        recipe.sauceType,
    cheeseType:       recipe.cheeseType,
    ingredientCounts,
    basePrice, sizePrice, saucePrice, cheesePrice,
    toppingLines, subtotal, vat, total,
  };

  // Mount receipt off-screen, capture with html2canvas, then remove
  const container = document.createElement("div");
  container.style.cssText = "position:fixed;left:-9999px;top:-9999px;z-index:-1;";
  document.body.appendChild(container);

  const root = ReactDOM.createRoot(container);
  root.render(<ReceiptContent data={data} />);

  // Wait one frame for React to paint
  await new Promise((r) => setTimeout(r, 100));

  try {
    const { default: html2canvas } = await import("html2canvas");
    const canvas = await html2canvas(container.firstChild, {
      backgroundColor: "#fffdf5",
      scale: 2,
    });
    const link = document.createElement("a");
    link.download = `ricevuta-${data.orderId}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  } catch (e) {
    console.error("Receipt download failed:", e);
    alert("Make sure html2canvas is installed: npm install html2canvas");
  } finally {
    root.unmount();
    document.body.removeChild(container);
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Feed({ feed = [], onBookmark, bookmarks }) {
  const [search, setSearch] = useState("");
  const [activeTags, setActiveTags] = useState([]);
  const downloadCounts = useMemo(() => {
    return JSON.parse(localStorage.getItem("downloads") || "{}");
  }, [feed]);
  const navigate = useNavigate();
  const bookmarkCounts = useMemo(() => {
    const counts = {};
    bookmarks.forEach((id) => {
      counts[id] = (counts[id] || 0) + 1;
    });
    return counts;
  }, [bookmarks]);

  const popularTags = useMemo(() => {
    const tagCounts = {};
    feed.forEach((item) => {
      item.toppings?.forEach((t) => {
        const key = t.name?.toLowerCase();
        if (!key) return;
        tagCounts[key] = (tagCounts[key] || 0) + 1;
      });
    });
    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12);
  }, [feed]);

  const filteredFeed = useMemo(() => {
    return feed.filter((item) => {
      const text = (
        (item.author || "") + " " +
        (item.baseType || "") + " " +
        (item.sauceType || "") + " " +
        (item.toppings?.map((t) => t.name).join(" ") || "")
      ).toLowerCase();
      const matchesSearch = text.includes(search.toLowerCase());
      const matchesTag =
        activeTags.length > 0
          ? activeTags.every((tag) =>
              item.toppings?.some((t) => t.name?.toLowerCase().includes(tag)),
            )
          : true;
      return matchesSearch && matchesTag;
    });
  }, [feed, search, activeTags]);

  if (!feed) return null;

  const TagList = () => (
    <>
      <h4>AS TAGS DO MOMENTO</h4>
      <div className="tags-list">
        {popularTags.map(([tag]) => (
          <button
            key={tag}
            className={`tag ${activeTags.includes(tag) ? "active" : ""}`}
            onClick={() =>
              setActiveTags((prev) =>
                prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
              )
            }
          >
            {tag}
          </button>
        ))}
      </div>
      <button style={{ marginTop: 12 }} onClick={() => { setSearch(""); setActiveTags([]); }}>
        Reset Filters
      </button>
    </>
  );

  return (
    <div className="feed-layout">
      {/* LEFT SIDE */}
      <div className="feed-main">
        <div className="feed-search">
          <input
            placeholder="🔍 Procurar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="feed-tags mobile-only">
          <TagList />
        </div>

        {/* GRID */}
        <div className="feed-grid">
          {filteredFeed.map((item) => {
            const grouped = item.toppings?.reduce((acc, t) => {
              const key = t.name || "Unknown";
              if (!acc[key]) acc[key] = { count: 0, color: t.color };
              acc[key].count++;
              return acc;
            }, {});

            return (
              <div
                key={item.id}
                className="feed-card"
                onClick={() => navigate(`/recipe/${item.id}`)}
                style={{ cursor: "pointer" }}
              >
                <img
                  src={item.image || "/placeholder-pizza.png"}
                  alt="Pizza"
                  loading="lazy"
                  style={{ width: "100%", borderRadius: 12, objectFit: "cover", height: 180, background: "#222" }}
                />

                <div style={{ marginTop: 8, fontWeight: 600 }}>
                  {item.author || "Anonymous"}
                </div>

                <div style={{ fontSize: 13, color: "#aaa" }}>
                  {item.baseType} — {item.baseSize} cm
                </div>

                <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {grouped && Object.entries(grouped).map(([name, info], idx) => (
                    <span
                      key={idx}
                      className="tag"
                      onClick={(e) => {
                        e.stopPropagation();
                        const tag = name.toLowerCase();
                        setActiveTags((prev) =>
                          prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
                        );
                      }}
                      style={{ cursor: "pointer", fontSize: 12, border: "1px solid #777", padding: "4px 8px", borderRadius: 999 }}
                    >
                      {name} ×{info.count}
                    </span>
                  ))}
                </div>

                <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  {/* ⭐ Bookmark */}
                  <div
                    onClick={(e) => { e.stopPropagation(); onBookmark(item.id); }}
                    style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", color: bookmarks.includes(item.id) ? "#ffd700" : "#fff" }}
                  >
                    ⭐ <span>{bookmarkCounts[item.id] || 0}</span>
                  </div>

                  {/* ⬇️ Download receipt */}
                  <button
                    onClick={(e) => { e.stopPropagation(); downloadRecipeAsReceipt(item); }}
                    style={{ background: "#222", border: "1px solid #444", color: "#fff", padding: "6px 10px", borderRadius: 6, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}
                  >
                    🧾 {downloadCounts[item.id] || 0}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT SIDE - TAGS */}
      <div className="feed-tags desktop-only">
        <TagList />
      </div>
    </div>
  );
}