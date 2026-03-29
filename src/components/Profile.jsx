import React, { useEffect, useState } from "react";
import { logout } from "../firebase";

export default function Profile({
  user,
  feed,
  bookmarks,
  onToggleBookmark,
  onDeletePublished,
  onDeleteBookmark
}) {
  const [localRecipes, setLocalRecipes] = useState([]);

const [activeTab, setActiveTab] = useState("created");
// "created" | "published" | "bookmarked"
  // Load saved recipes

  const totalBookmarks = feed.reduce((acc, recipe) => {
  if (recipe.userId === user?.uid) {
    return acc + (recipe.bookmarkCount || 0);
  }
  return acc;
}, 0);
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



const handleLogout = async () => {
  try {
    await logout();
  } catch (err) {
    console.error("Logout error:", err);
  }
};
const handleShare = () => {
  const url = window.location.href;

  if (navigator.share) {
    navigator.share({
      title: "My Pizza Profile 🍕",
      text: "Check out my pizza creations!",
      url,
    });
  } else {
    navigator.clipboard.writeText(url);
    alert("Profile link copied!");
  }
};
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
 const bookmarkedRecipes = feed.filter((item) =>
  bookmarks.includes(item.id)
);


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
{/* 👤 PROFILE HEADER */}
<div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  }}
>
  {/* LEFT */}
  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
   <img
  src={user?.photoURL || "/default-avatar.png"}
  alt="Profile"
  style={{
    width: 60,
    height: 60,
    borderRadius: "50%",
    objectFit: "cover",
  }}
/>

    <div>
      <div style={{ fontSize: 18, fontWeight: "bold" }}>
        {user?.displayName || "User"}
      </div>

      {/* 📊 STATS */}
      <div style={{ fontSize: 13, color: "#aaa" }}>
        {localRecipes.length} Created · {userRecipes.length} Published ·{" "}
        {bookmarkedRecipes.length} Bookmarked
      </div>
    </div>
  </div>

  {/* RIGHT */}
  <div style={{ display: "flex", gap: 10 }}>
   <button onClick={handleShare}>📤 Share</button>
<button onClick={handleLogout}>🚪 Logout</button>
  </div>
</div>
{/* 🧭 TABS */}
<div
  style={{
    display: "flex",
    gap: 10,
    marginBottom: 20,
    background: "#1c1c1c",
    padding: 6,
    borderRadius: 999,
  }}
>
  {[
    { key: "created", label: "Created" },
    { key: "published", label: "Published" },
    { key: "bookmarked", label: "Bookmarked" },
  ].map((tab) => (
    <button
      key={tab.key}
      onClick={() => setActiveTab(tab.key)}
      style={{
        flex: 1,
        padding: "8px 12px",
        borderRadius: 999,
        border: "none",
        cursor: "pointer",
        background:
          activeTab === tab.key ? "#fff" : "transparent",
        color: activeTab === tab.key ? "#000" : "#aaa",
        fontWeight: 500,
      }}
    >
      {tab.label}
    </button>
  ))}
</div>

 {/* 📦 CONTENT */}
<ul style={{ listStyle: "none", padding: 0 }}>
  {(
    activeTab === "created"
      ? localRecipes
      : activeTab === "published"
      ? userRecipes
      : bookmarkedRecipes
  ).map((r) => (
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
      {/* ACTION BUTTON */}
      {activeTab === "created" && (
        <button onClick={() => handleDeleteRecipe(r.id)}>🗑️</button>
      )}

      {activeTab === "published" && (
        <button onClick={() => onDeletePublished?.(r.id)}>🗑️</button>
      )}

      {activeTab === "bookmarked" && (
        <button onClick={() => onToggleBookmark(r.id)}>🗑️</button>
      )}

      <img
        src={r.image || "/placeholder-pizza.png"}
        alt="Pizza"
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
{(
  activeTab === "created"
    ? localRecipes.length === 0
    : activeTab === "published"
    ? userRecipes.length === 0
    : bookmarkedRecipes.length === 0
) && <p>No recipes here yet.</p>}
    </section>
  );
}
