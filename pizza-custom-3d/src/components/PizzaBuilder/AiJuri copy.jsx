// src/components/PizzaBuilder/AiJuri.jsx
import React, { useState, useRef, useEffect } from "react";
import * as THREE from "three";

const BAKE_STAGES = [
  "Raw dough",
  "Preheating...",
  "Rising...",
  "Crust forming",
  "Cheese melting",
  "Toppings sizzling",
  "Golden brown",
  "Perfect!",
];

export default function AiJuri({
  pizzaShape,
  baseType,
  baseSize,
  sauceType,
  cheeseType,
  ingredientCounts,
  sceneRef,
  baseRef,
  cheeseGroupRef,
  toppingsGroupRef,
}) {
  // ── Keep refs always pointing at the latest prop values ───────────────────
  // This ensures judgePizza() always reads the current pizza, not a stale closure.
  const pizzaShapeRef      = useRef(pizzaShape);
  const baseTypeRef        = useRef(baseType);
  const baseSizeRef        = useRef(baseSize);
  const sauceTypeRef       = useRef(sauceType);
  const cheeseTypeRef      = useRef(cheeseType);
  const ingredientCountsRef = useRef(ingredientCounts);

  useEffect(() => { pizzaShapeRef.current       = pizzaShape;       }, [pizzaShape]);
  useEffect(() => { baseTypeRef.current         = baseType;         }, [baseType]);
  useEffect(() => { baseSizeRef.current         = baseSize;         }, [baseSize]);
  useEffect(() => { sauceTypeRef.current        = sauceType;        }, [sauceType]);
  useEffect(() => { cheeseTypeRef.current       = cheeseType;       }, [cheeseType]);
  useEffect(() => { ingredientCountsRef.current = ingredientCounts; }, [ingredientCounts]);

  // ── AI Judge state ────────────────────────────────────────────────────────
  const [judgeResult, setJudgeResult] = useState(null);
  const [judgeLoading, setJudgeLoading] = useState(false);

  // ── Bake state ────────────────────────────────────────────────────────────
  const [isBaking, setIsBaking] = useState(false);
  const [bakeProgress, setBakeProgress] = useState(0);
  const bakeIntervalRef = useRef(null);
  const originalToppingColorsRef = useRef({});

  // ── AI Judge ──────────────────────────────────────────────────────────────
  async function judgePizza() {
    setJudgeLoading(true);
    setJudgeResult(null);

    // Read from refs — always the current values, never stale
    const toppingsList =
      Object.entries(ingredientCountsRef.current)
        .filter(([, count]) => count > 0)
        .map(([id, count]) => `${id} (x${count})`)
        .join(", ") || "no toppings";

    const prompt = `You are a brutally honest but funny Italian pizza chef AI judge.
A customer just built this pizza:
- Shape: ${pizzaShapeRef.current}
- Base: ${baseTypeRef.current}, ${baseSizeRef.current}cm
- Sauce: ${sauceTypeRef.current}
- Cheese: ${cheeseTypeRef.current}
- Toppings: ${toppingsList}

Respond ONLY with a JSON object, no markdown, no backticks:
{
  "name": "a creative funny name for this pizza (max 5 words)",
  "score": <integer 0-100>,
  "verdict": "2-3 sentence roast/review of this pizza. Be funny, opinionated, specific about the choices.",
  "suggestion": "one concrete improvement suggestion in one sentence"
}`;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await response.json();
      console.log("Judge API response:", data);
      if (!response.ok) {
        throw new Error(data?.error?.message || `HTTP ${response.status}`);
      }
      const text = data.content?.map((b) => b.text || "").join("") || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setJudgeResult(parsed);
    } catch (err) {
      console.error("Judge API error:", err);
      setJudgeResult({
        name: "API Error",
        score: 0,
        verdict: `Error: ${err.message}`,
        suggestion: "Check the browser console for details.",
      });
    } finally {
      setJudgeLoading(false);
    }
  }

  // ── Bake animation ────────────────────────────────────────────────────────
  function startBake() {
    if (isBaking) return;
    setIsBaking(true);
    setBakeProgress(0);

    // Snapshot every topping mesh's original color ONCE before the interval starts
    const origColors = {};
    if (toppingsGroupRef.current) {
      toppingsGroupRef.current.traverse((child) => {
        if (child.isMesh && child.material) {
          origColors[child.uuid] = child.material.color.clone();
        }
      });
    }
    originalToppingColorsRef.current = origColors;

    let progress = 0;
    bakeIntervalRef.current = setInterval(() => {
      progress = Math.min(progress + 0.8, 100);
      setBakeProgress(Math.round(progress));

      const t = progress / 100;

      // Darken the base dough colour as it bakes
      if (baseRef.current) {
        const rawColor = new THREE.Color(0xe8a85a);
        const bakedColor = new THREE.Color(0x8b4513);
        const current = rawColor.clone().lerp(bakedColor, t);
        baseRef.current.traverse((child) => {
          if (child.isMesh && child.material) {
            child.material.color.copy(current);
          }
        });
      }

      // Melt cheese: shift colour to golden
      if (cheeseGroupRef.current) {
        const rawCheese = new THREE.Color(0xffffff);
        const meltedCheese = new THREE.Color(0xf0c060);
        const cheeseCurrent = rawCheese.clone().lerp(meltedCheese, t);
        cheeseGroupRef.current.children.forEach((blob) => {
          if (blob.material) blob.material.color.copy(cheeseCurrent);
          blob.scale.y = (0.06 + Math.random() * 0.04) * (1 + t * 2);
        });
      }

      // Darken toppings slightly — always lerp FROM the original color, never accumulate
      if (toppingsGroupRef.current) {
        toppingsGroupRef.current.traverse((child) => {
          if (child.isMesh && child.material) {
            const orig = originalToppingColorsRef.current[child.uuid];
            if (orig) {
              child.material.color
                .copy(orig)
                .lerp(new THREE.Color(0x333333), t * 0.3);
            }
          }
        });
      }

      if (progress >= 100) {
        clearInterval(bakeIntervalRef.current);
        setIsBaking(false);
      }
    }, 60);
  }

  function resetBake() {
    clearInterval(bakeIntervalRef.current);
    setIsBaking(false);
    setBakeProgress(0);

    if (baseRef.current) {
      baseRef.current.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.color.set(0xe8a85a);
        }
      });
    }
    if (cheeseGroupRef.current) {
      cheeseGroupRef.current.children.forEach((blob) => {
        if (blob.material) blob.material.color.set(0xffffff);
      });
    }
    // Restore each topping to its original color
    if (toppingsGroupRef.current) {
      toppingsGroupRef.current.traverse((child) => {
        if (child.isMesh && child.material) {
          const orig = originalToppingColorsRef.current[child.uuid];
          if (orig) child.material.color.copy(orig);
        }
      });
    }
    originalToppingColorsRef.current = {};
  }

  const scoreColor =
    judgeResult?.score >= 80
      ? "#1d9e75"
      : judgeResult?.score >= 60
      ? "#ba7517"
      : "#e24b4a";

  return (
    <div style={{ borderTop: "1px solid #eee", marginTop: 8 }}>
      {/* ── AI Judge ── */}
      <div style={{ padding: "12px" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <button
            onClick={judgePizza}
            disabled={judgeLoading}
            style={{ flex: 1, padding: "10px" }}
          >
            {judgeLoading ? "Judging..." : "⭐ Judge my pizza"}
          </button>
          {judgeResult && (
            <button
              onClick={() => setJudgeResult(null)}
              style={{ padding: "10px 14px" }}
              title="Clear verdict"
            >
              ✕
            </button>
          )}
        </div>

        {judgeResult && (
          <div
            style={{
              border: "0.5px solid #ccc",
              borderRadius: 8,
              padding: 12,
              marginTop: 8,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  flexShrink: 0,
                  border: `3px solid ${scoreColor}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  fontWeight: 500,
                  color: scoreColor,
                }}
              >
                {judgeResult.score}
              </div>
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#888",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  pizza name
                </div>
                <div style={{ fontSize: 15, fontWeight: 500 }}>
                  "{judgeResult.name}"
                </div>
              </div>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.6, margin: "0 0 8px" }}>
              {judgeResult.verdict}
            </p>
            <div
              style={{
                background: "#f5f5f5",
                borderRadius: 6,
                padding: "8px 10px",
                fontSize: 12,
              }}
            >
              <strong>Chef says:</strong> {judgeResult.suggestion}
            </div>
          </div>
        )}
      </div>

      {/* ── Bake animation ── */}
      <div style={{ padding: "12px", borderTop: "1px solid #eee" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <button
            onClick={startBake}
            disabled={isBaking}
            style={{ flex: 1, padding: "10px" }}
          >
            {isBaking ? "Baking..." : "🔥 Bake it!"}
          </button>
          <button onClick={resetBake} style={{ padding: "10px 14px" }}>
            Reset
          </button>
        </div>

        {(isBaking || bakeProgress > 0) && (
          <div>
            <div
              style={{
                height: 6,
                background: "#eee",
                borderRadius: 3,
                overflow: "hidden",
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${bakeProgress}%`,
                  background: bakeProgress === 100 ? "#1d9e75" : "#d85a30",
                  borderRadius: 3,
                  transition: "width 0.1s ease",
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 12,
                color: "#888",
              }}
            >
              <span>Raw</span>
              <span>
                {
                  BAKE_STAGES[
                    Math.min(
                      Math.floor(
                        (bakeProgress / 100) * (BAKE_STAGES.length - 1)
                      ),
                      BAKE_STAGES.length - 1
                    )
                  ]
                }
              </span>
              <span>Perfect</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}