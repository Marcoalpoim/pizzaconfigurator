import React, { useState, useEffect } from "react";
import Auth from "./components/Auth";
import PizzaBuilder from "./components/PizzaBuilder";
import Feed from "./components/Feed";
import Profile from "./components/Profile";
import { loadFeedFromStorage, saveFeedToStorage } from "./utils/storage";
import "./index.css";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import RecipePage from "./components/RecipePage";
import { SpeedInsights } from '@vercel/speed-insights/react'

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConfig, setShowConfig] = useState(() => {
    const saved = localStorage.getItem("pizzaBuilderConfigOpen");
    return saved ? JSON.parse(saved) : true;
  });
  const [feed, setFeed] = useState(() => loadFeedFromStorage() || []);
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("bookmarks")) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    saveFeedToStorage(feed);
  }, [feed]);
  useEffect(() => {
    localStorage.setItem("pizzaBuilderConfigOpen", JSON.stringify(showConfig));
  }, [showConfig]);
  useEffect(() => {
    localStorage.setItem("bookmarks", JSON.stringify(bookmarks));
  }, [bookmarks]);

  const publishToFeed = (recipe) => {
    const newPost = {
      id: Date.now(),
      ...recipe,
      author: user?.displayName || user?.name || "Anonymous Chef",
      userId: user?.uid || "guest",
      createdAt: new Date().toISOString(),
    };
    setFeed((prev) => [newPost, ...prev]);
  };

  const handleLogout = () => {
    setUser(null);
  };

  const toggleBookmark = (id) => {
    setBookmarks((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id],
    );
  };

  const deletePublishedRecipe = (id) => {
    setFeed((prev) => prev.filter((item) => item.id !== id));
  };

  if (loading) {
    return (
      <div className="loader-screen">
        <img
          src="/icons/loadingPI.gif"
          alt="Loading..."
          className="loader-gif"
        />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="app-root">
        <Auth user={user} setUser={setUser} />

        {user ? (
          <>
            {/* Brand logo — top-center on mobile, top-left on desktop */}
            <div className="brand-logo">
             <Link to="/"><img src="/icons/logotipo-pizzainator.png" alt="Pizzainator" /> </Link>
            </div>
            <nav className="mainnav-container">
              <Link to="/">
                <img src="/icons/Home.svg" alt="Home" />
              </Link>
              <Link to="/feed">
                <img src="/icons/Interface.svg" alt="Feed" />
              </Link>
              <Link to="/profile">
                <img src="/icons/user.svg" alt="user" />
              </Link>
            </nav>

            <Routes>
              <Route
                path="/"
                element={
                  <PizzaBuilder
                    user={user}
                    publishToFeed={publishToFeed}
                    showConfig={showConfig}
                    setShowConfig={setShowConfig}
                  />
                }
              />
              <Route
                path="/feed"
                element={
                  <Feed
                    feed={feed}
                    bookmarks={bookmarks}
                    onBookmark={toggleBookmark}
                  />
                }
              />
              <Route
                path="/profile"
                element={
                  <Profile
                    user={user}
                    feed={feed}
                    bookmarks={bookmarks}
                    onToggleBookmark={toggleBookmark}
                    onDeletePublished={deletePublishedRecipe}
                    onLogout={handleLogout}
                  />
                }
              />
              <Route
                path="/recipe/:id"
                element={
                  <RecipePage
                    feed={feed}
                    bookmarks={bookmarks}
                    onToggleBookmark={toggleBookmark}
                  />
                }
              />
              <Route path="/info" />
            </Routes>
          </>
        ) : (
          <div style={{ color: "white", padding: 20 }}>Log in 🍕</div>
        )}
      </div>
    </BrowserRouter>
  );
}
