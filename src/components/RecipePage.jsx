import React from "react";
import { useParams } from "react-router-dom";

export default function RecipePage({ feed, bookmarks, onToggleBookmark }) {
  const { id } = useParams();

  const recipe = feed.find((r) => r.id === Number(id));

  if (!recipe) return <div style={{ color: "white" }}>Recipe not found</div>;

  return (
    <div style={{ padding: 20, color: "white" }}>
      {/* IMAGE */}
      <img
        src={recipe.image || "/placeholder-pizza.png"}
        alt="Pizza"
        style={{
          width: "100%",
          maxHeight: 400,
          objectFit: "cover",
          borderRadius: 12,
        }}
      />

      {/* TITLE */}
      <h2 style={{ marginTop: 16 }}>
        {recipe.baseType} — {recipe.baseSize} cm
      </h2>

      <p style={{ color: "#aaa" }}>
        By {recipe.author || "Anonymous"}
      </p>

      {/* BOOKMARK */}
      <button
        onClick={() => onToggleBookmark(recipe.id)}
        style={{
          marginTop: 10,
          padding: "8px 12px",
          borderRadius: 6,
          background: bookmarks.includes(recipe.id) ? "#ffd700" : "#333",
          border: "none",
          cursor: "pointer",
        }}
      >
        ⭐ {bookmarks.includes(recipe.id) ? "Saved" : "Save"}
      </button>

      {/* DETAILS */}
      <div style={{ marginTop: 20 }}>
        <h3>Details</h3>
        <p><strong>Sauce:</strong> {recipe.sauceType}</p>
        <p><strong>Cheese:</strong> {recipe.cheeseAmount}</p>
      </div>

      {/* TOPPINGS */}
      <div style={{ marginTop: 20 }}>
        <h3>Toppings</h3>
        {recipe.toppings?.map((t, i) => (
          <div key={i}>{t.name}</div>
        ))}
      </div>
    </div>
  );
}