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
    <div  className="auth-container"  >
      {user ? (
        <>
         {/*
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <img
        src={user.photoURL || "https://via.placeholder.com/40"}
        alt="avatar"
        style={{ width: 40, height: 40, borderRadius: "50%" }}
      />
      <span>Hi, {user.displayName} 👋</span>
    </div>

    <button onClick={() => logout()}>
      Logout
    </button>
    */}
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
