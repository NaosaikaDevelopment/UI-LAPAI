import io
import mss
import mss.tools
from fastapi.responses import FileResponse, StreamingResponse
from datetime import datetime
from openai import OpenAI
from datetime import datetime
import base64
LEMONADE_BASE_URL = "http://localhost:8000/api/v1"
LEMONADE_API_KEY = "lemonade"
client = OpenAI(base_url=LEMONADE_BASE_URL, api_key=LEMONADE_API_KEY)

import mss
import numpy as np
from PIL import Image
from fastapi import FastAPI
from pydantic import BaseModel
import uvicorn
import subprocess
app = FastAPI()

#Function
clss = ["lemonade-server","status"]
hasil = subprocess.run(clss, capture_output=True, text=True, shell=True)
if "Server is not running" in hasil.stdout:
    print("error; server Offline, start automatic!")
    condition = False
    asls = r"..\bin\lemonade_server.vbs"
    subprocess.run(asls, shell=True)



def take_screenshot_and_save():
    with mss.mss() as sct:
        monitor = sct.monitors[1]  # layar utama
        screenshot = sct.grab(monitor)

        # Buat nama file unik
        filename = f"screenshot_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"

        # Simpan langsung ke file PNG
        mss.tools.to_png(screenshot.rgb, screenshot.size, output=filename)

    return filename  # langsung return lokasi file


def prosscessing():
    file_path = take_screenshot_and_save()
    with open(file_path, "rb") as f:
        img_base64 = base64.b64encode(f.read()).decode("utf-8")
    resp = client.chat.completions.create(
        model="Gemma-3-4b-it-GGUF",
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "describe this image"},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/png;base64,{img_base64}"
                        }
                    }
                ]
            }
        ],
        max_tokens = 150
    )
    return resp.choices[0].message.content

# Model untuk menerima data dari frontend
class InputData(BaseModel):
    flag: bool

@app.post("/process")
def process_data(data: InputData):
    if data.flag:
        return prosscessing()

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=2182)