import { useState } from "react";

const OverlayLoader = ({ onApplyOverlays }) => {
  const [overlaySets, setOverlaySets] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadOverlaySets = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:5000/api/getoverlays");
      if (!res.ok) throw new Error("Failed to fetch overlays");
      const data = await res.json();
      setOverlaySets(data);
    } catch (err) {
      console.error(err);
      alert("Error loading overlays");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOverlay = async (overlayId) => {
    const confirmed = window.confirm("Are you sure you want to delete this overlay?");
    if (!confirmed) return;

    try {
      const response = await fetch(`http://localhost:5000/api/deleteoverlay/${overlayId}`, {
          method: "DELETE"
      });

      if (!response.ok) throw new Error("Failed to delete overlay");

      alert("Overlay deleted successfully");
      window.location.reload();
        
    } catch (err) {
      console.error("Delete error:", err);
      alert("Error deleting overlay");
    }
  };

  return (
    <div className="p-4 border border-gray-200 my-8 rounded-xl shadow">
      <button
        onClick={loadOverlaySets}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Loading..." : "Load Saved Overlays"}
      </button>

      {overlaySets.length > 0 && (
        <div className="mt-4 flex flex-col gap-2">
          {overlaySets.map((set) => (
            <div key={set._id} className="flex justify-between items-center">
              <button
                onClick={() => onApplyOverlays(set)}
                className="text-left bg-white text-black border rounded px-3 py-2 hover:bg-blue-50 transition"
              >
                {set.overlay_name || "Unnamed Overlay Set"}
              </button>
              <button
                onClick={() => handleDeleteOverlay(set._id)}
                className="text-left bg-red-600 text-white border rounded px-3 py-2 hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OverlayLoader;
