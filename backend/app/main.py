from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import upload, process, rewrite, export  # ← add ", export"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router)
app.include_router(process.router)
app.include_router(rewrite.router)
app.include_router(export.router)  # ← add this line