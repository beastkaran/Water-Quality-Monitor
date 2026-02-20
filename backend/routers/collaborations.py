from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Collaboration
from schemas import CollaborationCreate, CollaborationResponse
from routers.dependencies import get_current_user

router = APIRouter()


@router.post("/", response_model=CollaborationResponse, status_code=201)
def create_collaboration(
    collaboration: CollaborationCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    # Only authority users can create collaborations
    if user.role.value != "authority":
        raise HTTPException(status_code=403, detail="Only authorities can create collaborations")
    
    new_collaboration = Collaboration(
        ngo_name=collaboration.ngo_name,
        project_name=collaboration.project_name,
        contact_email=collaboration.contact_email,
        phone=collaboration.phone,
        location=collaboration.location,
        description=collaboration.description,
        website=collaboration.website,
    )
    db.add(new_collaboration)
    db.commit()
    db.refresh(new_collaboration)
    return new_collaboration


@router.get("/", response_model=list[CollaborationResponse])
def get_all_collaborations(db: Session = Depends(get_db)):
    return db.query(Collaboration).order_by(Collaboration.created_at.desc()).all()


@router.get("/{collab_id}", response_model=CollaborationResponse)
def get_collaboration(collab_id: int, db: Session = Depends(get_db)):
    collaboration = db.query(Collaboration).filter(Collaboration.id == collab_id).first()
    if not collaboration:
        raise HTTPException(status_code=404, detail="Collaboration not found")
    return collaboration


@router.put("/{collab_id}", response_model=CollaborationResponse)
def update_collaboration(
    collab_id: int,
    collaboration: CollaborationCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    if user.role.value != "authority":
        raise HTTPException(status_code=403, detail="Only authorities can update collaborations")
    
    existing_collab = db.query(Collaboration).filter(Collaboration.id == collab_id).first()
    if not existing_collab:
        raise HTTPException(status_code=404, detail="Collaboration not found")
    
    existing_collab.ngo_name = collaboration.ngo_name
    existing_collab.project_name = collaboration.project_name
    existing_collab.contact_email = collaboration.contact_email
    existing_collab.phone = collaboration.phone
    existing_collab.location = collaboration.location
    existing_collab.description = collaboration.description
    existing_collab.website = collaboration.website
    
    db.commit()
    db.refresh(existing_collab)
    return existing_collab


@router.delete("/{collab_id}")
def delete_collaboration(
    collab_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    if user.role.value != "authority":
        raise HTTPException(status_code=403, detail="Only authorities can delete collaborations")
    
    collaboration = db.query(Collaboration).filter(Collaboration.id == collab_id).first()
    if not collaboration:
        raise HTTPException(status_code=404, detail="Collaboration not found")
    
    db.delete(collaboration)
    db.commit()
    return {"message": "Collaboration deleted successfully"}
