import cv2
import torch
import numpy as np
import base64
import time
from io import BytesIO
from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO

app = FastAPI()

model_firesmoke = YOLO("firesmoke.pt")
model_gun = YOLO("gunonly.pt")
model_total = YOLO("total.pt")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



class ConnectionManager:
    def __init__(self):
        self.active_connections = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            await connection.send_json(message)

manager = ConnectionManager()

@app.get("/", response_class=HTMLResponse) # ИМИТАЦИЯ КАМЕРЫ
def get_camera_page():
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>YOLOv8 Live</title>
    </head>
    <body>
        <h1>Live Stream</h1>
        <video id="video" autoplay playsinline></video>
        <canvas id="canvas"></canvas>
        <img id="output" />
        <script>
            const ws = new WebSocket("ws://" + location.host + "/ws");
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                console.log("Log:", data.log);
                document.getElementById("output").src = data.image;
            };

            const video = document.getElementById("video");
            const canvas = document.getElementById("canvas");
            const ctx = canvas.getContext("2d");

            navigator.mediaDevices.getUserMedia({ video: true })
                .then((stream) => {
                    video.srcObject = stream;
                });

            function sendFrame() {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                const data = canvas.toDataURL("image/jpeg");

                fetch("/detect", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ image: data })
                });

                requestAnimationFrame(sendFrame);
                setTimeout(sendFrame, 5);
            }

            video.onloadeddata = () => sendFrame();
        </script>
    </body>
    </html>
    """

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            print("WS активен")
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        print("Клиент отключился")

CONFIDENCE_THRESHOLDS = {
    "firesmoke": {
        "fire": 0.75,
        "smoke": 0.75
    },
    "gunonly": {
        "pistol": 0.75
    },
    "total": {
        "person": 0.75
    }
}

import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s") # логи


def process_detections(results, model, frame, model_type, custom_threshold=None):
    logging.info(f"Обработка детекций для {model_type}...")
    detected_objects = []
    thresholds = CONFIDENCE_THRESHOLDS.get(model_type, {})
    class_counts = {}
    max_confidences = {}

    start_time = time.time()

    for result in results:
        for box in result.boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            cls = int(box.cls[0])
            confidence = float(box.conf[0])
            label = model.names[cls].lower()

            min_confidence = custom_threshold if custom_threshold is not None else max(thresholds.get(label, 0.75),
                                                                                       0.75)

            if confidence >= min_confidence:
                class_counts[label] = class_counts.get(label, 0) + 1
                if label not in max_confidences or confidence > max_confidences[label]['confidence']:
                    max_confidences[label] = {
                        'bbox': [x1, y1, x2, y2],
                        'confidence': confidence
                    }

    for label, data in max_confidences.items():
        x1, y1, x2, y2 = data['bbox']
        conf = data['confidence']

        cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)

        text = f"{label} ({conf:.2f})"
        cv2.putText(frame, text, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

        detected_objects.append({
            "label": label,
            "confidence": conf,
            "bbox": [x1, y1, x2, y2],
            "count": class_counts.get(label, 0)
        })

        logging.info(f"Найден объект: {label} (conf: {conf:.2f}) в {x1, y1, x2, y2}")

    inference_time = time.time() - start_time
    logging.info(f"Обработка {model_type} заняла {inference_time:.2f} сек.")

    return detected_objects, frame, inference_time


@app.post("/detect")
async def detect_objects(request: Request):
    start_total = time.time()
    data = await request.json()
    image_data = data["image"].split(",")[1]

    image = np.frombuffer(base64.b64decode(image_data), dtype=np.uint8)
    frame = cv2.imdecode(image, cv2.IMREAD_COLOR)

    logging.info("Началась обработка кадра...")

    original_frame = frame.copy()

    results = model_firesmoke(frame)
    results2 = model_gun(frame)

    if results[0].boxes.shape[0] == 0 and results2[0].boxes.shape[0] == 0:
        logging.info("Объекты не найдены.")
        return JSONResponse(content={"image": None, "stats": {}})

    fire_objects, frame, fire_time = process_detections(results, model_firesmoke, frame, "firesmoke")
    gun_objects, frame, gun_time = process_detections(results2, model_gun, frame, "gunonly")

    total_time = fire_time + gun_time
    log_message = ""
    combined_objects = {}
    timestamp = int(time.time())

    all_objects = fire_objects + gun_objects
    for obj in all_objects:
        label = obj["label"].lower()
        conf = obj["confidence"]

        if (label == "pistol" or label == "pistol") and conf > 0.83:
            _, buffer = cv2.imencode(".jpg", frame)
            processed_image = base64.b64encode(buffer).decode("utf-8")
            image_base64 = f"data:image/jpeg;base64,{processed_image}"

            log_message = f"🔫 Pistol (conf: {conf:.2f}) ⏱ {total_time:.2f}s"

            logging.info(f"⚠️ СРОЧНАЯ ОТПРАВКА: {log_message}")

            await manager.broadcast({
                "log": log_message,
                "image": image_base64,
                "counts": {"pistol": 1},
                "timestamp": timestamp
            })
            return JSONResponse(content={
                "image": image_base64,
                "stats": {"processing_time": total_time, "counts": {"pistol": 1}, "timestamp": timestamp}
            })

        if conf > 0.80 and label in ["fire", "pistol"]:
            if label not in combined_objects or conf > combined_objects[label]["confidence"]:
                combined_objects[label] = obj

    logging.info(f"Объекты, подлежащие отправке: {combined_objects}")

    critical_objects = {} #PRE PROCESS ИСКЛЮЧАЕМ АУТЛАЕРЫ
    for label in ["fire", "pistol"]:
        if label in combined_objects and combined_objects[label]["confidence"] > 0.7:
            if label not in critical_objects or combined_objects[label]["confidence"] > critical_objects[label]["confidence"]:
                critical_objects[label] = combined_objects[label]

    if critical_objects:
        _, buffer = cv2.imencode(".jpg", frame)
        processed_image = base64.b64encode(buffer).decode("utf-8")
        image_base64 = f"data:image/jpeg;base64,{processed_image}"

        log_message = " | ".join(
            [f"{obj['label'].capitalize()} (conf: {obj['confidence']:.2f})" for obj in critical_objects.values()]
        )
        log_message = f"⏱ {total_time:.2f}s | {log_message}"

        logging.info(f"Отправка данных: {log_message}")

        await manager.broadcast({
            "log": log_message,
            "image": image_base64,
            "counts": {k: 1 for k in critical_objects},
            "timestamp": timestamp
        })

    return JSONResponse(content={
        "image": image_base64 if log_message else None,
        "stats": {
            "processing_time": total_time,
            "counts": {k: 1 for k in critical_objects},
            "timestamp": timestamp
        }
    })
