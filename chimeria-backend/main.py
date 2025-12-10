from contextlib import asynccontextmanager
from database import prisma
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, gemini, user

@asynccontextmanager
async def lifespan(app: FastAPI):
    await prisma.connect()
    yield
    await prisma.disconnect()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", status_code=status.HTTP_204_NO_CONTENT)
async def check_health():
    return None

app.include_router(auth.router)
app.include_router(gemini.router)
app.include_router(user.router)
