import { useState } from "react";
import LiveStreamPlayer from "./components/LiveStreamPlayer";
import OverlayLoader from "./components/OverlayLoader";

function App() {
  const [loadedOverlays, setLoadedOverlays] = useState();

  const handleApplyOverlays = (overlayArray) => {
    setLoadedOverlays(overlayArray);
  };

  return (
    <div className="flex flex-col items-center justify-center bg-[#262525] text-white h-screen">
      <LiveStreamPlayer loadedOverlays={loadedOverlays} />
      <OverlayLoader onApplyOverlays={handleApplyOverlays} />
    </div>
  );
}

export default App;
