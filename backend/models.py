
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum

from sqlalchemy.sql import func
from database import Base
import enum



class UserRole(enum.Enum):
    citizen = "citizen"
    user = "user"
    ngo = "ngo"
    authority = "authority"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)

    role = Column(Enum(UserRole), default=UserRole.citizen, nullable=False)
    location = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ReportStatus(enum.Enum):
    pending = "pending"
    verified = "verified"
    rejected = "rejected"


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    photo_url = Column(String, nullable=True)
    location = Column(String, nullable=False)
    latitude = Column(String, nullable=True)
    longitude = Column(String, nullable=True)
    description = Column(Text, nullable=False)
    water_source = Column(String, nullable=False)
    station_name = Column(String, nullable=True)
    alert_id = Column(Integer, ForeignKey("alerts.id"), nullable=True)
    status = Column(Enum(ReportStatus), default=ReportStatus.pending)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class WaterStation(Base):
    __tablename__ = "water_stations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    location = Column(String, nullable=False)
    latitude = Column(String, nullable=False)
    longitude = Column(String, nullable=False)
    managed_by = Column(String)


class StationReading(Base):
    __tablename__ = "station_readings"

    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(Integer, ForeignKey("water_stations.id"), nullable=False)
    parameter = Column(String, nullable=False)
    value = Column(String, nullable=False)
    recorded_at = Column(DateTime(timezone=True), server_default=func.now())


class AlertType(enum.Enum):
    boil_notice = "boil_notice"
    contamination = "contamination"
    outage = "outage"


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(Enum(AlertType), nullable=False)
    message = Column(Text, nullable=False)
    location = Column(String, nullable=False)
    latitude = Column(String, nullable=True)
    longitude = Column(String, nullable=True)
    severity = Column(String, default="medium")  # low, medium, high, critical
    station_id = Column(Integer, ForeignKey("water_stations.id"), nullable=True)
    report_id = Column(Integer, ForeignKey("reports.id"), nullable=True)
    issued_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(String, default="true")


class Collaboration(Base):
    __tablename__ = "collaborations"

    id = Column(Integer, primary_key=True, index=True)
    ngo_name = Column(String, nullable=False)
    project_name = Column(String, nullable=False)
    contact_email = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    location = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    website = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class NgoProject(Base):
    __tablename__ = "ngo_projects"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    project_name = Column(String, nullable=False)
    contact_email = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
