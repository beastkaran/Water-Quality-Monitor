from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import NgoProject
from schemas import NgoProjectCreate, NgoProjectResponse
from routers.dependencies import get_current_user

router = APIRouter()


@router.post("/", response_model=NgoProjectResponse, status_code=201)
def create_ngo_project(
    project: NgoProjectCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    if user.role.value != "ngo":
        raise HTTPException(status_code=403, detail="Only NGO users can publish projects")

    new_project = NgoProject(
        user_id=user.id,
        project_name=project.project_name,
        contact_email=project.contact_email,
        description=project.description,
    )
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return new_project


@router.get("/", response_model=list[NgoProjectResponse])
def get_ngo_projects(
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    if user.role.value != "ngo":
        raise HTTPException(status_code=403, detail="Only NGO users can view projects")
    return db.query(NgoProject).order_by(NgoProject.created_at.desc()).all()
