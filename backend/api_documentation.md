
# Livestream Overlay API Documentation

  

## Overview

This API allows you to **create, read, update, and delete overlays** used in the livestream application.

Each overlay document consists of an `overlay_name` and an array of overlay objects, each containing positional and styling details.

  

---

  

## Base URL

http://127.0.0.1:5000

---

  

## Endpoints

  

### 1. Create Overlays

**Endpoint:**

  POST /api/createovelays

**Description:**

Creates a new overlay set with a custom name and an array of overlay objects.

**Request Body (JSON):**

```json
{
	"overlay_name": "My Overlay Set",
	"overlays": [
		{
		      "color": "#ffffff",
		      "content": "Overlay 1",
		      "fontSize": 20,
		      "height": 93,
		      "id": "d5c63d78-fb53-48a6-b6a0-3c9ea5018e85",
		      "type": "text",
		      "width": 375,
		      "x": 232,
		      "y": 223
	    },
	    {
		      "color": "#ff0000",
		      "content": "Logo Overlay",
		      "fontSize": 16,
		      "height": 120,
		      "id": "4a3b2d1c-efa1-4b2f-94e8-c8d7c0f9f6d1",
		      "type": "image",
		      "width": 220,
		      "x": 100,
		      "y": 150
		}
]
}
```

**Response**
```json
{
  "message": "Overlay set created successfully"
}
```

### 2. Read All Overlays
**Endpoint:**

GET /api/getoverlays


**Description:**

Fetches all saved overlay sets from the database.  
Each document contains an `overlay_name` and an array of overlay objects.


**Response**
```json
[
  {
    "_id": "6719e245b2df3a77f73d9e5a",
    "overlay_name": "My Overlay Set",
    "overlays": [ ...array of overlays... ]
  },
  {
    "_id": "6719e251b2df3a77f73d9e5b",
    "overlay_name": "Camera Overlay",
    "overlays": [ ...array of overlays... ]
  }
]
```

### 3. Update Overlays
**Endpoint:**

PATCH /api/updateoverlays/<overlay_id>

**Description:**

Updates the array of overlays for a given overlay set.

**Request Body (JSON):**

```json
{
  "overlays": [
    {
      "color": "#00ff00",
      "content": "Updated Overlay",
      "fontSize": 22,
      "height": 95,
      "id": "d5c63d78-fb53-48a6-b6a0-3c9ea5018e85",
      "type": "text",
      "width": 380,
      "x": 240,
      "y": 230
    }
  ]
}

```

**Response**
```json
{
  "message": "Overlay updated successfully"
}

```

### 4. Delete Overlay
**Endpoint:**

DELETE /api/deleteoverlays/<overlay_id>


**Description:**

Deletes an overlay set from the database.

**Response**
```json
{
  "message": "Overlay deleted successfully"
}

```

# Overlay Object Schema

Each overlay in the `overlays` array follows this structure:

| Field | Type | Description |
| ------ | ------ | ------------ |
| `id` | String | Unique identifier for the overlay item |
| `type` | String | Type of overlay (e.g., `"text"`, `"image"`) |
| `content` | String | Text content or image URL |
| `x` | Number | X-coordinate position |
| `y` | Number | Y-coordinate position |
| `width` | Number | Width of the overlay |
| `height` | Number | Height of the overlay |
| `fontSize` | Number | Font size for text overlays |
| `color` | String | Text or element color in HEX format |


# Example Workflow

1. **User creates overlay(s)** on the client and clicks **“Save Overlays.”**  
   → `POST /api/createoverlays`

2. **User loads saved overlays** later by clicking **“Load Saved Overlays.”**  
   → `GET /api/getoverlays`

3. **User modifies an existing overlay** and saves again.  
   → `PATCH /api/updateoverlays/<id>`

4. **User deletes an overlay set permanently.**  
   → `DELETE /api/deleteoverlays/<id>`
