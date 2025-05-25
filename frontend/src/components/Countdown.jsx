import React, { useEffect, useState } from "react";
export default function Countdown({ ms }) {
  const [t, setT] = useState(Math.ceil(ms / 1000));
  useEffect(() => {
    const id = setInterval(() => setT((x) => x - 1), 1000);
    return () => clearInterval(id);
  }, []);
  return <span>{t}s</span>;
}
