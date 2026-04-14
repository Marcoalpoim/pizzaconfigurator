import { INGREDIENTS } from "../../data/ingredients";

export default function IngredientPanel({
  addIngredient,
  removeIngredient,
  ingredientCounts,
}) {
  return (
    <>
      <h2 style={{ fontSize: 14, fontWeight: 400, color: "#fff", marginBottom: 10 }}>Ingredientes</h2>

      <div className="ingredient-container"> 
        {INGREDIENTS.map((ing) => (
          <div
            key={ing.id}
            className="ingredient-container-item">
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <img
                src={ing.image}
                alt={ing.name}
                style={{ width: 24, height: 24, borderRadius: "5px" }} 
              />
              {ing.name}
            </span>

            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <button onClick={() => removeIngredient(ing.id)}>-</button>
              <span>{ingredientCounts[ing.id] || 0}</span>
              <button onClick={() => addIngredient(ing.id)}>+</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
