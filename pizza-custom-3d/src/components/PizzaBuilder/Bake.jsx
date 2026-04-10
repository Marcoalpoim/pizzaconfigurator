// src/components/PizzaBuilder/Bake.jsx
import React, { useState, useRef } from "react";
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

export default function Bake({ baseRef, cheeseGroupRef, toppingsGroupRef }) {
  const [isBaking, setIsBaking] = useState(false);
  const [bakeProgress, setBakeProgress] = useState(0);
  const bakeIntervalRef = useRef(null);
  const originalToppingColorsRef = useRef({});

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
          blob.scale.y = (0.06 + Math.random() * 0.04) * (1 + t * 0.6);
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

  return (
    <div className="bake-wrapper">
      <div className="bake-container">
        <div >
          <button
            onClick={bakeProgress === 100 ? resetBake : startBake}
            disabled={isBaking}
            style={{ width: "100%", padding: "10px" }}
          >
            {isBaking
              ? "No Forno ..."
              : bakeProgress === 100
                ? "Tirar do Forno"
                : "Levar ao Forno"}
          </button>
        </div>

        {(isBaking || bakeProgress > 0) && (
          <div className="fornoProgress">
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
            </div >
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
                          (bakeProgress / 100) * (BAKE_STAGES.length - 1),
                        ),
                        BAKE_STAGES.length - 1,
                      )
                    ]
                  }
                </span>
                <span>Perfeito!</span>
              </div>
          </div>
        )}
      </div>
    </div>
  );
}
