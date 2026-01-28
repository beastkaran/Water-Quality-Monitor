from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel
from jose import jwt, JWTError
from datetime import datetime, timedelta
from database import SessionLocal
from models import User, Report, WaterStation, StationReading
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import requests
from sqlalchemy import func, and_
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security scheme
security = HTTPBearer()

# Password context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# DB Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# JWT Config
SECRET_KEY = "supersecretkey"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# JWT Generator
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

class ReportCreate(BaseModel):
    photo_url: str|None=None
    location: str
    description: str
    water_source: str

@app.get("/")
def root():
    return {"status": "FastAPI is running"}


class LoginRequest(BaseModel):
    email: str
    password: str


@app.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid Credentials")

    if not pwd_context.verify(data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid Credentials")

    token = create_access_token({"sub": user.email})
    return {"accessToken": token}


@app.get("/user")
def get_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print("JWT PAYLOAD:", payload)  # 🔍 DEBUG LINE

        email = payload.get("sub")
        print("EMAIL FROM TOKEN:", email)  # 🔍 DEBUG LINE

        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token payload")

        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        return {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
 
@app.post("/reports")
def create_report(
    data: ReportCreate,
    creadentials: HTTPAuthorizationCredentials=Depends(security),
    db: Session=Depends(get_db)
):
    token=creadentials.credentials
    payload= jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    email=payload.get("sub")

    user=db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid user")
    
    report=Report(
        user_id=user.id,
        photo_url=data.photo_url,
        location=data.location,
        description=data.description,
        water_source=data.water_source
    )

    db.add(report)
    db.commit()
    db.refresh(report)

    return{
        "message": "Report created successsfully",
        "report_id":report.id
    }

@app.get("/reports/my")
def get_my_reports(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    email = payload.get("sub")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid user")

    reports = db.query(Report).filter(Report.user_id == user.id).all()
    return reports

@app.get("/reports")
def get_all_reports(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    email = payload.get("sub")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid user")

    # Only admin / authority can see all reports
    if user.role not in ["admin", "authority"]:
        raise HTTPException(status_code=403, detail="Access denied")

    reports = db.query(Report).all()
    return reports

class ReportStatusUpdate(BaseModel):
    status: str 

@app.put("/reports/{report_id}")
def update_report_status(
    report_id: int,
    data: ReportStatusUpdate,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    email = payload.get("sub")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid user")

    # Only admin/authority can update status
    if user.role not in ["admin", "authority"]:
        raise HTTPException(status_code=403, detail="Only authority can update reports")

    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    report.status = data.status
    db.commit()
    db.refresh(report)

    return {
        "message": "Report status updated successfully",
        "report_id": report.id,
        "new_status": report.status
    }

def fetch_stations_from_cpcb():
    url = "https://rtwqmsdb1.cpcb.gov.in/data/internet/stations/stations.json"
    headers = {"User-Agent": "Mozilla/5.0"}

    res = requests.get(url, headers=headers,verify=False, timeout=120)

    print("STATUS CODE:", res.status_code)
    print("RAW RESPONSE (first 300 chars):", res.text[:300])

    if res.status_code != 200:
        raise Exception("Failed to fetch stations")
    data=res.json()
    print("FIRST STATION OBJECT:", data[0])
    return data

@app.post("/stations/sync")
def sync_stations(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    email = payload.get("sub")

    user = db.query(User).filter(User.email == email).first()
    if not user or user.role not in ["admin", "authority"]:
        raise HTTPException(status_code=403, detail="Only admin can sync stations")

    stations = fetch_stations_from_cpcb()

    for s in stations:
        try:
            name = s.get("station_name")
            lat = s.get("station_latitude")
            lon = s.get("station_longitude")
            location = s.get("territory_name", "")

            if not name or not lat or not lon:
                print("Skipping invalid station:", s)
                continue

            existing = db.query(WaterStation).filter(
                WaterStation.name == name
            ).first()

            if not existing:
                station = WaterStation(
                    name=name,
                    latitude=float(lat),
                    longitude=float(lon),
                    location=location
                )
                db.add(station)

        except Exception as e:
            print("Error processing station:", s)
            print("Reason:", e)
            continue

    db.commit()
    return {"message": "Stations synced successfully"}


@app.get("/stations")
def get_stations(db: Session = Depends(get_db)):
    stations = db.query(WaterStation).all()
    return stations

class StationReadingCreate(BaseModel):
    station_id: int
    parameter: str
    value: float


@app.post("/stations/readings")
def add_station_reading(
    data: StationReadingCreate,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    email = payload.get("sub")

    user = db.query(User).filter(User.email == email).first()
    if not user or user.role not in ["admin", "authority"]:
        raise HTTPException(status_code=403, detail="Only admin can add readings")

    station = db.query(WaterStation).filter(WaterStation.id == data.station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")

    reading = StationReading(
        station_id=data.station_id,
        parameter=data.parameter,
        value=data.value
    )

    db.add(reading)
    db.commit()
    db.refresh(reading)

    return {
        "message": "Reading added successfully",
        "reading_id": reading.id
    }


@app.get("/stations/readings/latest")
def get_latest_readings(db: Session = Depends(get_db)):
    subquery = (
        db.query(
            StationReading.station_id,
            func.max(StationReading.recorded_at).label("latest")
        )
        .group_by(StationReading.station_id)
        .subquery()
    )

    readings = (
        db.query(StationReading)
        .join(subquery, 
              (StationReading.station_id == subquery.c.station_id) &
              (StationReading.recorded_at == subquery.c.latest))
        .all()
    )

    return readings

@app.get("/stations/readings/latest")
def get_latest_station_readings(db: Session = Depends(get_db)):
    subquery = (
        db.query(
            StationReading.station_id,
            StationReading.parameter,
            func.max(StationReading.recorded_at).label("latest_time")
        )
        .group_by(
            StationReading.station_id,
            StationReading.parameter
        )
        .subquery()
    )

    latest_readings = (
        db.query(StationReading)
        .join(
            subquery,
            and_(
                StationReading.station_id == subquery.c.station_id,
                StationReading.parameter == subquery.c.parameter,
                StationReading.recorded_at == subquery.c.latest_time
            )
        )
        .all()
    )

    return latest_readings
