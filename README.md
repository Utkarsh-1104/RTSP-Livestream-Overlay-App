
# Livestream Overlay — User Documentation

This guide will help you set up and use the RTSP Overlay Management Application.  
The app allows you to **stream live video via RTSP**, add **custom overlays** (text, logos, etc.), and **save or manage** them easily.

---

## 🛠️ Setup Instructions

### 1. Clone or Download the Project
Clone the repository using Git:
```bash
https://github.com/Utkarsh-1104/RTSP-Livestream-Overlay-App.git

cd livestream-app
```
Or download the ZIP and extract it manually.
### 2. Install Dependencies
#### Frontend (React + Vite)
```bash
cd frontend
npm install
```

#### **Backend (Python + Flask)**

Create a virtual environment and install dependencies:
```bash
cd server
python -m venv venv
source venv/bin/activate   # For macOS/Linux
venv\Scripts\activate      # For Windows

pip install -r requirements.txt
```

### 3. Install FFmpeg (Required for RTSP Streaming)

FFmpeg must be installed and accessible on the server or local machine running the Flask app.

#### **For Windows**

1.  Download FFmpeg from: [https://ffmpeg.org/download.html](https://ffmpeg.org/download.html)
    
2.  Extract the ZIP.
    
3.  Add the `bin` folder path (e.g., `C:\ffmpeg\bin`) to your **System Environment Variables → PATH**.
    

#### **For macOS**

```bash
brew install ffmpeg
``` 

#### **For Ubuntu/Debian**

```bash
sudo apt update
sudo apt install ffmpeg
``` 

To verify installation:

```bash
ffmpeg -version
```


### 4. Create Environment Files
Backend
```bash
MONGO_URI="your_mongodb_connection_string"
DB_NAME="db_name_here"
```

### 5. Run the App

#### Start Backend

```
cd backend
python app.py
``` 

#### Start Frontend
```
cd frontend
npm run dev 
```
Then open your browser and go to:  
**[http://localhost:5173](http://localhost:5173)**

## 📺 Using the App

### 1. Enter Your RTSP URL

-   In the main interface, locate the **RTSP URL input field**.
    
-   Example URL:
    
    `rtsp://rtspstream:u-5Ddb6ZzMXbfbVpuCKFB@zephyr.rtsp.stream/movie` 
    
-   Click **Connect** to begin streaming the live feed.
    

Once connected, you should see the livestream displayed in real time.

----------

### 2. Add Overlays

You can add various overlay elements:

-   📝 **Text Overlays** — for labels, names, or info
    
-   🖼️ **Image Overlays** — for logos or watermarks
    

    

Each overlay is draggable, resizable, and customizable.

----------

### 3. Save Overlays

When your layout looks good:

-   Click **“Save Overlays”**
    
-   Enter a name (like “Studio Layout” or “Morning Setup”)
    
-   Click **Save**
    

This sends your overlay configuration to the Flask backend (`POST /api/createoverlays`) and stores it in MongoDB.

----------

### 4. Load Saved Overlays

-   Click **“Load Saved Overlays”**
    
-   Choose from the list of saved layouts
    
-   Click to instantly load overlays onto the video
    

----------

### 5. Update Overlays

-   Modify any existing overlays (move, resize, or add image/text)
    
-   Click **Update**
    
-   The Flask API (`PATCH /api/updateoverlays/:id`) updates only the overlays array in the database.
    

----------

### 6. Delete Overlays

-   Click **Delete** next to the overlay set name
    
-   Confirm the deletion
    
-   The layout is permanently removed from MongoDB (`DELETE /api/deleteoverlays/:id`)

## 🧰 Example Workflow

1.  Enter RTSP URL → Click **Connect**
    
2.  Add or adjust overlays on the video
    
3.  Click **Save Overlays** → `POST /api/createoverlays`
    
4.  Later, click **Load Overlays** → `GET /api/getoverlays`
    
5.  Make edits → **Update** → `PATCH /api/updateoverlays/:id`
    
6.  Delete unused layouts → `DELETE /api/deleteoverlays/:id`
    

## 🧑‍💻 Tech Stack

-   **Frontend:** React + Vite + Tailwind CSS
    
-   **Backend:** Python + Flask
    
-   **Database:** MongoDB (via PyMongo)
    
-   **Streaming:** RTSP (via ffmpeg)
