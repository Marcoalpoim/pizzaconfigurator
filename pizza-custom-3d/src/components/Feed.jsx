import React from "react";

// --- Helper: Bookmark Handler ---
function handleBookmark(recipe) {
  if (!recipe) return;

  const saved = JSON.parse(localStorage.getItem("bookmarkedRecipes") || "[]");
  const already = saved.find((r) => r.id === recipe.id);

  if (!already) {
    saved.push(recipe);
    localStorage.setItem("bookmarkedRecipes", JSON.stringify(saved));
    console.log("✅ Recipe bookmarked:", recipe.id);
  } else {
    console.log("⚠️ Already bookmarked:", recipe.id);
  }
}

// --- Feed Component ---
export default function Feed({ feed = [], onSave, onBookmark, onDelete }) {
  if (!feed) return null;

  return (
    <aside className="feed-panel">
      <h3>Feed (local)</h3>

      {feed.length === 0 ? (
        <div style={{ marginTop: 8, color: "#999" }}>
          No posts yet — publish a pizza.
        </div>
      ) : null}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {feed.map((item) => (
          <li
            key={item.id}
            className="feed-item"
            style={{
              position: "relative",
              padding: 10,
              border: "1px solid #222",
              marginBottom: 8,
              borderRadius: 8,
              background: "#181818",
            }}
          >
            <div style={{ fontWeight: 600 }}>{item.author || "anon"}</div>
            <div style={{ fontSize: 12, color: "#bbb" }}>
              {item.baseType} — {item.baseSize} cm
            </div>

            {/* Buttons */}
            <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
              <button onClick={() => onSave?.(item)}>Republish</button>

              <button
                onClick={() => {
                  handleBookmark(item);
                  onBookmark?.(item);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "#333",
                  color: "#fff",
                  padding: "6px 10px",
                  borderRadius: 6,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <span>⭐</span> Bookmark
              </button>
            </div>

            {/* Delete button (top-right) */}
            <button
              onClick={() => onDelete?.(item.id)}
              style={{
                position: "absolute",
                top: 6,
                right: 6,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "#888",
                fontSize: 16,
              }}
              title="Remove from feed"
            >
              🗑️
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
