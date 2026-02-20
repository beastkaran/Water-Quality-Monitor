from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Alert, AlertType
from schemas import AlertCreate, AlertResponse
from routers.dependencies import get_current_user

router = APIRouter()


@router.post("/", response_model=AlertResponse)
def create_alert(
    alert: AlertCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    # Only authority users can create alerts
    if user.role.value != "authority":
        raise HTTPException(status_code=403, detail="Only authorities can create alerts")
    
    def _to_float_or_none(v):
        try:
            return float(v) if v not in (None, "", "null") else None
        except (ValueError, TypeError):
            return None

    new_alert = Alert(
        type=alert.type,
        message=alert.message,
        location=alert.location,
        latitude=_to_float_or_none(alert.latitude),
        longitude=_to_float_or_none(alert.longitude),
        severity=alert.severity,
        is_active="true"
    )
    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)
    return new_alert


@router.get("/", response_model=list[AlertResponse])
def get_all_alerts(db: Session = Depends(get_db)):
    return db.query(Alert).filter(Alert.is_active == "true").order_by(Alert.issued_at.desc()).all()


@router.get("/{alert_id}", response_model=AlertResponse)
def get_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert


@router.put("/{alert_id}/resolve", response_model=AlertResponse)
def resolve_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    if user.role.value != "authority":
        raise HTTPException(status_code=403, detail="Only authorities can resolve alerts")
    
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    alert.is_active = "false"
    db.commit()
    db.refresh(alert)
    return alert


@router.get("/type/{alert_type}", response_model=list[AlertResponse])
def get_alerts_by_type(alert_type: str, db: Session = Depends(get_db)):
    try:
        alert_type_enum = AlertType[alert_type]
    except KeyError:
        raise HTTPException(status_code=400, detail="Invalid alert type")
    
    return db.query(Alert).filter(
        Alert.type == alert_type_enum,
        Alert.is_active == "true"
    ).order_by(Alert.issued_at.desc()).all()
