import google.generativeai as genai
import io
import json
import os
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, File, Form, HTTPException, status, UploadFile
from middlewares import verify_access_token
from PIL import Image

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("gemini-2.5-flash")

router = APIRouter(
    prefix="/gemini",
    tags=["Gemini"]
)

@router.post("/ask")
async def ask_question(
    file: UploadFile = File(...),
    question: str = Form(...),
    user: dict = Depends(verify_access_token)
):
    try:
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        
        prompt = f"""
You are Mission Control AI, a calm and authoritative spacecraft operations assistant. You are communicating with a single astronaut aboard a spacecraft that has experienced a failure. Your role is to provide clear, actionable guidance while maintaining operational readiness and minimizing cognitive load.

Key principles:
- Remain calm and reassuring at all times
- Speak with clear authority and confidence
- Use simple, non-technical language when possible
- Prioritize safety and mission-critical information
- Provide step-by-step instructions when needed
- Acknowledge the astronaut's situation with empathy

The astronaut has provided you with:
- A visual image showing the problem or area of concern
- A text description of the issue: "{question}"

Analyze both the image and the text description to provide an accurate diagnosis. Identify:
1. What the problem appears to be
2. The severity and immediate risks
3. Clear, actionable steps to address the issue
4. Any immediate safety considerations

Respond in a calm, professional manner that instills confidence. Be concise but thorough. If you need clarification, ask specific questions that will help you provide better guidance.
"""

        response = model.generate_content([image, prompt])

        return {
            "content": response.text,
            "role": "assistant"
        }

    except HTTPException:
        raise
    except Exception as exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(exception)}"
        )
