import React from "react";

export default function Profile({ user, feed, bookmarks, onToggleBookmark }) {
  const userRecipes = feed.filter((p) => p.userId === user?.uid);

  // Rename this variable so it doesn’t conflict with the prop
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

      {/* Published recipes */}
      <h3 style={{ marginTop: 20 }}>🍕 Your Recipes</h3>
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

      {/* Bookmarked recipes */}
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
