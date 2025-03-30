import asyncio
import os
import shutil
import cv2
import numpy as np
from fastapi import FastAPI, File, UploadFile
from fastapi.staticfiles import StaticFiles
from concurrent.futures import ThreadPoolExecutor
from tempfile import NamedTemporaryFile
from typing import List
from ultralytics import YOLO

app = FastAPI()
app.mount("/media", StaticFiles(directory="processed_media"), name="media")

model_firesmoke = YOLO("firesmoke.pt")
model_gun = YOLO("gunonly.pt")
model_total = YOLO("total.pt")

executor = ThreadPoolExecutor(max_workers=4)  # МНОГОПОТОЧНОСТЬ


# ПРОЦЕССИНГ МОДЕЛЯМИ
def process_frame(frame):
    results1 = model_firesmoke(frame)
    frame1 = results1[0].plot()

    results2 = model_gun(frame1)
    frame2 = results2[0].plot()

    results3 = model_total(frame2)
    final_frame = results3[0].plot()

    return final_frame


# ВИДОСЫ
def process_video(video_path: str, output_path: str):
    cap = cv2.VideoCapture(video_path)
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    out = cv2.VideoWriter(output_path, fourcc, cap.get(cv2.CAP_PROP_FPS),
                          (int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))))

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        processed_frame = process_frame(frame)
        out.write(processed_frame)

    cap.release()
    out.release()
    os.remove(video_path)


# ФОТКИ
async def process_image(image_path: str, output_path: str):
    frame = cv2.imread(image_path)
    processed_frame = process_frame(frame)
    cv2.imwrite(output_path, processed_frame)
    os.remove(image_path)


# ЗАПРОС
@app.post("/predict/media/")
async def predict_media(files: List[UploadFile] = File(...)):
    os.makedirs("processed_media", exist_ok=True)
    loop = asyncio.get_event_loop()

    video_tasks = []
    image_tasks = []
    media_urls = []

    for file in files:
        temp = NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[-1])
        shutil.copyfileobj(file.file, temp)
        temp.close()

        output_path = os.path.join("processed_media", f"processed_{file.filename}")

        if file.content_type.startswith("video"):  # ПОТОК
            task = loop.run_in_executor(executor, process_video, temp.name, output_path)
            video_tasks.append(task)

        elif file.content_type.startswith("image"):
            task = process_image(temp.name, output_path)
            image_tasks.append(task)

        media_urls.append({
            "filename": file.filename,
            "url": f"http://localhost:8000/media/processed_{file.filename}"
        })

    await asyncio.gather(*image_tasks)
    await asyncio.gather(*video_tasks)

    return media_urls
