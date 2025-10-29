import React, { useState, useEffect } from "react";
import Auth from "./components/Auth";
import PizzaBuilder from "./components/PizzaBuilder";
import Feed from "./components/Feed";
import Profile from "./components/Profile"; // 👈 new
import { loadFeedFromStorage, saveFeedToStorage } from "./utils/storage";
import "./index.css";

export default function App() {
  const [user, setUser] = useState(null);
  const [feed, setFeed] = useState(() => loadFeedFromStorage() || []);
  const [view, setView] = useState("builder"); // 👈 "builder" | "feed" | "profile"
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("bookmarks")) || [];
    } catch {
      return [];
    }
  });

  // persist feed + bookmarks locally
  useEffect(() => {
    saveFeedToStorage(feed);
  }, [feed]);

  useEffect(() => {
    localStorage.setItem("bookmarks", JSON.stringify(bookmarks));
  }, [bookmarks]);

  // publish a new pizza recipe
  const publishToFeed = (recipe) => {
    const newPost = {
      id: Date.now(),
      ...recipe,
      author: user?.displayName || user?.name || "Anonymous Chef",
      userId: user?.uid || "guest",
      createdAt: new Date().toISOString(),
    };
    setFeed((prev) => [newPost, ...prev]);
    setView("feed"); // 👈 show feed after publishing
  };

  const toggleBookmark = (id) => {
    setBookmarks((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );
  };

  return (
    <div className="app-root">
      <Auth user={user} setUser={setUser} />

      {user ? (
        <>
          {/* 🧭 Simple nav bar */}
          <nav
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 16,
              background: "#111",
              color: "#fff",
              padding: "10px 0",
            }}
          >
            <button onClick={() => setView("builder")}>🍕 Builder</button>
            <button onClick={() => setView("feed")}>📰 Feed</button>
            <button onClick={() => setView("profile")}>👤 Profile</button>
          </nav>

          {/* 🪄 Render the current view */}
          {view === "builder" && (
            <PizzaBuilder user={user} publishToFeed={publishToFeed} />
          )}

          {view === "feed" && (
            <Feed
              feed={feed}
              onSave={publishToFeed}
              onToggleBookmark={toggleBookmark}
              bookmarks={bookmarks}
            />
          )}

          {view === "profile" && (
            <Profile
              user={user}
              feed={feed}
              bookmarks={bookmarks}
              onToggleBookmark={toggleBookmark}
            />
          )}
        </>
      ) : (
        <div style={{ color: "white", padding: 20 }}>
          Please log in to start building your pizza 🍕
        </div>
      )}
    </div>
  );
}
