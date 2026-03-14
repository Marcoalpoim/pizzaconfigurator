import React, { useEffect, useState } from "react";

export default function Profile({
  user,
  feed,
  bookmarks,
  onToggleBookmark,
  onDeletePublished,
  onDeleteBookmark
}) {
  const [localRecipes, setLocalRecipes] = useState([]);

  // Load saved recipes
useEffect(() => {
  const loadRecipes = () => {
    const stored = JSON.parse(localStorage.getItem("userRecipes") || "[]");
    const mine = stored.filter(
      (r) => r.userId === (user?.uid || user?.id)
    );
    setLocalRecipes(mine);
  };

  loadRecipes();

  window.addEventListener("storage", loadRecipes);

  return () => window.removeEventListener("storage", loadRecipes);
}, [user]);
  // Delete saved profile recipe
 const handleDeleteRecipe = (id) => {
  const stored = JSON.parse(localStorage.getItem("userRecipes") || "[]");

  const updated = stored.filter((r) => r.id !== id);

  localStorage.setItem("userRecipes", JSON.stringify(updated));

  setLocalRecipes(updated.filter(
    (r) => r.userId === (user?.uid || user?.id)
  ));
};

  // Published recipes by this user
  const userRecipes = feed.filter((p) => p.userId === user?.uid);

  // Bookmarked recipes
  const localBookmarks =
    JSON.parse(localStorage.getItem("bookmarkedRecipes") || "[]");

  return (
    <section
      className="profile-panel"
      style={{
        padding: 20,
        color: "white",
        background: "#111",
        borderRadius: 8,
      }}
    >
      <h2>{user?.displayName || "Your Profile"}</h2>

      {/* 💾 SAVED TO PROFILE */}
      <h3 style={{ marginTop: 20 }}>💾 Saved to Profile</h3>
      {localRecipes.length ? (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {localRecipes.map((r) => (
            <li
              key={r.id}
              style={{
                marginBottom: 16,
                padding: 12,
                borderRadius: 8,
                background: "#1c1c1c",
                color: "#eee",
                position: "relative",
              }}
            >
              {/* DELETE BUTTON */}
              <button
                onClick={() => handleDeleteRecipe(r.id)}
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  background: "transparent",
                  border: "none",
                  color: "#888",
                  cursor: "pointer",
                  fontSize: 18,
                }}
              >
                🗑️
              </button>

              {/* IMAGE */}
              <img
                src={r.image || "/placeholder-pizza.png"}
                alt="Pizza Preview"
                loading="lazy"
                style={{
                  width: "100%",
                  borderRadius: 8,
                  marginBottom: 8,
                  objectFit: "cover",
                  maxHeight: 200,
                }}
              />

              <div style={{ fontSize: 16, fontWeight: "bold" }}>
                {r.baseType} base — {r.baseSize} cm
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>No recipes saved yet.</p>
      )}

      {/* 🍕 PUBLISHED RECIPES */}
      <h3 style={{ marginTop: 20 }}>🍕 Published Recipes</h3>
      {userRecipes.length ? (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {userRecipes.map((r) => (
            <li
              key={r.id}
              style={{
                marginBottom: 16,
                padding: 12,
                borderRadius: 8,
                background: "#1c1c1c",
                color: "#eee",
                position: "relative",
              }}
            >
              {/* DELETE FROM FEED */}
              <button
                onClick={() => onDeletePublished?.(r.id)}
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  background: "transparent",
                  border: "none",
                  color: "#888",
                  cursor: "pointer",
                  fontSize: 18,
                }}
              >
                🗑️
              </button>

              <img
                src={r.image || "/placeholder-pizza.png"}
                alt="Pizza Preview"
                loading="lazy"
                style={{
                  width: "100%",
                  borderRadius: 8,
                  marginBottom: 8,
                  objectFit: "cover",
                  maxHeight: 200,
                }}
              />

              {r.baseType} — {r.baseSize} cm
            </li>
          ))}
        </ul>
      ) : (
        <p>No recipes published yet.</p>
      )}

      {/* ⭐ BOOKMARKED RECIPES */}
      <h3 style={{ marginTop: 20 }}>⭐ Bookmarked Recipes</h3>
      {localBookmarks.length ? (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {localBookmarks.map((r) => (
            <li
              key={r.id}
              style={{
                marginBottom: 16,
                padding: 12,
                borderRadius: 8,
                background: "#1c1c1c",
                color: "#eee",
                position: "relative",
              }}
            >
              {/* DELETE BOOKMARK */}
              <button
                onClick={() => onDeleteBookmark?.(r.id)}
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  background: "transparent",
                  border: "none",
                  color: "#888",
                  cursor: "pointer",
                  fontSize: 18,
                }}
              >
                🗑️
              </button>

              <img
                src={r.image || "/placeholder-pizza.png"}
                alt="Pizza Preview"
                loading="lazy"
                style={{
                  width: "100%",
                  borderRadius: 8,
                  marginBottom: 8,
                  objectFit: "cover",
                  maxHeight: 200,
                }}
              />

              {r.baseType} — {r.baseSize} cm
            </li>
          ))}
        </ul>
      ) : (
        <p>No bookmarks yet.</p>
      )}
    </section>
  );
}
