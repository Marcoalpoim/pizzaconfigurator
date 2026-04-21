import React, { useMemo, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ReactDOM from "react-dom/client"; 
import { downloadRecipeAsReceipt } from "../utils/downloadRecipeAsReceipt";

 
function useHorizontalScroll() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onWheel = (e) => {
      if (el.scrollWidth > el.clientWidth) {
        e.preventDefault();
        e.stopPropagation();
        el.scrollLeft += e.deltaY;
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);
  return ref;
}
 
function TagsRow({ grouped, setActiveTags }) {
  const tagsRef = useHorizontalScroll();
  return (
    <div className="feed-card-tags" ref={tagsRef}>
      {grouped &&
        Object.entries(grouped).map(([name, info], idx) => (
          <span
            key={idx}
            className="tag"
            onClick={(e) => {
              e.stopPropagation();
              const tag = name.toLowerCase();
              setActiveTags((prev) =>
                prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
              );
            }}
          >
            {name} ×{info.count}
          </span>
        ))}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Feed({ feed = [], onBookmark, bookmarks }) {
  const [search, setSearch]       = useState("");
  const [activeTags, setActiveTags] = useState([]);
  const navigate = useNavigate();

  const downloadCounts = useMemo(() => {
    return JSON.parse(localStorage.getItem("downloads") || "{}");
  }, [feed]);

  const bookmarkCounts = useMemo(() => {
    const counts = {};
    bookmarks.forEach((id) => { counts[id] = (counts[id] || 0) + 1; });
    return counts;
  }, [bookmarks]);

  const popularTags = useMemo(() => {
    const tagCounts = {};
    feed.forEach((item) => {
      item.toppings?.forEach((t) => {
        const key = t.name?.toLowerCase();
        if (!key) return;
        tagCounts[key] = (tagCounts[key] || 0) + 1;
      });
    });
    return Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 12);
  }, [feed]);

  const filteredFeed = useMemo(() => {
    return feed.filter((item) => {
      const text = (
        (item.author || "") + " " + (item.baseType || "") + " " +
        (item.sauceType || "") + " " + (item.toppings?.map((t) => t.name).join(" ") || "")
      ).toLowerCase();
      const matchesSearch = text.includes(search.toLowerCase());
      const matchesTag =
        activeTags.length > 0
          ? activeTags.every((tag) =>
              item.toppings?.some((t) => t.name?.toLowerCase().includes(tag))
            )
          : true;
      return matchesSearch && matchesTag;
    });
  }, [feed, search, activeTags]);

  if (!feed) return null;

  const TagList = () => {
    const tagsListRef = useHorizontalScroll();
    return (
    <>
      <h4>AS TAGS DO MOMENTO</h4>
      <div className="tags-list" ref={tagsListRef}>
        {popularTags.map(([tag]) => (
          <button
            key={tag}
            className={`tag ${activeTags.includes(tag) ? "active" : ""}`}
            onClick={() =>
              setActiveTags((prev) =>
                prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
              )
            }
          >
            {tag}
          </button>
        ))}
      </div>
    </>
    );
  };

  return (
    <div className="feed-layout">
      {/* LEFT SIDE */}
      <div className="feed-main">
        <div className="feed-search">
          <input
          placeholder="Procurar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="feed-tags mobile-only">
          <TagList />
        </div>

        {/* GRID */}
        <div className="feed-grid">
          {filteredFeed.map((item) => {
            const grouped = item.toppings?.reduce((acc, t) => {
              const key = t.name || "Unknown";
              if (!acc[key]) acc[key] = { count: 0, color: t.color };
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
                <img
                  src={item.image || "/placeholder-pizza.png"}
                  alt="Pizza"
                  loading="lazy"
                />
                <div className="feed-card-info">
                  <div className="feed-card-autor">{item.author || "Anonymous"}</div>
                  <div className="feed-card-pizzainfo">
                    {item.baseType} — {item.baseSize} cm
                  </div>
 
                  <TagsRow grouped={grouped} setActiveTags={setActiveTags} />
                </div>

                <div className="feed-card-btns">
                  <button
                    onClick={(e) => { e.stopPropagation(); onBookmark(item.id); }}
                    className={`tag ${bookmarks.includes(item.id) ? "bookmarked" : ""}`}
                  >
                    <img src="/icons/Bookmark.svg" alt="save" />{" "}
                    <span>{bookmarkCounts[item.id] || 0}</span>
                  </button>

                  <button
                    onClick={(e) => { e.stopPropagation(); downloadRecipeAsReceipt(item); }}
                  >
                    <img src="/icons/Receipt-white.svg" alt="receita" />{" "}
                    {downloadCounts[item.id] || 0}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT SIDE - TAGS */}
      <div className="feed-tags desktop-only">
        <TagList />
      </div>
    </div>
  );
}