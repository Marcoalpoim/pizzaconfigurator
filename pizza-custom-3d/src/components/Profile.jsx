import React, { useEffect, useState, useRef } from "react";
import { logout } from "../firebase";
import ReactDOM from "react-dom/client";
import { ReceiptContent } from "./PizzaBuilder/Pizzareceipt";

// ── Horizontal scroll hook ────────────────────────────────────────────────────

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

// ── Tags row (same as Feed.jsx) ───────────────────────────────────────────────

function TagsRow({ grouped }) {
  const tagsRef = useHorizontalScroll();
  return (
    <div className="profile-card-tags" ref={tagsRef}>
      {grouped &&
        Object.entries(grouped).map(([name, info], idx) => (
          <span key={idx} className="tag">
            {name} ×{info.count}
          </span>
        ))}
    </div>
  );
}

// ── Receipt download (same logic as Feed.jsx) ─────────────────────────────────

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
    id, name: TOPPING_NAMES[id] ?? id, count,
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
    console.error("O Download da Receita falhou:", e);
    //alert("Make sure html2canvas is installed: npm install html2canvas");
  } finally {
    root.unmount();
    document.body.removeChild(container);
  }
}

// ── Recipe card (mirrors profile-card style) ─────────────────────────────────────

function RecipeCard({ r, onAction, actionIcon }) {
  const grouped = r.toppings?.reduce((acc, t) => {
    const key = t.name || "Unknown";
    if (!acc[key]) acc[key] = { count: 0, color: t.color };
    acc[key].count++;
    return acc;
  }, {});

  return (
    <div className="profile-card">
      <img
        src={r.image || "/placeholder-pizza.png"}
        alt="Pizza"
        loading="lazy"
      />

      <div className="profile-card-info">
        <div className="profile-card-autor">{r.author || r.name || "Sem nome"}</div>
        <div className="profile-card-pizzainfo">
          {r.baseType} — {r.baseSize} cm
        </div>
        <TagsRow grouped={grouped} />
      </div>

    
      <div className="profile-card-btns" style={{ top: 10 }}>
        <button onClick={() => downloadRecipeAsReceipt(r)}>
          <img src="/icons/Receita.svg" alt="receita" />
        </button>
        {onAction && (
          <button onClick={() => onAction(r.id)}>
            {actionIcon || "🗑️"}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Profile({
  user,
  feed,
  bookmarks,
  onToggleBookmark,
  onDeletePublished,
  onDeleteBookmark,
}) {
  const [localRecipes, setLocalRecipes] = useState([]);
  const [activeTab, setActiveTab] = useState("criadas");

  const totalBookmarks = feed.reduce((acc, recipe) => {
    if (recipe.userId === user?.uid) return acc + (recipe.bookmarkCount || 0);
    return acc;
  }, 0);

  useEffect(() => {
    const loadRecipes = () => {
      const stored = JSON.parse(localStorage.getItem("userRecipes") || "[]");
      const mine = stored.filter((r) => r.userId === (user?.uid || user?.id));
      setLocalRecipes(mine);
    };
    loadRecipes();
    window.addEventListener("storage", loadRecipes);
    return () => window.removeEventListener("storage", loadRecipes);
  }, [user]);

  const handleLogout = async () => {
    try { await logout(); } catch (err) { console.error("Erro noLogout:", err); }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: "O meu perfil", text: "vem ver o meu perfil!", url });
    } else {
      navigator.clipboard.writeText(url);
      alert("Link do perfil copiado!");
    }
  };

  const handleDeleteRecipe = (id) => {
    const stored = JSON.parse(localStorage.getItem("userRecipes") || "[]");
    const updated = stored.filter((r) => r.id !== id);
    localStorage.setItem("userRecipes", JSON.stringify(updated));
    setLocalRecipes(updated.filter((r) => r.userId === (user?.uid || user?.id)));
  };

  const userRecipes      = feed.filter((p) => p.userId === user?.uid);
  const bookmarkedRecipes = feed.filter((item) => bookmarks.includes(item.id));

  const activeList =
    activeTab === "criadas"    ? localRecipes :
    activeTab === "published"  ? userRecipes  :
    bookmarkedRecipes;

  const getAction = (tab) => {
    if (tab === "criadas")   return handleDeleteRecipe;
    if (tab === "publicadas") return onDeletePublished;
    if (tab === "guardadas") return onToggleBookmark;
    return null;
  };

  return (
    <section
      className="profile-panel" >
      {/* PROFILE HEADER */}
      <div  className="profile-main" >
        <div className="profile-stats" >
          <img  className="profile-avatar"
            src={user?.photoURL || "/default-avatar.png"}  alt="Profile" />
          <div>
            <div style={{ fontSize: 18, fontWeight: "bold" }}>
              {user?.displayName || "User"}
            </div>
            <div style={{ fontSize: 13, color: "#aaa" }}>
              {localRecipes.length} Criadas · {userRecipes.length} Publicadas ·{" "}
              {bookmarkedRecipes.length} Guardadas
            </div>
          </div>
        </div>
        <div  className="profile-btns" >
          <button className="profile-handles" onClick={handleShare}><img src="/icons/Share.svg" alt="share" />Partilhar</button>
          <button className="profile-handles" onClick={handleLogout}><img src="/icons/logout.svg" alt="logout" />Logout</button>
        </div>
      </div>

      {/* TABS */}
      <div className="profile-tabs"  >
        {[
          { key: "criadas",    label: "Criadas" },
          { key: "publicadas",  label: "Publicadas" },
          { key: "guardadas", label: "Guardadas" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1, padding: "8px 12px", borderRadius: 999,
              border: "none", cursor: "pointer",
              background: activeTab === tab.key ? "#fff" : "transparent",
              color:      activeTab === tab.key ? "#000" : "#aaa",
              fontWeight: 500,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* CARDS GRID */}
      {activeList.length === 0 ? (
        <p>Nenhuma receita disponível.</p>
      ) : (
        <div className="profile-grid">
          {activeList.map((r) => (
            <RecipeCard
              key={r.id}
              r={r}
              onAction={getAction(activeTab)}
              actionIcon= {<img src="/icons/Trash-white.svg" alt="delete" />}
            />
          ))}
        </div>
      )}
    </section>
  );
}