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
              padding: 12,
              border: "1px solid #222",
              marginBottom: 10,
              borderRadius: 8,
              background: "#181818",
              color: "#eee",
            }}
          >
            {/* Author & base info */}
            <div style={{ fontWeight: 600, fontSize: 15 }}>
              {item.author || "Anonymous"}
            </div>
            <div style={{ fontSize: 13, color: "#bbb" }}>
              {item.baseType} base — {item.baseSize} cm
            </div>

            {/* Ingredients */}
            <div style={{ marginTop: 8, fontSize: 13, color: "#ccc" }}>
              <strong>Cheese:</strong> {item.cheeseAmount || 0} blobs <br />
              <strong>Sauce:</strong> {item.sauceType || "Tomato"}
            </div>

            {item.toppings?.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <strong style={{ fontSize: 13 }}>Toppings:</strong>
                <ul style={{ marginTop: 4, paddingLeft: 18 }}>
                  {item.toppings.map((t, i) => (
                    <li key={i} style={{ fontSize: 13 }}>
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

            {/* Action buttons */}
            <div
              style={{
                marginTop: 10,
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={() => onSave?.(item)}
                style={{
                  background: "#5a1c1c",
                  color: "#fff",
                  border: "none",
                  padding: "6px 10px",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                Republish
              </button>

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
                top: 8,
                right: 8,
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
