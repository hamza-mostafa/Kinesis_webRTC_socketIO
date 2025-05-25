import React, { useState } from "react";
import Login from "./components/Login.jsx";
import Chat from "./components/Chat.jsx";
export default function App() {
  const [s, setS] = useState(null);
  return s ? <Chat {...s} /> : <Login onLogin={setS} />;
}
