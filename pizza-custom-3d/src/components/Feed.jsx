import React from "react";
import { saveRecipeToUser } from "../utils/storage";

/*
  Simple feed panel. The feed is stored/managed by App.
  Clicking "Save" will add recipe to the logged user's saved recipes (if user provided).
*/

export default function Feed({ feed = [], onSave }) {
  if (!feed) return null;
  return (
    <aside className="feed-panel">
      <h3>Feed (local)</h3>
      {feed.length === 0 ? (
        <div style={{ marginTop: 8, color: "#999" }}>
          No posts yet — publish a pizza.
        </div>
      ) : null}

      <ul>
        {feed.map((item) => (
          <li key={item.id} className="feed-item">
            <div style={{ fontWeight: 600 }}>{item.author || "anon"}</div>
            <div style={{ fontSize: 12, color: "#bbb" }}>
              {item.baseType} — {item.baseSize} cm
            </div>
            <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
              <button onClick={() => onSave && onSave(item)}>Republish</button>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}
