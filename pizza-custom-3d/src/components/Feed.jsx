import React, { useMemo, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ReactDOM from "react-dom/client";
import { ReceiptContent } from "./PizzaBuilder/Pizzareceipt";

// ── Receipt download helper ───────────────────────────────────────────────────

async function downloadRecipeAsReceipt(recipe) {
  const downloads = JSON.parse(localStorage.getItem("downloads") || "{}");
  downloads[recipe.id] = (downloads[recipe.id] || 0) + 1;
  localStorage.setItem("downloads", JSON.stringify(downloads));

  const BASE_PRICES = { fina: 4.5, média: 5.5, "alta e fofa": 6.5 };
  const SIZE_PRICES = { 28: 0, 33: 1.5, 40: 3.0 };
  const SAUCE_PRICES = {
    tomate: 1.0, "tomate e oregãos": 1.0, carbonara: 1.8, pesto: 2.0, barbecue: 1.5,
  };
  const CHEESE_PRICES = {
    mozzarella: 2.0, cheddar: 2.2, parmesan: 2.5, gorgonzola: 2.8, none: 0,
  };
  const TOPPING_PRICES = {
    pepperoni: 1.8, cogumelos: 1.2, azeitona: 1.0, basil: 0.8, ananas: 1.5,
    cebola: 0.9, frango: 2.0, carne: 2.5, pancetta: 1.8, bacon: 1.8,
    chourico: 1.7, fiambre: 1.4, pimento: 1.0, tomate_cherry: 1.1,
    cebola_caramelizada: 1.2, camarao: 2.8, atum: 2.2,
  };
  const TOPPING_NAMES = {
    pepperoni: "Pepperoni", cogumelos: "Cogumelos", azeitona: "Azeitona",
    basil: "Manjericão", ananas: "Ananás", cebola: "Cebola",
    frango: "Frango Marinado", carne: "Carne de Vaca", pancetta: "Pancetta",
    bacon: "Bacon", chourico: "Chouriço", fiambre: "Fiambre",
    pimento: "Pimento Verde", tomate_cherry: "Tomate Cherry",
    cebola_caramelizada: "Cebola Caramelizada", camarao: "Camarão", atum: "Atum",
  };

  const ingredientCounts = {};
  (recipe.toppings || []).forEach((t) => {
    if (t.id) ingredientCounts[t.id] = (ingredientCounts[t.id] || 0) + 1;
  });

  const baseKey   = (recipe.baseType  || "").toLowerCase();
  const sauceKey  = (recipe.sauceType || "").toLowerCase();
  const cheeseKey = (recipe.cheeseType || "").toLowerCase();

  const basePrice   = BASE_PRICES[baseKey]   ?? 5.5;
  const sizePrice   = SIZE_PRICES[recipe.baseSize] ?? 0;
  const saucePrice  = SAUCE_PRICES[sauceKey]  ?? 1.0;
  const cheesePrice = CHEESE_PRICES[cheeseKey] ?? 2.0;

  const toppingLines = Object.entries(ingredientCounts).map(([id, count]) => ({
    id,
    name:  TOPPING_NAMES[id] ?? id,
    count,
    price: (TOPPING_PRICES[id] ?? 1.0) * count,
  }));

  const coperto  = 2.5;
  const subtotal =
    basePrice + sizePrice + saucePrice + cheesePrice +
    toppingLines.reduce((s, l) => s + l.price, 0) + coperto;
  const vat   = subtotal * 0.22;
  const total = subtotal + vat;

  const SHAPE_LABELS = {
    circulo: "Círculo", quadrado: "Quadrado", triangulo: "Triângulo",
    diamante: "Diamante", oval: "Oval", estrela: "Estrela", coração: "Coração",
  };
  const shapeLabel =
    SHAPE_LABELS[(recipe.pizzaShape || "").toLowerCase()] ?? recipe.pizzaShape ?? "Círculo";

  const data = {
    orderId: `#${recipe.id.toString().slice(-4)}`,
    timestamp: new Date(recipe.createdAt || Date.now()).toLocaleString("pt-PT", {
      day: "2-digit", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    }),
    baseType: recipe.baseType, baseSize: recipe.baseSize, pizzaShape: shapeLabel,
    sauceType: recipe.sauceType, cheeseType: recipe.cheeseType,
    ingredientCounts, basePrice, sizePrice, saucePrice, cheesePrice,
    toppingLines, subtotal, vat, total,
  };

  const container = document.createElement("div");
  container.style.cssText = "position:fixed;left:-9999px;top:-9999px;z-index:-1;";
  document.body.appendChild(container);

  const root = ReactDOM.createRoot(container);
  root.render(<ReceiptContent data={data} />);
  await new Promise((r) => setTimeout(r, 100));

  try {
    const { default: html2canvas } = await import("html2canvas");
    const canvas = await html2canvas(container.firstChild, { backgroundColor: "#fffdf5", scale: 2 });
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

// ── Horizontal scroll hook — defined OUTSIDE the component ───────────────────

function useHorizontalScroll() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onWheel = (e) => {
      if (el.scrollWidth > el.clientWidth) {
        e.preventDefault();
        e.stopPropagation();
        el.scrollLeft += e.deltaY;
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);
  return ref;
}

// ── TagsRow — defined OUTSIDE the component ───────────────────────────────────

function TagsRow({ grouped, setActiveTags }) {
  const tagsRef = useHorizontalScroll();
  return (
    <div className="feed-card-tags" ref={tagsRef}>
      {grouped &&
        Object.entries(grouped).map(([name, info], idx) => (
          <span
            key={idx}
            className="tag"
            onClick={(e) => {
              e.stopPropagation();
              const tag = name.toLowerCase();
              setActiveTags((prev) =>
                prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
              );
            }}
          >
            {name} ×{info.count}
          </span>
        ))}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Feed({ feed = [], onBookmark, bookmarks }) {
  const [search, setSearch]       = useState("");
  const [activeTags, setActiveTags] = useState([]);
  const navigate = useNavigate();

  const downloadCounts = useMemo(() => {
    return JSON.parse(localStorage.getItem("downloads") || "{}");
  }, [feed]);

  const bookmarkCounts = useMemo(() => {
    const counts = {};
    bookmarks.forEach((id) => { counts[id] = (counts[id] || 0) + 1; });
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
    return Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 12);
  }, [feed]);

  const filteredFeed = useMemo(() => {
    return feed.filter((item) => {
      const text = (
        (item.author || "") + " " + (item.baseType || "") + " " +
        (item.sauceType || "") + " " + (item.toppings?.map((t) => t.name).join(" ") || "")
      ).toLowerCase();
      const matchesSearch = text.includes(search.toLowerCase());
      const matchesTag =
        activeTags.length > 0
          ? activeTags.every((tag) =>
              item.toppings?.some((t) => t.name?.toLowerCase().includes(tag))
            )
          : true;
      return matchesSearch && matchesTag;
    });
  }, [feed, search, activeTags]);

  if (!feed) return null;

  const TagList = () => {
    const tagsListRef = useHorizontalScroll();
    return (
    <>
      <h4>AS TAGS DO MOMENTO</h4>
      <div className="tags-list" ref={tagsListRef}>
        {popularTags.map(([tag]) => (
          <button
            key={tag}
            className={`tag ${activeTags.includes(tag) ? "active" : ""}`}
            onClick={() =>
              setActiveTags((prev) =>
                prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
              )
            }
          >
            {tag}
          </button>
        ))}
      </div>
    </>
    );
  };

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
                />
                <div className="feed-card-info">
                  <div className="feed-card-autor">{item.author || "Anonymous"}</div>
                  <div className="feed-card-pizzainfo">
                    {item.baseType} — {item.baseSize} cm
                  </div>
 
                  <TagsRow grouped={grouped} setActiveTags={setActiveTags} />
                </div>

                <div className="feed-card-btns">
                  <button
                    onClick={(e) => { e.stopPropagation(); onBookmark(item.id); }}
                    className={`tag ${bookmarks.includes(item.id) ? "bookmarked" : ""}`}
                  >
                    <img src="/icons/Bookmark.svg" alt="save" />{" "}
                    <span>{bookmarkCounts[item.id] || 0}</span>
                  </button>

                  <button
                    onClick={(e) => { e.stopPropagation(); downloadRecipeAsReceipt(item); }}
                  >
                    <img src="/icons/Receipt-white.svg" alt="receita" />{" "}
                    {downloadCounts[item.id] || 0}
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