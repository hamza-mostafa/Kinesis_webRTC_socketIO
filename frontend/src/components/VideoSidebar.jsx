import React from "react";
export default function VideoSidebar({ stream }) {
  const videoRef = React.useRef();
  React.useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);
  return <video ref={videoRef} autoPlay muted playsInline className="h-20 rounded-md" />;
}
