import React, { useRef } from "react";
export default function ChatPanel({ messages, onSend }) {
  const inp = useRef();
  const send = (e) => {
    e.preventDefault();
    if (inp.current.value.trim()) {
      onSend(inp.current.value);
      inp.current.value = "";
    }
  };
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto mb-2">
      {messages.map((m, i) => (
          <div key={i}>
            <b>{m.from === token ? "me" : m.from}:</b> {m.msg}
          </div>
        ))}
      </div>
      <form onSubmit={send} className="flex gap-2">
        <input ref={inp} className="flex-1 border rounded p-1" placeholder="Type..." />
        <button className="px-3 py-1 bg-blue-500 text-white rounded">Send</button>
      </form>
    </div>
  );
}
