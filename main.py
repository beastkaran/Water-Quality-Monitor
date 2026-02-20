from fastapi import FastAPI
from sqlalchemy import text

from database import SessionLocal
from routers.auth import router as auth_router

app = FastAPI(title="Water Quality Monitor")

@app.get("/")
def root():
    return {"message": "Water Quality Monitor API running"}

@app.get("/test-db")
def test_db():
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        return {"status": "Database connected successfully"}
    finally:
        db.close()

app.include_router(auth_router)
