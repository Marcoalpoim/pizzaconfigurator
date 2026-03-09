import React, { useState, useEffect } from "react";
import Auth from "./components/Auth";
import PizzaBuilder from "./components/PizzaBuilder";
import Feed from "./components/Feed";
import Profile from "./components/Profile"; // 👈 new
import { loadFeedFromStorage, saveFeedToStorage } from "./utils/storage";
import "./index.css";

export default function App() {
  const [user, setUser] = useState(null);
  const [showConfig, setShowConfig] = useState(() => {
  const saved = localStorage.getItem("pizzaBuilderConfigOpen");
  return saved ? JSON.parse(saved) : true; // default open
});
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
  if (view === "builder") {
    localStorage.setItem("pizzaBuilderConfigOpen", JSON.stringify(showConfig));
  }
}, [showConfig, view]);

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

  const deleteFromFeed = (id) => {
    setFeed((prev) => prev.filter((item) => item.id !== id));
  };

  const toggleBookmark = (id) => {
    setBookmarks((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id],
    );
  };

  // Delete a published recipe from the feed
  const deletePublishedRecipe = (id) => {
    setFeed((prev) => prev.filter((item) => item.id !== id));
  };

  // Delete a bookmarked recipe
  const deleteBookmarkRecipe = (id) => {
    setBookmarks((prev) => prev.filter((b) => b !== id));
  };

  return (
    <div className="app-root">
      <Auth user={user} setUser={setUser} />

      {user ? (
        <>
          {/* 🧭 Simple nav bar */}
          <nav className="mainnav-container">
            <button onClick={() => setView("builder")}>📰</button>
            <button
              onClick={() => {
                setView("builder");
                setShowConfig((prev) => !prev);
              }}
            >
              🍕 Builder
            </button>
            <button onClick={() => setView("feed")}>📰 Feed</button>
            <button onClick={() => setView("profile")}>👤 Profile</button>
          </nav>

          {/* 🪄 Render the current view */}
          {view === "builder" && (
            <PizzaBuilder
              user={user}
              publishToFeed={publishToFeed}
              showConfig={showConfig}
            />
          )}

          {view === "feed" && (
            <Feed
              feed={feed}
              onSave={publishToFeed}
              onToggleBookmark={toggleBookmark}
              bookmarks={bookmarks}
              onDelete={deleteFromFeed}
            />
          )}

          {view === "profile" && (
            <Profile
              user={user}
              feed={feed}
              bookmarks={bookmarks}
              onToggleBookmark={toggleBookmark}
              onDeletePublished={deletePublishedRecipe}
              onDeleteBookmark={deleteBookmarkRecipe}
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
