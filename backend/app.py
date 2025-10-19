from time import time
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from pymongo import MongoClient
import os
import subprocess
import uuid
import shutil
import sys
from dotenv import load_dotenv
from bson import ObjectId

def serialize_doc(doc):
    doc["_id"] = str(doc["_id"])
    return doc


load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

client = MongoClient(os.getenv("MONGO_URI"))
db = client[os.getenv("DB_NAME")]
overlays_collection = db["overlays"]

OUTPUT_DIR = "streams"
os.makedirs(OUTPUT_DIR, exist_ok=True)


processes = {}
 

@app.route("/api/convert", methods=["POST"])
def convert_rtsp():
    """
    Takes RTSP URL from user and converts to HLS (.m3u8)
    """
    data = request.get_json()
    rtsp_url = data.get("rtsp_url")

    if not rtsp_url:
        return jsonify({"error": "RTSP URL is required"}), 400

    # Unique stream ID
    stream_id = str(uuid.uuid4())
    stream_path = os.path.join(OUTPUT_DIR, stream_id)
    os.makedirs(stream_path, exist_ok=True)

    # Output HLS file path
    output_file = os.path.join(stream_path, "index.m3u8")

    # FFmpeg command to convert RTSP → HLS
    command = [
        "ffmpeg",
        "-rtsp_transport", "tcp",
        "-i", rtsp_url,
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-tune", "zerolatency",
        "-c:a", "aac",
        "-f", "hls",
        "-hls_time", "4",
        "-hls_list_size", "5",
        "-hls_flags", "delete_segments+append_list",
        output_file
    ]


    # Start ffmpeg process (cross-platform compatible)
    log_file = os.path.join(stream_path, "ffmpeg.log")
    with open(log_file, "w") as f:
        if sys.platform == "win32":
            proc = subprocess.Popen(
                command,
                stdout=f,
                stderr=f, 
                creationflags=subprocess.CREATE_NEW_PROCESS_GROUP
            )
        else:
            proc = subprocess.Popen(
                command,
                stdout=f,
                stderr=f,
                preexec_fn=os.setsid
            )
 
 
    processes[stream_id] = proc

    stream_url = f"http://127.0.0.1:5000/streams/{stream_id}/index.m3u8"
    return jsonify({"message": "Stream started", "stream_id": stream_id, "stream_url": stream_url}), 200


@app.route("/api/streams/<stream_id>/<path:filename>")
def serve_stream(stream_id, filename):
    """Serve the generated HLS stream files"""
    return send_from_directory(os.path.join(OUTPUT_DIR, stream_id), filename)


@app.route('/api/stop/<stream_id>', methods=['POST'])
def stop_stream(stream_id):
    if not stream_id or stream_id not in processes:
        return jsonify({'error': 'Invalid or unknown stream_id'}), 400

    process = processes[stream_id]

    try:
        process.terminate()
        process.wait(timeout=5) 
    except Exception as e:
        print(f"Error stopping process: {e}")
 
    processes.pop(stream_id, None) 

    folder_path = os.path.join('streams', stream_id)
    try:
        time.sleep(1)
        if os.path.exists(folder_path):
            shutil.rmtree(folder_path, ignore_errors=True)
    except Exception as e:
        print(f"Error deleting folder: {e}")

    return jsonify({'message': f'Stream {stream_id} stopped successfully'})



def serialize_overlay(doc):
    doc["_id"] = str(doc["_id"])
    return doc


@app.route("/api/createoverlays", methods=["POST"])
def create_overlay_set():
    data = request.get_json()
    overlays = data.get("overlays", [])

    if not isinstance(overlays, list):
        return jsonify({"error": "Overlays must be a list"}), 400

    overlay_set = {
        "overlay_name": data.get("overlayName", "Untitled Overlay"),
        "overlays": overlays,
    }

    result = overlays_collection.insert_one(overlay_set)
    overlay_set["_id"] = str(result.inserted_id)
    return jsonify(overlay_set), 201


@app.route("/api/getoverlays", methods=["GET"])
def get_all_overlays():
    all_overlays = list(overlays_collection.find({}, {"overlay_name": 1, "overlays": 1}))
    for o in all_overlays:
        o["_id"] = str(o["_id"])
    return jsonify(all_overlays), 200



@app.route("/api/getoverlays/<overlay_id>", methods=["GET"])
def get_overlay(overlay_id):
    overlay = overlays_collection.find_one({"_id": ObjectId(overlay_id)})
    if not overlay:
        return jsonify({"error": "Overlay not found"}), 404
    return jsonify(serialize_overlay(overlay)), 200


@app.route("/api/updateoverlay/<overlay_id>", methods=["PATCH"])
def update_overlay(overlay_id):
    try:
        data = request.get_json()
        updated_overlays = data.get("overlays")

        if not updated_overlays:
            return jsonify({"error": "Missing overlays data"}), 400

        result = overlays_collection.update_one(
            {"_id": ObjectId(overlay_id)},
            {"$set": {"overlays": updated_overlays}}
        )

        if result.matched_count == 0:
            return jsonify({"error": "Overlay not found"}), 404

        return jsonify({"message": "Overlay updated successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500



@app.route("/api/deleteoverlay/<overlay_id>", methods=["DELETE"])
def delete_overlay(overlay_id):
    try:
        result = overlays_collection.delete_one({"_id": ObjectId(overlay_id)})

        if result.deleted_count == 0:
            return jsonify({"error": "Overlay not found"}), 404

        return jsonify({"message": "Overlay deleted successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500



if __name__ == "__main__":
    app.run(debug=True)
