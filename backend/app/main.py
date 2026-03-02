from fastapi import FastAPI
from app.routers import upload, process, rewrite

app = FastAPI()

app.include_router(upload.router)
app.include_router(process.router)
app.include_router(rewrite.router)