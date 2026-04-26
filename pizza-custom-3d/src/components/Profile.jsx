import React, { useEffect, useState, useRef } from "react";
import { logout } from "../firebase";
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

function TagsRow({ grouped }) {
  const tagsRef = useHorizontalScroll();
  return (
    <div className="profile-card-tags" ref={tagsRef}>
      {grouped &&
        Object.entries(grouped).map(([name, info], idx) => (
          <span key={idx} className="tag">
            {name} ×{info.count}
          </span>
        ))}
    </div>
  );
}

function RecipeCard({ r, onAction, actionIcon }) {
  const grouped = r.toppings?.reduce((acc, t) => {
    const key = t.name || "Unknown";
    if (!acc[key]) acc[key] = { count: 0, color: t.color };
    acc[key].count++;
    return acc;
  }, {});

  return (
    <div className="profile-card">
      <img src={r.image || "/placeholder-pizza.png"} alt="Pizza" loading="lazy" />
      <div className="profile-card-info">
        <div className="profile-card-autor">{r.author || r.name || "Sem nome"}</div>
        <div className="profile-card-pizzainfo">{r.baseType} — {r.baseSize} cm</div>
        <TagsRow grouped={grouped} />
      </div>
      <div className="profile-card-btns" style={{ top: 10 }}>
        <button onClick={() => downloadRecipeAsReceipt(r)}>
          <img src="/icons/Receita.svg" alt="receita" />
        </button>
        {onAction && (
          <button onClick={() => onAction(r.id)}>
            {actionIcon || "🗑️"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function Profile({
  user,
  feed,
  bookmarks,
  onToggleBookmark,
  onDeletePublished,
}) {
  const [localRecipes, setLocalRecipes] = useState([]);
  const [activeTab, setActiveTab] = useState("guardadas");

  useEffect(() => {
    const loadRecipes = () => {
      const stored = JSON.parse(localStorage.getItem("userRecipes") || "[]");
      const mine = stored.filter((r) => r.userId === (user?.uid || user?.id));
      setLocalRecipes(mine);
    };
    loadRecipes();
    window.addEventListener("storage", loadRecipes);
    return () => window.removeEventListener("storage", loadRecipes);
  }, [user]);

  const handleLogout = async () => {
    try { await logout(); } catch (err) { console.error("Erro no Logout:", err); }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: "O meu perfil", text: "vem ver o meu perfil!", url });
    } else {
      navigator.clipboard.writeText(url);
      alert("Link do perfil copiado!");
    }
  };

  const handleDeleteRecipe = (id) => {
    const stored = JSON.parse(localStorage.getItem("userRecipes") || "[]");
    const updated = stored.filter((r) => r.id !== id);
    localStorage.setItem("userRecipes", JSON.stringify(updated));
    setLocalRecipes(updated.filter((r) => r.userId === (user?.uid || user?.id)));
  };

  const userRecipes       = feed.filter((p) => p.userId === user?.uid);
  const bookmarkedRecipes = feed.filter((item) => bookmarks.includes(item.id));

  const activeList =
    activeTab === "guardadas"    ? localRecipes :
    activeTab === "publicadas" ? userRecipes  :   // ✅ was "published"
    bookmarkedRecipes;

  const getAction = (tab) => {
    if (tab === "guardadas")    return handleDeleteRecipe;
    if (tab === "publicadas") return onDeletePublished;
    if (tab === "favoritas")  return onToggleBookmark;
    return null;
  };

  return (
    <section className="profile-panel">
      {/* PROFILE HEADER */}
      <div className="profile-main">
        <div className="profile-stats">
          <img className="profile-avatar" src={user?.photoURL || "/default-avatar.png"} alt="Profile" />
          <div>
            <div style={{ fontSize: 18, fontWeight: "bold" }}>{user?.displayName || "User"}</div>
            <div style={{ fontSize: 13, color: "#aaa" }}>
              {localRecipes.length} Guardadas · {userRecipes.length} Publicadas · {bookmarkedRecipes.length} Favoritas
            </div>
          </div>
        </div>
        <div className="profile-btns">
          <button className="profile-handles" onClick={handleShare}><img src="/icons/Share.svg" alt="share" />Partilhar</button>
          <button className="profile-handles" onClick={handleLogout}><img src="/icons/logout.svg" alt="logout" />Logout</button>
        </div>
      </div>

      {/* TABS */}
      <div className="profile-tabs">
        {[
          { key: "guardadas",    label: "Guardadas" },
          { key: "publicadas", label: "Publicadas" },
          { key: "favoritas",  label: "Favoritas" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1, padding: "8px 12px", borderRadius: 999,
              border: "none", cursor: "pointer",
              background: activeTab === tab.key ? "#fff" : "transparent",
              color:      activeTab === tab.key ? "#000" : "#aaa",
              fontWeight: 500,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* CARDS GRID */}
      {activeList.length === 0 ? (
        <p>Nenhuma receita disponível.</p>
      ) : (
        <div className="profile-grid">
          {activeList.map((r) => (
            <RecipeCard
              key={r.id}
              r={r}
              onAction={getAction(activeTab)}
              actionIcon={<img src="/icons/Trash-white.svg" alt="delete" />}
            />
          ))}
        </div>
      )}
    </section>
  );
}