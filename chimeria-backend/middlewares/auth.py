import jwt
import os
from database import prisma
from dotenv import load_dotenv
from fastapi import HTTPException, Request, status

load_dotenv()

async def verify_access_token(request: Request) -> dict:
    authorization = request.headers.get("Authorization")
    token = None
    
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split("Bearer ")[1]
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access token not found in Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_secret = os.getenv("ACCESS_TOKEN_SECRET")
    
    if not access_token_secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Access token secret not configured"
        )
    
    try:
        payload = jwt.decode(
            token,
            access_token_secret,
            algorithms=["HS256"],
            options={"verify_exp": True}
        )
        
        if "id" not in payload or "email" not in payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        user = await prisma.user.find_unique(where={"id": payload["id"]})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return {
            "id": payload["id"],
            "email": payload["email"]
        }
    
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    except HTTPException:
        raise
    except Exception as exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(exception)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
