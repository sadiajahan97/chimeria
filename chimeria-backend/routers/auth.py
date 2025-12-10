import bcrypt
import jwt
import os
import uuid
from database import prisma
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from fastapi import APIRouter, Body, HTTPException, Request, Response, status
from pydantic import EmailStr

load_dotenv()

router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)

@router.get("/check")
async def check_auth(request: Request):
    try:
        refresh_token = request.cookies.get("refresh_token")
        
        if not refresh_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token not found"
            )
        
        refresh_token_secret = os.getenv("REFRESH_TOKEN_SECRET")
        if not refresh_token_secret:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Refresh token secret not configured"
            )
        
        try:
            payload = jwt.decode(
                refresh_token,
                refresh_token_secret,
                algorithms=["HS256"],
                options={"verify_exp": True}
            )
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token has expired"
            )
        except jwt.InvalidTokenError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        if "id" not in payload or "email" not in payload or "jti" not in payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token payload"
            )
        
        session = await prisma.session.find_unique(where={"jti": payload["jti"]})
        if not session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session not found"
            )
        
        response_data = {
            "authenticated": True,
            "user": {
                "id": payload["id"],
                "email": payload["email"]
            }
        }
        
        if not session.remember:
            access_token_secret = os.getenv("ACCESS_TOKEN_SECRET")
            if not access_token_secret:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Access token secret not configured"
                )
            
            access_expiration_time = datetime.now(timezone.utc) + timedelta(minutes=15)
            access_payload = {
                "id": payload["id"],
                "email": payload["email"],
                "exp": int(access_expiration_time.timestamp())
            }
            
            access_token = jwt.encode(
                access_payload,
                access_token_secret,
                algorithm="HS256"
            )
            
            response_data["accessToken"] = access_token
        
        return response_data
    
    except HTTPException:
        raise
    except Exception as exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(exception)}"
        )

@router.post("/sign-up", status_code=status.HTTP_201_CREATED)
async def sign_up(
    response: Response,
    email: EmailStr = Body(...),
    password: str = Body(...),
    name: str = Body(...)
):
    try:
        existing_user = await prisma.user.find_unique(where={"email": email})
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered"
            )
        
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        user = await prisma.user.create(
            data={
                "email": email,
                "hashedPassword": hashed_password,
                "name": name
            }
        )
        
        refresh_token_secret = os.getenv("REFRESH_TOKEN_SECRET")
        access_token_secret = os.getenv("ACCESS_TOKEN_SECRET")
        
        if not refresh_token_secret:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Refresh token secret not configured"
            )
        if not access_token_secret:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Access token secret not configured"
            )
        
        jti = str(uuid.uuid4())
        refresh_expiration_time = datetime.now(timezone.utc) + timedelta(days=1)
        
        refresh_payload = {
            "id": user.id,
            "email": user.email,
            "jti": jti,
            "exp": int(refresh_expiration_time.timestamp())
        }
        
        refresh_token = jwt.encode(
            refresh_payload,
            refresh_token_secret,
            algorithm="HS256"
        )
        
        await prisma.session.create(
            data={
                "userId": user.id,
                "jti": jti,
                "exp": int(refresh_expiration_time.timestamp()),
                "remember": False
            }
        )
        
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=True,
            samesite="none",
            path="/auth"
        )
        
        access_expiration_time = datetime.now(timezone.utc) + timedelta(minutes=15)
        access_payload = {
            "id": user.id,
            "email": user.email,
            "exp": int(access_expiration_time.timestamp())
        }
        
        access_token = jwt.encode(
            access_payload,
            access_token_secret,
            algorithm="HS256"
        )
        
        return {
            "message": "User created successfully",
            "accessToken": access_token
        }
    
    except HTTPException:
        raise
    except Exception as exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(exception)}"
        )

@router.post("/sign-in")
async def sign_in(
    response: Response,
    email: EmailStr = Body(...),
    password: str = Body(...),
    remember: bool = Body(False)
):
    try:
        user = await prisma.user.find_unique(where={"email": email})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        password_valid = bcrypt.checkpw(
            password.encode('utf-8'),
            user.hashedPassword.encode('utf-8')
        )
        
        if not password_valid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        refresh_token_secret = os.getenv("REFRESH_TOKEN_SECRET")
        access_token_secret = os.getenv("ACCESS_TOKEN_SECRET")
        
        if not refresh_token_secret:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Refresh token secret not configured"
            )
        if not access_token_secret:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Access token secret not configured"
            )
        
        jti = str(uuid.uuid4())
        if remember:
            refresh_expiration_time = datetime.now(timezone.utc) + timedelta(days=30)
            max_age = 30 * 24 * 3600
        else:
            refresh_expiration_time = datetime.now(timezone.utc) + timedelta(days=1)
        
        refresh_payload = {
            "id": user.id,
            "email": user.email,
            "jti": jti,
            "exp": int(refresh_expiration_time.timestamp())
        }
        
        refresh_token = jwt.encode(
            refresh_payload,
            refresh_token_secret,
            algorithm="HS256"
        )
        
        await prisma.session.create(
            data={
                "userId": user.id,
                "jti": jti,
                "exp": int(refresh_expiration_time.timestamp()),
                "remember": remember
            }
        )
        
        cookie_params = {
            "key": "refresh_token",
            "value": refresh_token,
            "httponly": True,
            "secure": True,
            "samesite": "none",
            "path": "/auth"
        }
        
        if remember:
            cookie_params["max_age"] = max_age
        
        response.set_cookie(**cookie_params)
        
        access_expiration_time = datetime.now(timezone.utc) + timedelta(minutes=15)
        access_payload = {
            "id": user.id,
            "email": user.email,
            "exp": int(access_expiration_time.timestamp())
        }
        
        access_token = jwt.encode(
            access_payload,
            access_token_secret,
            algorithm="HS256"
        )
        
        return {
            "message": "Sign in successful",
            "accessToken": access_token
        }
    
    except HTTPException:
        raise
    except Exception as exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(exception)}"
        )

@router.post("/refresh")
async def refresh_access_token(request: Request, response: Response):
    try:
        refresh_token = request.cookies.get("refresh_token")
        
        if not refresh_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token not found"
            )
        
        refresh_token_secret = os.getenv("REFRESH_TOKEN_SECRET")
        access_token_secret = os.getenv("ACCESS_TOKEN_SECRET")
        
        if not refresh_token_secret:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Refresh token secret not configured"
            )
        if not access_token_secret:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Access token secret not configured"
            )
        
        try:
            payload = jwt.decode(
                refresh_token,
                refresh_token_secret,
                algorithms=["HS256"],
                options={"verify_exp": True}
            )
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token has expired"
            )
        except jwt.InvalidTokenError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        if "id" not in payload or "email" not in payload or "jti" not in payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token payload"
            )
        
        session = await prisma.session.find_unique(where={"jti": payload["jti"]})
        if not session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session not found"
            )
        
        new_jti = str(uuid.uuid4())
        
        if session.remember:
            refresh_expiration_time = datetime.now(timezone.utc) + timedelta(days=30)
            max_age = 30 * 24 * 3600
        else:
            refresh_expiration_time = datetime.now(timezone.utc) + timedelta(days=1)
        
        new_refresh_payload = {
            "id": payload["id"],
            "email": payload["email"],
            "jti": new_jti,
            "exp": int(refresh_expiration_time.timestamp())
        }
        
        new_refresh_token = jwt.encode(
            new_refresh_payload,
            refresh_token_secret,
            algorithm="HS256"
        )
        
        await prisma.session.update(
            where={"jti": payload["jti"]},
            data={
                "jti": new_jti,
                "exp": int(refresh_expiration_time.timestamp())
            }
        )
        
        cookie_params = {
            "key": "refresh_token",
            "value": new_refresh_token,
            "httponly": True,
            "secure": True,
            "samesite": "none",
            "path": "/auth"
        }
        
        if session.remember:
            cookie_params["max_age"] = max_age
        
        response.set_cookie(**cookie_params)
        
        access_expiration_time = datetime.now(timezone.utc) + timedelta(minutes=15)
        access_payload = {
            "id": payload["id"],
            "email": payload["email"],
            "exp": int(access_expiration_time.timestamp())
        }
        
        access_token = jwt.encode(
            access_payload,
            access_token_secret,
            algorithm="HS256"
        )
        
        return {
            "accessToken": access_token
        }
    
    except HTTPException:
        raise
    except Exception as exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(exception)}"
        )

@router.post("/sign-out")
async def sign_out(request: Request, response: Response):
    try:
        refresh_token = request.cookies.get("refresh_token")
        
        if refresh_token:
            refresh_token_secret = os.getenv("REFRESH_TOKEN_SECRET")
            if not refresh_token_secret:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Refresh token secret not configured"
                )
            
            try:
                payload = jwt.decode(
                    refresh_token,
                    refresh_token_secret,
                    algorithms=["HS256"],
                    options={"verify_exp": False}
                )
                
                if "jti" in payload:
                    try:
                        await prisma.session.delete_many(where={"jti": payload["jti"]})
                    except Exception:
                        raise HTTPException(
                            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Failed to delete session"
                        )
            except HTTPException:
                raise
            except:
                pass
        
        response.delete_cookie(
            key="refresh_token",
            path="/auth",
            samesite="none",
            secure=True,
            httponly=True
        )
        
        return {
            "message": "Sign out successful"
        }
    
    except HTTPException:
        raise
    except Exception as exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(exception)}"
        )
