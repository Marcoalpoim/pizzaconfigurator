// src/components/PizzaBuilder/CalorieCounter.jsx
import React, { useMemo } from "react";

// ── Calorie data ──────────────────────────────────────────────────────────────

const TOPPING_CALORIES = {
  pepperoni: 55,  // per slice/piece
  mushroom:   4,
  olive:      8,
  basil:      1,
  ananas:    10,
  cebola:     7,
};

const BASE_CALORIES = {
  thin:   180,
  medium: 260,
  thick:  380,
};

const SIZE_MULTIPLIER = {
  28: 0.8,
  33: 1.0,
  40: 1.35,
};

const SAUCE_CALORIES = {
  tomate:    45,
  tomato:    45,
  carbonara: 110,
  pesto:     130,
  barbecue:  90,
};

const CHEESE_CALORIES = {
  mozzarella: 170,
  cheddar:    200,
  parmesan:   160,
  gorgonzola: 190,
  none:         0,
};

// ── Reaction tiers ────────────────────────────────────────────────────────────

const REACTIONS = [
  { max: 300,  emoji: "🥗", label: "Basically a salad",     color: "#1d9e75" },
  { max: 500,  emoji: "😌", label: "Respectable",           color: "#4aab6d" },
  { max: 700,  emoji: "🍕", label: "Classic pizza energy",  color: "#ba7517" },
  { max: 900,  emoji: "😬", label: "Nutritionist left the chat", color: "#d4621a" },
  { max: 1100, emoji: "🚨", label: "Illegal in 12 countries", color: "#e24b4a" },
  { max: 1400, emoji: "💀", label: "You've exceeded Italian law", color: "#c0392b" },
  { max: Infinity, emoji: "🌋", label: "This pizza is a war crime", color: "#8e1a1a" },
];

function getReaction(cal) {
  return REACTIONS.find((r) => cal < r.max);
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CalorieCounter({
  ingredientCounts,
  baseType,
  baseSize,
  sauceType,
  cheeseType,
}) {
  const { total, breakdown } = useMemo(() => {
    const sizeM = SIZE_MULTIPLIER[baseSize] ?? 1;

    const baseC   = Math.round((BASE_CALORIES[baseType]   ?? 260) * sizeM);
    const sauceC  = Math.round((SAUCE_CALORIES[sauceType] ?? 45)  * sizeM);
    const cheeseC = Math.round((CHEESE_CALORIES[cheeseType] ?? 170) * sizeM);

    let toppingsC = 0;
    Object.entries(ingredientCounts).forEach(([id, count]) => {
      if (count > 0) toppingsC += (TOPPING_CALORIES[id] ?? 10) * count;
    });
    toppingsC = Math.round(toppingsC);

    return {
      total: baseC + sauceC + cheeseC + toppingsC,
      breakdown: { baseC, sauceC, cheeseC, toppingsC },
    };
  }, [ingredientCounts, baseType, baseSize, sauceType, cheeseType]);

  const reaction = getReaction(total);

  // Bar fills relative to the "war crime" ceiling (1400 kcal)
  const pct = Math.min((total / 1400) * 100, 100);

  return (
    <div style={{
      borderTop: "1px solid #eee",
      padding: "12px",
      marginTop: 4,
    }}>
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Est. calories
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1, color: reaction.color, transition: "color 0.4s" }}>
            {total.toLocaleString()}
            <span style={{ fontSize: 13, fontWeight: 400, color: "#aaa", marginLeft: 4 }}>kcal</span>
          </div>
        </div>
        <div style={{ fontSize: 28, lineHeight: 1, marginTop: 2 }}>{reaction.emoji}</div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 6, background: "#eee", borderRadius: 3, overflow: "hidden", marginBottom: 6 }}>
        <div style={{
          height: "100%",
          width: `${pct}%`,
          background: reaction.color,
          borderRadius: 3,
          transition: "width 0.3s ease, background 0.4s ease",
        }} />
      </div>

      {/* Reaction label */}
      <div style={{ fontSize: 12, color: reaction.color, fontWeight: 500, marginBottom: 10, transition: "color 0.4s" }}>
        {reaction.label}
      </div>

      {/* Breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3px 12px" }}>
        {[
          ["🍞 Base",    breakdown.baseC],
          ["🥣 Sauce",   breakdown.sauceC],
          ["🧀 Cheese",  breakdown.cheeseC],
          ["🍖 Toppings", breakdown.toppingsC],
        ].map(([label, cal]) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#999" }}>
            <span>{label}</span>
            <span style={{ fontWeight: 500, color: "#666" }}>{cal} kcal</span>
          </div>
        ))}
      </div>
    </div>
  );
}