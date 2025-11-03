import React, { useEffect, useState } from "react";

export default function Profile({ user, feed, bookmarks, onToggleBookmark }) {
  const [localRecipes, setLocalRecipes] = useState([]);

  // 🔹 Load saved recipes on mount or when user changes
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("userRecipes") || "[]");
    const mine = stored.filter(
      (r) => r.userId === user?.uid || r.userId === user?.id
    );
    setLocalRecipes(mine);
  }, [user]);

  // 🔹 Delete a recipe from profile
  const handleDeleteRecipe = (id) => {
    const updated = localRecipes.filter((r) => r.id !== id);
    setLocalRecipes(updated);
    localStorage.setItem("userRecipes", JSON.stringify(updated));
  };

  // 🔹 Feed recipes (public)
  const userRecipes = feed.filter((p) => p.userId === user?.uid);

  // 🔹 Local bookmarks
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

      {/* 💾 Saved to profile */}
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
              {/* 🗑️ Delete button */}
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
                title="Delete recipe"
              >
                🗑️
              </button>

              <div style={{ fontSize: 16, fontWeight: "bold", marginBottom: 4 }}>
                {r.baseType} base — {r.baseSize} cm
              </div>

              <div style={{ fontSize: 13, color: "#bbb" }}>
                <strong>Cheese:</strong> {r.cheeseAmount} blobs <br />
                <strong>Sauce:</strong> {r.sauceType || "Tomato"} <br />
                <strong>Author:</strong> {r.author || user?.displayName}
              </div>

              {r.toppings?.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <strong>Toppings:</strong>
                  <ul style={{ marginTop: 4, paddingLeft: 18 }}>
                    {r.toppings.map((t, i) => (
                      <li key={i}>
                        <span
                          style={{
                            display: "inline-block",
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: `#${t.color
                              ?.toString(16)
                              .padStart(6, "0")}`,
                            marginRight: 6,
                          }}
                        />
                        {t.name || "Unknown ingredient"}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p>No recipes saved yet.</p>
      )}

      {/* 🍕 Published (feed) */}
      <h3 style={{ marginTop: 20 }}>🍕 Published Recipes</h3>
      {userRecipes.length ? (
        <ul>
          {userRecipes.map((r) => (
            <li key={r.id}>
              {r.baseType} — {r.baseSize} cm
            </li>
          ))}
        </ul>
      ) : (
        <p>No recipes published yet.</p>
      )}

      {/* ⭐ Bookmarks */}
      <h3 style={{ marginTop: 20 }}>⭐ Bookmarked Recipes</h3>
      {localBookmarks.length ? (
        <ul>
          {localBookmarks.map((r) => (
            <li key={r.id}>
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
