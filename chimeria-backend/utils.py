import aiofiles
import base64
import mimetypes
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

IMAGE_DIR = Path("/app/images")

async def save_image(image_bytes: bytes, user_id: str, filename: str) -> str:
    user_dir = IMAGE_DIR / user_id
    user_dir.mkdir(parents=True, exist_ok=True)
    
    file_extension = Path(filename).suffix
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    unique_filename = f"{timestamp}_{uuid.uuid4()}{file_extension}"
    
    image_path = user_dir / unique_filename
    
    async with aiofiles.open(image_path, 'wb') as f:
        await f.write(image_bytes)
    
    relative_path = f"{user_id}/{unique_filename}"
    return relative_path

async def image_to_data_url(image_path: str) -> Optional[str]:
    if not image_path:
        return None
    
    try:
        full_path = IMAGE_DIR / image_path
        if not full_path.exists():
            return None
        
        async with aiofiles.open(full_path, 'rb') as f:
            image_bytes = await f.read()
        
        mime_type, _ = mimetypes.guess_type(str(full_path))
        if not mime_type:
            return None
        
        base64_data = base64.b64encode(image_bytes).decode('utf-8')
        return f"data:{mime_type};base64,{base64_data}"
    except Exception:
        return None
