import { useState, useRef, useEffect } from "react";
import { INGREDIENTS } from "../../data/ingredients";

export default function IngredientPanel({
  addIngredient,
  removeIngredient,
  ingredientCounts,
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const bodyRef = useRef(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (bodyRef.current) {
      setHeight(open ? bodyRef.current.scrollHeight : 0);
    }
    if (open && containerRef.current) {
      setTimeout(() => {
        containerRef.current.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }, 50);
    }
  }, [open]);

  return (
    <div ref={containerRef} className="pizza-ingredients-item">
      <div
        onClick={() => setOpen((o) => !o)}
        className="pizza-controls-item-content"
      >
        <span style={{ fontSize: 13, fontWeight: 400, color: "#fff" }}>
          Ingredientes
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 500 }}>
            {Object.values(ingredientCounts).reduce((a, b) => a + b, 0) ||
              "Nenhum"}
          </span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            style={{
              color: "#fff",
              transition: "transform 0.25s ease",
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            <path d="M4 6l4 4 4-4" />
          </svg>
        </div>
      </div>

      <div
        ref={bodyRef}
        style={{
          height: height,
          overflow: "hidden",
          transition: "height 0.28s cubic-bezier(0.4, 0, 0.2, 1)",
          borderTop: height > 0 ? "0.5px solid #ddd" : "none",
        }}
      >
        <div style={{ padding: 6 }}>
          {INGREDIENTS.map((ing) => (
            <div key={ing.id} className="ingredient-container-item">
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <img
                  src={ing.image}
                  alt={ing.name}
                  width={24}
                  height={24}
                  style={{ borderRadius: "5px" }}
                  loading="lazy"
                />
                <span style={{ fontSize: 14 }}>{ing.name}</span>
              </span>

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button onClick={() => removeIngredient(ing.id)}>-</button>
                <span style={{ fontSize: 14 }}>
                  {ingredientCounts[ing.id] || 0}
                </span>
                <button onClick={() => addIngredient(ing.id)}>+</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
