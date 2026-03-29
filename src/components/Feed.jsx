import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

// --- Bookmark Handler ---

function downloadRecipe(recipe) {
  const downloads = JSON.parse(localStorage.getItem("downloads") || "{}");

  downloads[recipe.id] = (downloads[recipe.id] || 0) + 1;

  localStorage.setItem("downloads", JSON.stringify(downloads));

  const dataStr = JSON.stringify(recipe, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `pizza-${recipe.id}.json`;
  a.click();

  URL.revokeObjectURL(url);
}
export default function Feed({ feed = [], onBookmark, bookmarks }) {
  const [search, setSearch] = useState("");
  const [activeTags, setActiveTags] = useState([]);
  const downloadCounts = useMemo(() => {
    return JSON.parse(localStorage.getItem("downloads") || "{}");
  }, [feed]);
  const navigate = useNavigate();
  const bookmarkCounts = useMemo(() => {
    const counts = {};

    bookmarks.forEach((id) => {
      counts[id] = (counts[id] || 0) + 1;
    });

    return counts;
  }, [bookmarks]);
  // --- Extract Popular Tags ---
  const popularTags = useMemo(() => {
    const tagCounts = {};

    feed.forEach((item) => {
      item.toppings?.forEach((t) => {
        const key = t.name?.toLowerCase();
        if (!key) return;
        tagCounts[key] = (tagCounts[key] || 0) + 1;
      });
    });

    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12);
  }, [feed]);

  // --- Filtered Feed ---
  const filteredFeed = useMemo(() => {
    return feed.filter((item) => {
      const text = (
        (item.author || "") +
        " " +
        (item.baseType || "") +
        " " +
        (item.sauceType || "") +
        " " +
        (item.toppings?.map((t) => t.name).join(" ") || "")
      ).toLowerCase();

      const matchesSearch = text.includes(search.toLowerCase());

      const matchesTag =
        activeTags.length > 0
          ? activeTags.every((tag) =>
              item.toppings?.some((t) => t.name?.toLowerCase().includes(tag)),
            )
          : true;

      return matchesSearch && matchesTag;
    });
  }, [feed, search, activeTags]);

  if (!feed) return null;

  return (
    <div className="feed-layout">
      {/* LEFT SIDE */}
      <div className="feed-main">
        <div className="feed-search">
          <input
            placeholder="🔍 Procurar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

         <div className="feed-tags mobile-only">
        <h4>AS TAGS DO MOMENTO</h4>

        <div className="tags-list">
          {popularTags.map(([tag]) => (
            <button
              key={tag}
              className={`tag ${activeTags.includes(tag) ? "active" : ""}`}
              onClick={() =>
                setActiveTags((prev) =>
                  prev.includes(tag)
                    ? prev.filter((t) => t !== tag)
                    : [...prev, tag],
                )
              }
            >
              {tag}
            </button>
          ))}
        </div>

        {/* RESET */}
        <button
          style={{ marginTop: 12 }}
          onClick={() => {
            setSearch("");
            setActiveTags([]);
          }}
        >
          Reset Filters
        </button>
      </div>

        {/* GRID */}
        <div className="feed-grid">
          {filteredFeed.map((item) => {
            // group toppings
            const grouped = item.toppings?.reduce((acc, t) => {
              const key = t.name || "Unknown";
              if (!acc[key]) {
                acc[key] = { count: 0, color: t.color };
              }
              acc[key].count++;
              return acc;
            }, {});

            return (
              <div
                key={item.id}
                className="feed-card"
                onClick={() => navigate(`/recipe/${item.id}`)}
                style={{ cursor: "pointer" }}
              >
                {/* IMAGE */}
                <img
                  src={item.image || "/placeholder-pizza.png"}
                  alt="Pizza"
                  loading="lazy"
                  style={{
                    width: "100%",
                    borderRadius: 12,
                    objectFit: "cover",
                    height: 180,
                    background: "#222",
                  }}
                />

                {/* AUTHOR */}
                <div style={{ marginTop: 8, fontWeight: 600 }}>
                  {item.author || "Anonymous"}
                </div>

                {/* INFO */}
                <div style={{ fontSize: 13, color: "#aaa" }}>
                  {item.baseType} — {item.baseSize} cm
                </div>

                {/* TAGS */}
                <div
                  style={{
                    marginTop: 8,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                  }}
                >
                  {grouped &&
                    Object.entries(grouped).map(([name, info], idx) => (
                      <span
                        key={idx}
                        className="tag"
                        onClick={() => {
                          const tag = name.toLowerCase();

                          setActiveTags((prev) =>
                            prev.includes(tag)
                              ? prev.filter((t) => t !== tag)
                              : [...prev, tag],
                          );
                        }}
                        style={{
                          cursor: "pointer",
                          fontSize: 12,
                          border: "1px solid #777",
                          padding: "4px 8px",
                          borderRadius: 999,
                        }}
                      >
                        {name} ×{info.count}
                      </span>
                    ))}
                </div>

                {/* ACTIONS */}
                <div
                  style={{
                    marginTop: 12,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  {/* ⭐ Bookmark */}
                  <div
                    onClick={() => onBookmark(item.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      cursor: "pointer",
                      color: bookmarks.includes(item.id) ? "#ffd700" : "#fff",
                    }}
                  >
                    ⭐ <span>{bookmarkCounts[item.id] || 0}</span>
                  </div>

                  {/* ⬇️ Download */}
                  <button
                    onClick={() => downloadRecipe(item)}
                    style={{
                      background: "#222",
                      border: "1px solid #444",
                      color: "#fff",
                      padding: "6px 10px",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontSize: 12,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    ⬇ {downloadCounts[item.id] || 0}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT SIDE - TAGS */}
      <div className="feed-tags desktop-only">
        <h4>AS TAGS DO MOMENTO</h4>

        <div className="tags-list">
          {popularTags.map(([tag]) => (
            <button
              key={tag}
              className={`tag ${activeTags.includes(tag) ? "active" : ""}`}
              onClick={() =>
                setActiveTags((prev) =>
                  prev.includes(tag)
                    ? prev.filter((t) => t !== tag)
                    : [...prev, tag],
                )
              }
            >
              {tag}
            </button>
          ))}
        </div>

        {/* RESET */}
        <button
          style={{ marginTop: 12 }}
          onClick={() => {
            setSearch("");
            setActiveTags([]);
          }}
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
}
