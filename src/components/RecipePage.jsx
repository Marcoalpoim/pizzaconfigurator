import React, { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function RecipePage({ feed, bookmarks, onToggleBookmark }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [showDetails, setShowDetails] = useState(false);

  const recipe = feed.find((r) => r.id === Number(id));

  const downloadCounts = useMemo(() => {
    return JSON.parse(localStorage.getItem("downloads") || "{}");
  }, []);

  if (!recipe) return <div style={{ color: "white" }}>Recipe not found</div>;


  // group toppings
  const groupedToppings = recipe.toppings?.reduce((acc, t) => {
    const key = t.name || "Unknown";
    if (!acc[key]) acc[key] = { count: 0 };
    acc[key].count++;
    return acc;
  }, {});

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        minHeight: "100vh",
        background: "#0f0f0f",
        color: "white",
      }}
    >
      {/* 🔝 HEADER */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 16px",
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(10px)",
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            background: "transparent",
            border: "none",
            color: "white",
            fontSize: 20,
            cursor: "pointer",
          }}
        >
          ←
        </button>

        <span style={{ fontSize: 14, color: "#aaa" }}>
          Recipe
        </span>

        <div style={{ width: 20 }} /> {/* spacer */}
      </div>

      {/* 🍕 IMAGE */}
      <motion.img
        src={recipe.image || "/placeholder-pizza.png"}
        alt="Pizza"
        initial={{ scale: 1.05 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4 }}
        style={{
          width: "100%",
          height: 260,
          objectFit: "cover",
        }}
      />

      {/* 📦 CONTENT */}
      <div style={{ padding: 16 }}> 

     {/* 👤 AUTHOR */}
<h3 style={{ marginTop: 16 }}>
  {recipe.author || "Anonymous"}
</h3>

{/* ⚡ ACTIONS */}
<div
  style={{
    display: "flex",
    gap: 16,
    marginTop: 10,
    alignItems: "center",
  }}
>
  {/* ⭐ Bookmark */}
  <div
    onClick={() => onToggleBookmark(recipe.id)}
    style={{
      cursor: "pointer",
      color: bookmarks.includes(recipe.id) ? "#ffd700" : "#fff",
    }}
  >
    ⭐ {bookmarks.includes(recipe.id) ? "Saved" : "Save"}
  </div>

  {/* ⬇ Downloads */}
  <div>
    ⬇ {downloadCounts[recipe.id] || 0}
  </div>
</div>

     {/* 📦 DETAILS DROPDOWN */}
<div style={{ marginTop: 20 }}>
  <div
    onClick={() => setShowDetails((prev) => !prev)}
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      cursor: "pointer",
      padding: "10px 0",
      borderBottom: "1px solid #333",
    }}
  >
    <h3 style={{ margin: 0 }}>Details</h3>
    <span>{showDetails ? "▲" : "▼"}</span>
  </div>

  {showDetails && (
    <div style={{ marginTop: 10, color: "#bbb", lineHeight: 1.6 }}>
      <p><strong>Size:</strong> {recipe.baseSize} cm</p>
      <p><strong>Base:</strong> {recipe.baseType}</p>
      <p><strong>Sauce:</strong> {recipe.sauceType}</p>
      {/*  <p><strong>Cheese:</strong> {recipe.cheeseAmount}</p>*/}

      {/* Add more if you have them */}
      {recipe.cheeseType && (
        <p><strong>Cheese Type:</strong> {recipe.cheeseType}</p>
      )}
    </div>
  )}
</div>

    {/* 🏷 INGREDIENTS */}
<div style={{ marginTop: 20 }}>
  <h3>Ingredients</h3>

  <div
    style={{
      display: "flex",
      flexWrap: "wrap",
      gap: 8,
      marginTop: 8,
    }}
  >
    {groupedToppings &&
      Object.entries(groupedToppings).map(([name, info], idx) => (
        <span
          key={idx}
          style={{
            border: "1px solid #444",
            padding: "6px 10px",
            borderRadius: 999,
            fontSize: 13,
            background: "#1a1a1a",
          }}
        >
          {name} ×{info.count}
        </span>
      ))}
  </div>
</div>


      </div>
    </motion.div>
  );
}