import { useState, useRef, useEffect, use } from "react";
import Hls from "hls.js";
import { Rnd } from "react-rnd";


function uid() {
  return (crypto && crypto.randomUUID && crypto.randomUUID()) || Math.random().toString(36).slice(2, 9);
}

function LiveStreamPlayer({ loadedOverlays }) {
    const [rtspUrl, setRtspUrl] = useState("");
    const [streamId, setStreamId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [overlays, setOverlays] = useState([]);
    const [newText, setNewText] = useState("");
    const [newImageUrl, setNewImageUrl] = useState("");
    const [overlayName, setOverlayName] = useState("");
    const [loadedOverlaysSet, setLoadedOverlaysSet] = useState(null);
    const [loadedOverlaysFromDB, setLoadedOverlaysFromDB] = useState([]);
    const [loadedOverlaysId, setLoadedOverlaysId] = useState(null);
    const [isOverlayUpdated, setIsOverlayUpdated] = useState(false);

    const videoRef = useRef(null);
    const hlsRef = useRef(null);

    useEffect(() => {
        setLoadedOverlaysSet(loadedOverlays);
    }, [loadedOverlays]);

    useEffect(() => {
        setLoadedOverlaysFromDB(loadedOverlaysSet ? loadedOverlaysSet.overlays : []);
        setLoadedOverlaysId(loadedOverlaysSet ? loadedOverlaysSet._id : null);
    }, [loadedOverlaysSet]);

    const activeOverlays = loadedOverlaysFromDB.length > 0 ? loadedOverlaysFromDB : overlays;

    async function handleStartStream() {
        if (!rtspUrl.trim()) {
        setError("Please enter a valid RTSP URL.");
        return;
        }

        setError("");
        setLoading(true);

        try {
        const res = await fetch("http://127.0.0.1:5000/api/convert", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rtsp_url: rtspUrl }),
        });

        if (!res.ok) throw new Error("Failed to start stream.");

        const data = await res.json();
        setStreamId(data.stream_id);
        const hlsUrl = `http://127.0.0.1:5000/api/streams/${data.stream_id}/index.m3u8`;

        await waitForHLS(hlsUrl);
        playStream(hlsUrl);
        } catch (err) {
        console.error(err);
        setError("Error starting stream. Check your backend or RTSP link.");
        } finally {
        setLoading(false);
        }
    }

    async function waitForHLS(hlsUrl) {
        let ready = false;
        while (!ready) {
        const res = await fetch(hlsUrl, { method: "HEAD" });
        if (res.ok) ready = true;
        else await new Promise((r) => setTimeout(r, 3000));
        }
    }

    function playStream(hlsUrl) {
        if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(hlsUrl);
        hls.attachMedia(videoRef.current);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
            videoRef.current.play();
        });
        } else if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
        videoRef.current.src = hlsUrl;
        videoRef.current.play();
        }
    }

    async function handleStopStream() {
        if (!streamId) return;

        try {
            const res = await fetch(`http://localhost:5000/api/stop/${streamId}`, { method: "POST" });
            const result = await res.json();
            alert(result.message);
        } catch (err) {
            console.error("Error stopping stream:", err);
        } finally {
            if (hlsRef.current) {
                try {
                    hlsRef.current.destroy();
                } catch {}
                hlsRef.current = null;
            }
            if (videoRef.current) {
                videoRef.current.pause();
                videoRef.current.removeAttribute("src");
                videoRef.current.load();
            }
            setStreamId(null);
            window.location.reload();
        }
    }

    function addTextOverlay() {
        if (!newText.trim()) return setError("Overlay text cannot be empty.");
        const o = {
            id: uid(),
            type: "text",
            content: newText,
            x: 20,
            y: 20,
            width: 160,
            height: 50,
            fontSize: 20,
            color: "#ffffff",
        };
        if (activeOverlays === loadedOverlaysFromDB) {
            setLoadedOverlaysFromDB((s) => [...s, o]);
        } else {
            setOverlays((s) => [...s, o]);
        }
        setNewText("");
    }

    function addImageOverlay() {
        if (!newImageUrl.trim()) return setError("Image URL cannot be empty.");
        const o = {
            id: uid(),
            type: "image",
            content: newImageUrl,
            x: 20,
            y: 20,
            width: 120,
            height: 80,
        };
        if (activeOverlays === loadedOverlaysFromDB) {
            setLoadedOverlaysFromDB((s) => [...s, o]);
        } else {
            setOverlays((s) => [...s, o]);
        }
        setNewImageUrl("");
    }

    function updateOverlay(id, patch) {
        if (activeOverlays === loadedOverlaysFromDB) {
            setLoadedOverlaysFromDB((s) => s.map((o) => (o.id === id ? { ...o, ...patch } : o)));
            setIsOverlayUpdated(true);
            console.log(loadedOverlaysFromDB)
        } else {
            setOverlays((s) => s.map((o) => (o.id === id ? { ...o, ...patch } : o)));
        }
    }

    function removeOverlay(id) {
        if (activeOverlays === loadedOverlaysFromDB) {
            setLoadedOverlaysFromDB((s) => s.filter((o) => o.id !== id));
        } else {
            setOverlays((s) => s.filter((o) => o.id !== id));
        }
    }

    async function saveOverlays() {
        try {
            const res = await fetch(`http://localhost:5000/api/createoverlays`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ overlayName, overlays }),
            });
            const result = await res.json();
            console.log(result);
            alert("Overlay created successfully!");
        } catch (err) {
            console.error("Error saving overlays:", err);
            alert("Error saving overlays. Check console.");
        }
    }

    const handleUpdateOverlay = async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/updateoverlay/${loadedOverlaysId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ overlays: loadedOverlaysFromDB }),
            });

            if (!response.ok) {
                throw new Error("Failed to update overlay");
            }

            const data = await response.json();
            console.log("Overlay updated:", data.message);
            alert("Overlay updated successfully!");
        } catch (error) {
            console.error("Error updating overlay:", error);
            alert("Error updating overlay. Check console.");
        }
    };


    useEffect(() => {
        return () => {
            if (hlsRef.current) {
                try {
                hlsRef.current.destroy();
                } catch {}
            }
        };
    }, []);

    return (
        <div className="flex items-center justify-center">
            <div className="text-center mt-8 flex flex-col items-center gap-4">
                <h2 className="text-4xl font-bold">Live Stream Player</h2>

                <input
                    type="text"
                    placeholder="Enter RTSP URL..."
                    value={rtspUrl}
                    onChange={(e) => setRtspUrl(e.target.value)}
                    className="border border-gray-300 p-2 w-3/5 rounded"
                    style={{ width: "60%", padding: 8, borderRadius: 6, border: "1px solid #ccc" }}
                />

                <div>
                    <button onClick={handleStartStream} disabled={loading || streamId} className="ml-4 py-2.5 px-5 text-white rounded-lg hover:cursor-pointer bg-[#007BFF] hover:bg-[#003064] disabled:opacity-50">
                        {loading ? "Starting..." : "Start Stream"}
                    </button>

                    {streamId && (
                        <button onClick={handleStopStream} className="ml-4 py-2.5 px-5 text-white rounded-lg hover:cursor-pointer bg-[#dc3545] hover:bg-[#980d1b] disabled:opacity-50"> Stop Stream </button>
                    )}
                </div>

                {error && <p style={{ color: "red", marginTop: "1rem" }}>{error}</p>}
                {loading && (
                    <div style={{
                            border: "6px solid #f3f3f3",
                            borderTop: "6px solid #007BFF",
                            borderRadius: "50%",
                            width: "40px",
                            height: "40px",
                            animation: "spin 1s linear infinite"
                        }}
                    ></div>
                )}
                <style>
                    {`
                    @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                    }
                    `}
                </style>

                <div className="my-4 flex gap-2 items-center">
                    <input type="text" placeholder="Overlay text..." value={newText} onChange={(e) => setNewText(e.target.value)} className="p-2 border border-gray-300 rounded" />

                    <button onClick={addTextOverlay} className="p-2 border border-gray-300 rounded cursor-pointer"> Add Text Overlay </button>

                    <input type="text" placeholder="Image URL..." value={newImageUrl} onChange={(e) => setNewImageUrl(e.target.value)} className="p-2 border w-80 border-gray-300 rounded ml-3" />

                    <button onClick={addImageOverlay} className="p-2 border border-gray-300 rounded ml-3 cursor-pointer"> Add Image Overlay </button>

                    <div className="ml-auto text-gray-400">
                        {overlays.length} overlay{overlays.length !== 1 ? "s" : ""}
                    </div>
                </div>

                <div className="relative w-[640px] h-[360px] bg-black mb-4 overflow-hidden border rounded-lg border-white">
                    <video ref={videoRef} controls width="640" height="360" className="block z-10" />
                    
                    {activeOverlays.map((o) => (
                        <Rnd
                            key={o.id}
                            bounds="parent"
                            size={{ width: o.width, height: o.height }}
                            position={{ x: o.x, y: o.y }}
                            onDragStop={(e, d) => updateOverlay(o.id, { x: d.x, y: d.y })}
                            onResizeStop={(e, dir, ref, delta, pos) =>
                            updateOverlay(o.id, {
                                width: parseInt(ref.style.width || o.width, 10),
                                height: parseInt(ref.style.height || o.height, 10),
                                x: pos.x,
                                y: pos.y,
                            })
                            }
                            style={{
                                zIndex: 30,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                boxSizing: "border-box",
                                padding: 4,
                                background: o.type === "text" ? "rgba(0,0,0,0.45)" : "transparent",
                                color: o.type === "text" ? o.color || "#fff" : "inherit",
                                border: "1px dashed rgba(255,255,255,0.35)",
                                pointerEvents: "auto", 
                            }}
                            enableResizing
                        >
                            
                            <button onClick={() => removeOverlay(o.id)} title="Delete overlay" className="absolute -top-2 -right-2 z-50 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-700"
                            >
                            ×
                            </button>

                            {o.type === "text" ? (
                            <div className="py-1 px-1.5 text-lg text-center break-words">
                                {o.content}
                            </div>
                            ) : (
                            <img
                                src={o.content}
                                alt="overlay"
                                className="w-[100%] h-[100%] object-contain pointer-none: "
                                onError={(e) => {
                                e.currentTarget.style.opacity = 0.4;
                                }}
                            />
                            )}
                        </Rnd>
                    ))}
                </div>
                {overlays.length > 0 && (
                    <div className="flex items-center gap-6 justify-center">
                        <input type="text" value={overlayName} placeholder="Overlay Setting Name" className="p-2 border border-[#ccc] w-52" onChange={(e) => setOverlayName(e.target.value)} />
                        <button onClick={saveOverlays} className="bg-[#333333] p-4 rounded-2xl">Save Overlay</button>
                    </div>
                )}
                { isOverlayUpdated && (
                    <div>
                        <button onClick={handleUpdateOverlay} className="bg-[#333333] p-4 rounded-2xl">Update Overlays</button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default LiveStreamPlayer;
    