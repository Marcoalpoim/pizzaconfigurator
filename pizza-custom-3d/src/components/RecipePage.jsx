import React, { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  TOPPING_CALORIES, TOPPING_PRICES,
  BASE_CALORIES, BASE_NAMES, BASE_PRICES,
  SIZE_MULTIPLIER, SIZE_NAMES, SIZE_PRICES,
  SAUCE_CALORIES, SAUCE_NAMES, SAUCE_PRICES,
  CHEESE_CALORIES, CHEESE_NAMES, CHEESE_PRICES,
  SHAPE_LABELS,
} from "../data/ingredientData";
import { downloadRecipeAsReceipt } from "../utils/downloadRecipeAsReceipt";

// ── Calorie reactions ─────────────────────────────────────────────────────────
const REACTIONS = [
  { max: 300,      label: "Basicamente uma salada",          color: "#22c55e" },
  { max: 500,      label: "Respeitável",                     color: "#86efac" },
  { max: 700,      label: "Energia clássica de pizza",       color: "#facc15" },
  { max: 900,      label: "O nutricionista saiu do chat",    color: "#fb923c" },
  { max: 1100,     label: "Ilegal em 12 países",             color: "#f87171" },
  { max: 1400,     label: "Excedeste a lei italiana",        color: "#ef4444" },
  { max: Infinity, label: "Esta pizza é um crime de guerra", color: "#991b1b" },
];
const getReaction = (cal) => REACTIONS.find((r) => cal < r.max);

// ── Calculations ──────────────────────────────────────────────────────────────
function calcRecipe(recipe) {
  const baseKey   = (recipe.baseType  || "").toLowerCase();
  const sauceKey  = (recipe.sauceType || "").toLowerCase();
  const cheeseKey = (recipe.cheeseType || "").toLowerCase();
  const sizeM     = SIZE_MULTIPLIER[recipe.baseSize] ?? 1;

  const basePrice   = BASE_PRICES[baseKey]    ?? 5.5;
  const sizePrice   = SIZE_PRICES[recipe.baseSize] ?? 0;
  const saucePrice  = SAUCE_PRICES[sauceKey]  ?? 1.0;
  const cheesePrice = CHEESE_PRICES[cheeseKey] ?? 2.0;

  const baseCal   = Math.round((BASE_CALORIES[baseKey]    ?? 260) * sizeM);
  const sauceCal  = Math.round((SAUCE_CALORIES[sauceKey]  ?? 45)  * sizeM);
  const cheeseCal = Math.round((CHEESE_CALORIES[cheeseKey] ?? 170) * sizeM);

  const counts = {};
  (recipe.toppings || []).forEach((t) => {
    if (t.id) counts[t.id] = (counts[t.id] || 0) + 1;
  });

  let toppingPrice = 0, toppingCal = 0;
  Object.entries(counts).forEach(([id, count]) => {
    toppingPrice += (TOPPING_PRICES[id] ?? 1.0) * count;
    toppingCal   += (TOPPING_CALORIES[id] ?? 10) * count;
  });

  const coperto  = 2.5;
  const subtotal = basePrice + sizePrice + saucePrice + cheesePrice + toppingPrice + coperto;
  const vat      = subtotal * 0.23;
  const total    = subtotal + vat;
  const totalCal = baseCal + sauceCal + cheeseCal + Math.round(toppingCal);

  return {
    basePrice, sizePrice, saucePrice, cheesePrice,
    toppingPrice: Math.round(toppingPrice * 100) / 100,
    subtotal, vat, total,
    baseCal, sauceCal, cheeseCal,
    toppingCal: Math.round(toppingCal), totalCal,
  };
}

// ── Small components ──────────────────────────────────────────────────────────
function Pill({ label, value, accent }) {
  return (
    <div style={{
      background: "#111", border: "1px solid #555555",
      borderRadius: 12, padding: "12px 14px",
      display: "flex", flexDirection: "column", gap: 5,
    }}>
      <span style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#939393" }}>
        {label}
      </span>
      <span style={{ fontSize: 17, fontWeight: 700, color: accent || "#e5e5e5" }}>
        {value}
      </span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginTop: 28 }}>
      <div className="section" style={{
        fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase",
        color: "#fff", marginBottom: 10,
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Card({ children }) {
  return (
    <div style={{
      background: "#111", border: "1px solid #555555",
      borderRadius: 12, padding: "14px 16px",
    }}>
      {children}
    </div>
  );
}

function Row({ label, value, bold, accent }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      fontSize: bold ? 15 : 13,
      fontWeight: bold ? 700 : 400,
      color: bold ? (accent || "#e5e5e5") : "#666",
    }}>
      <span>{label}</span>
      <span style={{ color: bold ? (accent || "#e5e5e5") : "#888" }}>{value}</span>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function RecipePage({ feed, bookmarks, onToggleBookmark }) {
  const { id }   = useParams();
  const navigate = useNavigate();

  const recipe = feed.find((r) => String(r.id) === String(id));
  const calc   = useMemo(() => recipe ? calcRecipe(recipe) : null, [recipe]);

  const reaction    = calc ? getReaction(calc.totalCal) : null;
  const calPct      = calc ? Math.min((calc.totalCal / 1400) * 100, 100) : 0;
  const isBookmarked = bookmarks.includes(recipe?.id);
  const shapeLabel  = SHAPE_LABELS[(recipe?.pizzaShape || "").toLowerCase()] ?? recipe?.pizzaShape ?? "Círculo";

  const groupedToppings = useMemo(() => {
    if (!recipe) return {};
    return (recipe.toppings || []).reduce((acc, t) => {
      const key = t.name || "Unknown";
      if (!acc[key]) acc[key] = { count: 0 };
      acc[key].count++;
      return acc;
    }, {});
  }, [recipe]);

  if (!recipe) return (
    <div style={{ color: "#939393", padding: 48, textAlign: "center", fontSize: 14 }}>
      Receita não encontrada
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}  className="pagina-receita-container">

      {/* HEADER */}
      <div className="pagina-receita-header">
        <button onClick={() => navigate(-1)} style={{
          background: "#1a1a1a", border: "none", color: "#fff",
          width: 34, height: 34, borderRadius: 9, fontSize: 15,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        }}><img src="/icons/arrowleft.svg" alt="Arrow left" /></button>
        <span style={{ fontSize: 12, color: "#fff", letterSpacing: "0.1em" }}>A RECEITA</span>
        <button
          onClick={() => downloadRecipeAsReceipt(recipe)}
          title="Download receita"
          style={{
            background: "#1a1a1a", border: "none", color: "#fff",
            width: 34, height: 34, borderRadius: 9, fontSize: 15,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}
        ><img src="/icons/Receipt-white.svg" alt="receita" /></button>
      </div>

      {/* HERO */}
      <div className="pagina-receita-hero" >
        <img
          src={recipe.image || "/placeholder-pizza.png"}
          alt="Pizza"
          style={{ width: "100%", height: 300, objectFit: "cover", display: "block" }}
        />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, transparent 40%, #0a0a0a 100%)",
        }} />
        <div style={{ position: "absolute", bottom: 16, left: 16, right: 16,
          display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{recipe.author || "Anónimo"}</div>
            <div style={{ fontSize: 11, color: "#666", marginTop: 3 }}>
              {new Date(recipe.createdAt).toLocaleDateString("pt-PT", {
                day: "2-digit", month: "long", year: "numeric",
              })}
            </div>
          </div>
          <button
            onClick={() => onToggleBookmark(recipe.id)}
            style={{
              background: isBookmarked ? "#595959" : "rgb(26, 26, 26)",
              border: "1px solid " + (isBookmarked ? "#595959" : "rgb(255 255 255 / 0%)"),
              borderRadius: 9, color: "#fff",
              padding: "7px 13px", cursor: "pointer",
              fontSize: 12, fontWeight: 600, backdropFilter: "blur(8px)",
              display: "flex", alignItems: "center",
            }}
          >
            <img src="/icons/Bookmark.svg" alt="save" style={{ width: 20, height: 20, marginRight: 5, verticalAlign: "middle" }} />
            <p className="feedbookmark">{ isBookmarked ? "Guardado" : "Guardar"}</p>
          </button>
        </div>
      </div>

      <div style={{ padding: "0 16px" }}>

        {/* QUICK STATS */}
        <Section title="Resumo">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <Pill label="Preço total aproximadamente"  value={`~€${calc.total.toFixed(2)}`}              accent="#4ade80" />
            <Pill label="Calorias"     value={`${calc.totalCal.toLocaleString()} kcal`} accent={reaction.color} />
            <Pill label="Tamanho"      value={SIZE_NAMES[recipe.baseSize] ?? `${recipe.baseSize}cm`} />
            <Pill label="Forma"        value={shapeLabel} />
          </div>
        </Section>

        {/* CALORIE BAR */}
        <Section title="Nível calórico">
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: reaction.color, fontWeight: 600 }}>{reaction.label}</span>
              <span style={{ fontSize: 11, color: "#adadad" }}>{calc.totalCal} kcal</span>
            </div>
            <div style={{ background: "#1c1c1c", borderRadius: 4, height: 5, overflow: "hidden", marginBottom: 14 }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${calPct}%` }}
                transition={{ duration: 0.9, ease: "easeOut", delay: 0.2 }}
                style={{ height: "100%", background: reaction.color, borderRadius: 4 }}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px 20px" }}>
              {[["Base", calc.baseCal], ["Molho", calc.sauceCal], ["Queijo", calc.cheeseCal], ["Toppings", calc.toppingCal]].map(([l, v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#adadad" }}>
                  <span>{l}</span><span style={{ color: "#939393" }}>{v} kcal</span>
                </div>
              ))}
            </div>
          </Card>
        </Section>

        {/* PIZZA DETAILS */}
        <Section title="Detalhes">
          <Card>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                ["Base",    BASE_NAMES[recipe.baseType]   ?? recipe.baseType],
                ["Molho",   SAUCE_NAMES[recipe.sauceType]  ?? recipe.sauceType],
                ["Queijo",  CHEESE_NAMES[recipe.cheeseType] ?? recipe.cheeseType],
                ["Forma",   shapeLabel],
                ["Tamanho", SIZE_NAMES[recipe.baseSize]   ?? `${recipe.baseSize}cm`],
              ].filter(([, v]) => v && v !== "null").map(([label, value]) => (
                <Row key={label} label={label} value={value} />
              ))}
            </div>
          </Card>
        </Section>

        {/* PRICE BREAKDOWN */}{/*
        <Section title="Preço detalhado">
          <Card>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                [BASE_NAMES[recipe.baseType]           ?? recipe.baseType,  calc.basePrice],
                [SIZE_NAMES[recipe.baseSize]            ?? `${recipe.baseSize}cm`, calc.sizePrice],
                [SAUCE_NAMES[recipe.sauceType]          ?? recipe.sauceType, calc.saucePrice],
                [CHEESE_NAMES[recipe.cheeseType]        ?? recipe.cheeseType, calc.cheesePrice],
                ["Ingredientes",                                              calc.toppingPrice],
                ["Coperto",                                                   2.5],
              ].filter(([l]) => l && l !== "null").map(([label, price]) => (
                <Row key={label} label={label} value={`€${Number(price).toFixed(2)}`} />
              ))}
              <div style={{ borderTop: "1px solid #1e1e1e", paddingTop: 10, marginTop: 2,
                display: "flex", flexDirection: "column", gap: 6 }}>
                <Row label="Subtotal" value={`€${calc.subtotal.toFixed(2)}`} />
                <Row label="IVA (23%)" value={`€${calc.vat.toFixed(2)}`} />
                <Row label="Total" value={`€${calc.total.toFixed(2)}`} bold accent="#4ade80" />
              </div>
            </div>
          </Card>8
        </Section> */}

        {/* INGREDIENTS */}
        <Section title={`Ingredientes — ${Object.keys(groupedToppings).length} tipos`}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {Object.entries(groupedToppings).map(([name, info]) => (
              <span key={name} style={{
                background: "#111", border: "1px solid #555555",
                padding: "7px 13px", borderRadius: 999,
                fontSize: 13, color: "#bbb",
              }}>
                {name}{info.count > 1 ? ` ×${info.count}` : ""}
              </span>
            ))}
          </div>
        </Section>

      </div>
    </motion.div>
  );
}