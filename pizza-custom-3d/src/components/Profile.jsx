import React from "react";

export default function Profile({ user, feed, bookmarks, onToggleBookmark }) {
  const userRecipes = feed.filter((p) => p.userId === user?.uid);
  const saved = feed.filter((p) => bookmarks.includes(p.id));

  return (
    <div style={{ padding: 20, color: "white" }}>
      <h2>{user.displayName || user.name}'s Profile 👨‍🍳</h2>

      <h3>My Recipes</h3>
      {userRecipes.length ? (
        userRecipes.map((r) => (
          <div key={r.id}>
            <strong>{r.name || "Untitled Pizza"}</strong>
          </div>
        ))
      ) : (
        <p>No recipes yet.</p>
      )}

      <h3>Bookmarked Recipes</h3>
      {saved.length ? (
        saved.map((r) => (
          <div key={r.id}>
            <strong>{r.name || "Untitled Pizza"}</strong>
          </div>
        ))
      ) : (
        <p>No bookmarks yet.</p>
      )}
    </div>
  );
}
