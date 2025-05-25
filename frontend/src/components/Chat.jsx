import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import Countdown from "./Countdown.jsx";

export default function Chat({ token, tags }) {
  const [st, setSt] = useState("waiting");
  const [ttl, setTtl] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const inp = useRef();
  const sock = useRef();
  const localV = useRef();
  const remoteV = useRef();

  useEffect(() => {
    const s = io("http://0.0.0.0:4000", { auth: { token, tags } });
    sock.current = s;
    s.on("paired", async ({ sessionId, ttl }) => {
      setSt("paired");
      setTtl(ttl);
      await startRtc(s);
    });
    s.on("chat", (d) => setMsgs((m) => [...m, d]));
    s.on("session-ended", () => {
      setSt("waiting");
      setTtl(null);
      setMsgs([]);
    });
    return () => s.disconnect();
  }, []);

  const send = () => {
    const msg = inp.current.value;
    if (!msg) return;
    sock.current.emit("chat", { msg });
    inp.current.value = "";
  };

  async function startRtc(s) {
    const ice = await (await fetch("/webrtc-config")).json();
    const pc = new RTCPeerConnection(ice);
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));
    localV.current.srcObject = stream;
    pc.ontrack = (e) => (remoteV.current.srcObject = e.streams[0]);
    pc.onicecandidate = (e) => e.candidate && s.emit("ice", { candidate: e.candidate });
    s.on("ice", (d) => pc.addIceCandidate(new RTCIceCandidate(d.candidate)));
    s.on("sdp", async (d) => {
      await pc.setRemoteDescription(new RTCSessionDescription(d.sdp));
      if (d.sdp.type === "offer") {
        const ans = await pc.createAnswer();
        await pc.setLocalDescription(ans);
        s.emit("sdp", { sdp: ans });
      }
    });
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    s.emit("sdp", { sdp: offer });
  }

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      background: "#f9f9fa"
    }}>
      {/* 80% - Remote User Video */}
      <div style={{
        flex: 8,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#222"
      }}>
        <video
          ref={remoteV}
          autoPlay
          style={{
            width: "96%",
            height: "88vh",
            maxHeight: "800px",
            borderRadius: "16px",
            border: "3px solid #333",
            background: "#111"
          }}
        />
      </div>
      {/* 20% - Sidebar */}
      <div style={{
        flex: 2,
        display: "flex",
        flexDirection: "column",
        background: "#fff",
        borderLeft: "2px solid #eee",
        minWidth: 0
      }}>
        {/* My Video - 30% */}
        <div style={{
          flex: "0 0 30%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "12px",
          borderBottom: "1px solid #eee",
          background: "#fafafa"
        }}>
          <video
            ref={localV}
            autoPlay
            muted
            style={{
              width: "98%",
              maxHeight: "28vh",
              borderRadius: "10px",
              border: "1px solid #aaa",
              background: "#333"
            }}
          />
        </div>
        {/* Chat Details - 70% */}
        <div style={{
          flex: "1 1 0%",
          display: "flex",
          flexDirection: "column",
          height: 0,
          minHeight: 0,
          padding: "10px"
        }}>
          <div style={{
            marginBottom: 8,
            fontWeight: "bold",
            fontSize: 18,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <span>{st}</span>
            {ttl && <Countdown ms={ttl} />}
          </div>
          <div style={{
            flex: 1,
            overflow: "auto",
            border: "1px solid #ddd",
            borderRadius: "8px",
            padding: 8,
            background: "#f6f6f6",
            marginBottom: 6
          }}>
            {msgs.map((m, i) => (
              <div key={i} style={{
                marginBottom: 4,
                color: m.from === token ? "#005b4f" : "#222"
              }}>
                <b>{m.from === token ? "me" : m.from}:</b> {m.msg}
              </div>
            ))}
          </div>
          <div style={{
            display: "flex",
            gap: 4
          }}>
            <input
              ref={inp}
              style={{
                flex: 1,
                padding: "8px 12px",
                border: "1px solid #ccc",
                borderRadius: "6px"
              }}
              onKeyDown={e => e.key === "Enter" && send()}
              placeholder="Type a message..."
            />
            <button onClick={send} style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: "none",
              background: "#004875",
              color: "#fff"
            }}>
              ➤
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}