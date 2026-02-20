import time
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models import (
    WaterStation, StationReading, Report, ReportStatus,
    Alert, NgoProject
)

router = APIRouter()

# Simple in-memory cache
_cache = {"data": None, "timestamp": 0}
CACHE_TTL = 60  # seconds


@router.get("/")
def get_dashboard_data(db: Session = Depends(get_db)):
    now = time.time()
    if _cache["data"] and (now - _cache["timestamp"]) < CACHE_TTL:
        return _cache["data"]

    # Number cards
    total_stations = db.query(func.count(WaterStation.id)).scalar() or 0
    total_readings = db.query(func.count(StationReading.id)).scalar() or 0
    total_reports = db.query(func.count(Report.id)).scalar() or 0

    avg_readings_per_station = round(total_readings / total_stations, 2) if total_stations else 0
    avg_reports_per_station = round(total_reports / total_stations, 2) if total_stations else 0

    # Alert status counts
    active_alerts = db.query(func.count(Alert.id)).filter(Alert.is_active == "true").scalar() or 0
    resolved_alerts = db.query(func.count(Alert.id)).filter(Alert.is_active != "true").scalar() or 0

    # Report status counts
    pending_reports = db.query(func.count(Report.id)).filter(Report.status == ReportStatus.pending).scalar() or 0
    verified_reports = db.query(func.count(Report.id)).filter(Report.status == ReportStatus.verified).scalar() or 0
    rejected_reports = db.query(func.count(Report.id)).filter(Report.status == ReportStatus.rejected).scalar() or 0

    # Parameter stats for box plot
    parameters = ["pH", "DO", "turbidity", "lead", "arsenic"]
    parameter_stats = {}
    for param in parameters:
        readings = db.query(StationReading.value).filter(
            StationReading.parameter == param
        ).all()
        values = []
        for r in readings:
            try:
                values.append(float(r[0]))
            except (ValueError, TypeError):
                continue
        if values:
            values.sort()
            n = len(values)
            q1_idx = n // 4
            q3_idx = (3 * n) // 4
            parameter_stats[param] = {
                "min": round(min(values), 4),
                "q1": round(values[q1_idx], 4),
                "median": round(values[n // 2], 4),
                "q3": round(values[q3_idx], 4),
                "max": round(max(values), 4),
                "count": n,
            }

    # Latest 3 alerts
    latest_alerts = db.query(Alert).order_by(Alert.issued_at.desc()).limit(3).all()
    latest_alerts_data = [
        {
            "id": a.id,
            "type": a.type.value if a.type else "",
            "message": a.message,
            "location": a.location,
            "severity": a.severity,
            "is_active": a.is_active,
            "issued_at": a.issued_at.isoformat() if a.issued_at else None,
        }
        for a in latest_alerts
    ]

    # Latest 3 reports
    latest_reports = db.query(Report).order_by(Report.created_at.desc()).limit(3).all()
    latest_reports_data = [
        {
            "id": r.id,
            "location": r.location,
            "description": r.description,
            "water_source": r.water_source,
            "station_name": r.station_name,
            "status": r.status.value if r.status else "",
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in latest_reports
    ]

    data = {
        "total_stations": total_stations,
        "total_readings": total_readings,
        "total_reports": total_reports,
        "avg_readings_per_station": avg_readings_per_station,
        "avg_reports_per_station": avg_reports_per_station,
        "alert_status_counts": {
            "active": active_alerts,
            "resolved": resolved_alerts,
        },
        "report_status_counts": {
            "pending": pending_reports,
            "verified": verified_reports,
            "rejected": rejected_reports,
        },
        "parameter_stats": parameter_stats,
        "latest_alerts": latest_alerts_data,
        "latest_reports": latest_reports_data,
    }

    _cache["data"] = data
    _cache["timestamp"] = now
    return data
