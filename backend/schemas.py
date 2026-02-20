from pydantic import BaseModel, EmailStr, field_validator
from enum import Enum

from typing import Optional
from datetime import datetime


class UserRole(str, Enum):
    citizen = "citizen"
    user = "user"
    ngo = "ngo"
    authority = "authority"
    admin = "admin"



class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

    role: UserRole = UserRole.citizen
    location: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: UserRole
    location: Optional[str]


    class Config:
        from_attributes = True



class LoginRequest(BaseModel):
    email: EmailStr
    password: str



class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ReportStatus(str, Enum):
    pending = "pending"
    verified = "verified"
    rejected = "rejected"


class ReportCreate(BaseModel):
    location: str
    latitude: Optional[str] = None
    longitude: Optional[str] = None
    description: str
    water_source: str
    station_name: Optional[str] = None
    alert_id: Optional[int] = None
    photo_url: Optional[str] = None


class ReportResponse(BaseModel):
    id: int
    user_id: int
    location: str
    latitude: Optional[str]
    longitude: Optional[str]
    description: str
    water_source: str
    station_name: Optional[str]
    alert_id: Optional[int]
    photo_url: Optional[str]
    status: ReportStatus
    created_at: datetime

    class Config:
        from_attributes = True


class AlertType(str, Enum):
    boil_notice = "boil_notice"
    contamination = "contamination"
    outage = "outage"


class AlertCreate(BaseModel):
    type: AlertType
    message: str
    location: str
    latitude: Optional[str] = None
    longitude: Optional[str] = None
    severity: str = "medium"


class AlertResponse(BaseModel):
    id: int
    type: AlertType
    message: str
    location: str
    latitude: Optional[str]
    longitude: Optional[str]
    severity: str
    station_id: Optional[int]
    report_id: Optional[int]
    issued_at: datetime
    resolved_at: Optional[datetime]
    is_active: str

    @field_validator("is_active", mode="before")
    @classmethod
    def coerce_is_active(cls, v):
        if isinstance(v, bool):
            return "true" if v else "false"
        return str(v) if v is not None else "false"

    @field_validator("latitude", "longitude", mode="before")
    @classmethod
    def coerce_coord_to_str(cls, v):
        # DB may store as float — coerce to string
        if v is None:
            return None
        return str(v)

    class Config:
        from_attributes = True


class CollaborationCreate(BaseModel):
    ngo_name: str
    project_name: str
    contact_email: EmailStr
    phone: Optional[str] = None
    location: str
    description: Optional[str] = None
    website: Optional[str] = None


class CollaborationResponse(BaseModel):
    id: int
    ngo_name: str
    project_name: str
    contact_email: str
    phone: Optional[str]
    location: str
    description: Optional[str]
    website: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class StationCreate(BaseModel):
    name: str
    location: str
    latitude: str
    longitude: str
    managed_by: Optional[str] = None


class StationResponse(BaseModel):
    id: int
    name: str
    location: str
    latitude: str
    longitude: str
    managed_by: Optional[str]

    class Config:
        from_attributes = True


class ReadingCreate(BaseModel):
    parameter: str
    value: str


class ReadingResponse(BaseModel):
    id: int
    station_id: int
    parameter: str
    value: str
    recorded_at: datetime

    class Config:
        from_attributes = True


class NgoProjectCreate(BaseModel):
    project_name: str
    contact_email: EmailStr
    description: Optional[str] = None


class NgoProjectResponse(BaseModel):
    id: int
    user_id: int
    project_name: str
    contact_email: str
    description: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
