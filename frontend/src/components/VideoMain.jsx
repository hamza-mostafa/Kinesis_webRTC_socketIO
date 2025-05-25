import React from "react";
export default function VideoMain({ stream }) {
  const videoRef = React.useRef();
  React.useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);
  return <video ref={videoRef} autoPlay playsInline className="h-5/6 rounded-xl shadow-lg" />;
}
