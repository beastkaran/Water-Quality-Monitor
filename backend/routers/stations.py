from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import WaterStation, StationReading, Alert, AlertType
from schemas import StationCreate, StationResponse, ReadingCreate, ReadingResponse
from routers.dependencies import get_current_user

router = APIRouter()

# Threshold values for auto-alert generation
THRESHOLDS = {
    "pH": {"min": 6.5, "max": 8.5},
    "DO": {"min": 4.0, "max": None},
    "turbidity": {"min": None, "max": 10.0},
    "lead": {"min": None, "max": 0.015},
    "arsenic": {"min": None, "max": 0.010},
}


@router.get("/", response_model=list[StationResponse])
def get_stations(db: Session = Depends(get_db)):
    return db.query(WaterStation).all()


@router.post("/", response_model=StationResponse, status_code=201)
def create_station(
    station: StationCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    if user.role.value not in ("authority", "admin"):
        raise HTTPException(status_code=403, detail="Only authorities can create stations")

    new_station = WaterStation(
        name=station.name,
        location=station.location,
        latitude=station.latitude,
        longitude=station.longitude,
        managed_by=station.managed_by,
    )
    db.add(new_station)
    db.commit()
    db.refresh(new_station)
    return new_station


@router.get("/{station_id}/readings", response_model=list[ReadingResponse])
def get_station_readings(station_id: int, db: Session = Depends(get_db)):
    return db.query(StationReading).filter(
        StationReading.station_id == station_id
    ).order_by(StationReading.recorded_at.desc()).all()


@router.post("/{station_id}/readings", response_model=ReadingResponse, status_code=201)
def create_station_reading(
    station_id: int,
    reading: ReadingCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    if user.role.value not in ("authority", "admin"):
        raise HTTPException(status_code=403, detail="Only authorities can add readings")

    station = db.query(WaterStation).filter(WaterStation.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")

    new_reading = StationReading(
        station_id=station_id,
        parameter=reading.parameter,
        value=reading.value,
    )
    db.add(new_reading)
    db.commit()
    db.refresh(new_reading)

    # Auto-alert: check if the reading exceeds thresholds
    _check_threshold_and_alert(db, station, reading.parameter, reading.value)

    return new_reading


def _check_threshold_and_alert(db: Session, station: WaterStation, parameter: str, value_str: str):
    """Check if a reading exceeds thresholds and auto-create an alert."""
    threshold = THRESHOLDS.get(parameter)
    if not threshold:
        return

    try:
        value = float(value_str)
    except (ValueError, TypeError):
        return

    exceeded = False
    message = ""

    if threshold.get("max") is not None and value > threshold["max"]:
        exceeded = True
        message = f"⚠️ {parameter} reading ({value}) exceeded maximum threshold ({threshold['max']}) at {station.name}, {station.location}"
    elif threshold.get("min") is not None and value < threshold["min"]:
        exceeded = True
        message = f"⚠️ {parameter} reading ({value}) below minimum threshold ({threshold['min']}) at {station.name}, {station.location}"

    if exceeded:
        severity = "high" if parameter in ("lead", "arsenic") else "medium"
        alert = Alert(
            type=AlertType.contamination,
            message=message,
            location=station.location,
            latitude=station.latitude,
            longitude=station.longitude,
            severity=severity,
            station_id=station.id,
            is_active="true",
        )
        db.add(alert)
        db.commit()
