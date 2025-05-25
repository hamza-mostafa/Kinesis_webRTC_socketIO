import React, { useRef } from "react";
import axios from "axios";


export default function Login({ onLogin }) {
  const uidRef = useRef(),
    tagsRef = useRef();
  const submit = async () => {
    const uid = uidRef.current.value || crypto.randomUUID();
    const tags = tagsRef.current.value.split(",").map((t) => t.trim());
    await axios.post("/login", { uid, tags });
    onLogin({ token: uid, tags });
  };
  return (
    <div
      style={{
        maxWidth: 300,
        margin: "10vh auto",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <h2>SpdCon Login</h2>
      <input
        ref={uidRef}
        placeholder="uid simulate mock login"
        onKeyDown={(e) => e.key === "Enter" && submit()}
      />
      <input
        ref={tagsRef}
        placeholder="tags eg: ai,books,bags"
        onKeyDown={(e) => e.key === "Enter" && submit()}
      />
      <button onClick={submit}>Go</button>
    </div>
  );
}
