from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from database import get_db
from models import User, Alert, AlertType, StationReading, WaterStation
from routers.dependencies import get_current_user

router = APIRouter()

# Water quality thresholds
THRESHOLDS = {
    "pH":                {"min": 6.5,  "max": 8.5,   "severity": "medium"},
    "dissolved_oxygen":  {"min": 5.0,  "max": None,  "severity": "high"},
    "turbidity":         {"min": None, "max": 5.0,   "severity": "medium"},
    "lead":              {"min": None, "max": 0.015, "severity": "critical"},
    "arsenic":           {"min": None, "max": 0.010, "severity": "critical"},
    # also handle shorthand names submitted from stations router
    "DO":                {"min": 4.0,  "max": None,  "severity": "high"},
}


def _group_readings_by_param(readings):
    """Group StationReading rows (parameter/value) into {param: [float, ...]} dict."""
    grouped = {}
    for r in readings:
        param = r.parameter.strip().lower().replace(" ", "_")
        try:
            val = float(r.value)
        except (ValueError, TypeError):
            continue
        grouped.setdefault(param, [])
        grouped[param].append(val)
    return grouped


def analyze_water_quality_trends(db: Session, station_id: int, lookback_days: int = 7):
    """
    Analyze historical StationReading rows to identify trends and predict alerts.
    StationReadings are stored as (parameter, value) rows — not named columns.
    """
    start_date = datetime.utcnow() - timedelta(days=lookback_days)
    readings = (
        db.query(StationReading)
        .filter(
            StationReading.station_id == station_id,
            StationReading.recorded_at >= start_date,
        )
        .order_by(StationReading.recorded_at)
        .all()
    )

    if not readings:
        return []

    grouped = _group_readings_by_param(readings)
    predicted_alerts = []

    for raw_param, threshold in THRESHOLDS.items():
        # Match both exact and lowercase versions of the param name
        values = grouped.get(raw_param.lower()) or grouped.get(raw_param)
        if not values:
            continue

        recent_values = values[-3:] if len(values) >= 3 else values
        older_values = values[: max(1, len(values) - 3)]

        recent_avg = sum(recent_values) / len(recent_values)
        older_avg = sum(older_values) / len(older_values)

        violation_detected = False
        alert_message = ""

        min_val = threshold.get("min")
        max_val = threshold.get("max")

        if min_val is not None and recent_avg < min_val:
            violation_detected = True
            alert_message = (
                f"{raw_param} level critically low ({recent_avg:.2f}), "
                f"below minimum threshold ({min_val})"
            )
        elif max_val is not None and recent_avg > max_val:
            violation_detected = True
            alert_message = (
                f"{raw_param} level critically high ({recent_avg:.2f}), "
                f"above maximum threshold ({max_val})"
            )

        # Also flag a steep worsening trend (>20% change) even without a full violation
        if not violation_detected and older_avg != 0:
            change_pct = abs(recent_avg - older_avg) / abs(older_avg)
            if change_pct > 0.20:
                direction = "increasing" if recent_avg > older_avg else "decreasing"
                alert_message = (
                    f"{raw_param} showing concerning {direction} trend "
                    f"(was {older_avg:.2f}, now {recent_avg:.2f})"
                )
                violation_detected = True

        if violation_detected:
            predicted_alerts.append(
                {
                    "parameter": raw_param,
                    "message": alert_message,
                    "severity": threshold["severity"],
                    "threshold": threshold,
                    "recent_value": round(recent_avg, 4),
                    "trend": "worsening" if recent_avg > older_avg else "improving",
                }
            )

    return predicted_alerts


@router.get("/analyze/{station_id}")
def analyze_station(
    station_id: int,
    lookback_days: int = 7,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Analyze water quality trends for a specific station."""
    station = db.query(WaterStation).filter(WaterStation.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")

    predicted_alerts = analyze_water_quality_trends(db, station_id, lookback_days)

    return {
        "station_id": station_id,
        "station_name": station.name,
        "lookback_days": lookback_days,
        "predicted_alerts": predicted_alerts,
        "alert_count": len(predicted_alerts),
        "analysis_timestamp": datetime.utcnow().isoformat(),
    }


@router.post("/auto-predict")
def auto_predict_and_create_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Automatically analyze all stations and create alerts for critical predictions."""
    if current_user.role.value not in ("authority", "admin"):
        raise HTTPException(
            status_code=403, detail="Only authorities can run auto-predict"
        )

    all_stations = db.query(WaterStation).all()
    created_alerts = []

    for station in all_stations:
        predicted_alerts = analyze_water_quality_trends(db, station.id, lookback_days=7)

        for prediction in predicted_alerts:
            if prediction["severity"] not in ("high", "critical"):
                continue

            # Avoid duplicate alerts within the last 24 h
            existing = (
                db.query(Alert)
                .filter(
                    Alert.location == station.location,
                    Alert.is_active == "true",
                    Alert.issued_at >= datetime.utcnow() - timedelta(hours=24),
                )
                .first()
            )
            if existing:
                continue

            alert = Alert(
                type=AlertType.contamination,
                message=prediction["message"],
                location=station.location,
                latitude=station.latitude,
                longitude=station.longitude,
                severity=prediction["severity"],
                station_id=station.id,
                is_active="true",
            )
            db.add(alert)
            created_alerts.append(
                {
                    "station": station.name,
                    "message": prediction["message"],
                    "severity": prediction["severity"],
                }
            )

        db.commit()

    return {
        "analysis_timestamp": datetime.utcnow().isoformat(),
        "stations_analyzed": len(all_stations),
        "alerts_created": len(created_alerts),
        "alerts": created_alerts,
    }


@router.get("/trends/{station_id}")
def get_water_quality_trends(
    station_id: int,
    lookback_days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get detailed water quality trend analysis with predictions."""
    station = db.query(WaterStation).filter(WaterStation.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")

    start_date = datetime.utcnow() - timedelta(days=lookback_days)
    readings = (
        db.query(StationReading)
        .filter(
            StationReading.station_id == station_id,
            StationReading.recorded_at >= start_date,
        )
        .order_by(StationReading.recorded_at)
        .all()
    )

    grouped = _group_readings_by_param(readings)

    statistics = {}
    for param, values in grouped.items():
        if values:
            statistics[param] = {
                "min": round(min(values), 4),
                "max": round(max(values), 4),
                "avg": round(sum(values) / len(values), 4),
                "latest": round(values[-1], 4),
                "data_points": len(values),
            }

    predictions = analyze_water_quality_trends(db, station_id, lookback_days)

    return {
        "station": {
            "id": station.id,
            "name": station.name,
            "location": station.location,
        },
        "statistics": statistics,
        "predictions": predictions,
        "critical_alerts": len([p for p in predictions if p["severity"] == "critical"]),
        "warning_alerts": len([p for p in predictions if p["severity"] == "high"]),
        "analysis_period_days": lookback_days,
    }
