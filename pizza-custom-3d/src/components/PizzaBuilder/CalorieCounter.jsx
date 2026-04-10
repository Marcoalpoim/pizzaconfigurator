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
  { max: 300,  label: "Basicamente uma salada",     color: "#1d9e75" },
  { max: 500,  label: "Respeitável",                color: "#4aab6d" },
  { max: 700,   label: "Energia clássica de pizza",  color: "#ba7517" },
  { max: 900,   label: "O nutricionista saiu do chat", color: "#d4621a" },
  { max: 1100, label: "Ilegal em 12 países",        color: "#e24b4a" },
  { max: 1400, label: "Excedeste a lei italiana",   color: "#c0392b" },
  { max: Infinity, label: "Esta pizza é um crime de guerra", color: "#8e1a1a" },
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
    <div className="caloriescounter" > 
      <div className="caloriesbar">
        
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 0 }}>
        <div> 
          <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1, color: reaction.color, transition: "color 0.4s" }}>
            {total.toLocaleString()}
            <span style={{ fontSize: 13, fontWeight: 400, color: "#aaa", marginLeft: 4 }}>kcal</span>
          </div>
        </div>
         {/* <div style={{ fontSize: 28, lineHeight: 1, marginTop: 2 }}>{reaction.emoji}</div> */}
      </div>

      {/* Progress bar */}
      <div className="progress-bar">
          {/* Reaction label */}
      <div className="caloriescounter-reaction" style={{  color: reaction.color }}>
        {reaction.label}
      </div>
        <div style={{
          height: "6px",
          width: `${pct}%`,
          background: reaction.color,
          borderRadius: 3,
          transition: "width 0.3s ease, background 0.4s ease",
          marginBottom: "0px"
        }} />
      </div>
      </div>
     

      {/* Breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3px 12px" }}>
        {[
          ["Base",    breakdown.baseC],
          ["Molho",   breakdown.sauceC],
          ["Queijo",  breakdown.cheeseC],
          ["Toppings", breakdown.toppingsC],
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