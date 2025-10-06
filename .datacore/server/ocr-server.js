# .datacore/server/ocr-server.py
import cv2
import pytesseract
import numpy as np
import uvicorn
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
import io

app = FastAPI()

@app.post("/ocr")
async def process_ocr(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        np_arr = np.frombuffer(contents, np.uint8)
        original_image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if original_image is None:
            return JSONResponse(status_code=400, content={"error": "Could not decode image."})

        gray = cv2.cvtColor(original_image, cv2.COLOR_BGR2GRAY)
        _, binary = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY_INV)
        contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        results = []
        for contour in contours:
            x, y, w, h = cv2.boundingRect(contour)
            if w > 10 and h > 10:
                roi = gray[y:y+h, x:x+w]
                text = pytesseract.image_to_string(roi, config='--psm 6').strip()
                if text:
                    results.append({"box": [x, y, w, h], "text": text})
        return JSONResponse(status_code=200, content={"results": results})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/")
def read_root():
    return {"status": "OCR Server Online"}

if __name__ == "__main__":
    # Listen on port 8000 by default. The component will handle conflicts.
    uvicorn.run(app, host="127.0.0.1", port=8000)