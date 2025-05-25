import VideoMain from "./VideoMain.jsx";
import VideoSidebar from "./VideoSidebar.jsx";
import ChatPanel from "./ChatPanel.jsx";

export default function MainLayout(props) {
  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <div style={{ flex: 4, display: "flex", flexDirection: "column" }}>
        <VideoMain {...props} />
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", borderLeft: "1px solid #eee" }}>
        <VideoSidebar {...props} />
        <div style={{ flex: 1 }}>
        <ChatPanel msgs={msgs} send={send} token={token} />
        </div>
      </div>
    </div>
  );
}