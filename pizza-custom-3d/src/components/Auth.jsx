import React, { useEffect, useState } from "react";
import { auth, signInWithGoogle, logout } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function Auth({ user, setUser }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, [setUser]);

  if (loading) return <p style={{ color: "white", padding: 10 }}>Loading...</p>;

  return (
    <div style={{ padding: 10, color: "white" }}>
      {user ? (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <img
              src={user.photoURL}
              alt="avatar"
              style={{ width: 40, height: 40, borderRadius: "50%" }}
            />
            <span>Hi, {user.displayName} 👋</span>
          </div>
          <button
            onClick={logout}
            style={{
              marginTop: 10,
              padding: "6px 12px",
              background: "#333",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </>
      ) : (
        <button
          onClick={signInWithGoogle}
          style={{
            padding: "8px 14px",
            background: "#4285F4",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          Sign in with Google
        </button>
      )}
    </div>
  );
}
