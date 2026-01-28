from sqlalchemy import Column, Integer, Float, String, Text, ForeignKey, TIMESTAMP, DateTime, Numeric
from database import Base
from sqlalchemy.sql import func 


class User(Base):
    __tablename__="users"
    __table_args__={"schema":"auth"}

    id= Column(Integer, primary_key=True)
    name=Column(String)
    email= Column(String,unique=True, index=True)
    password=Column(String)
    role=Column(String)

class Report(Base):
    __tablename__="reports"
    __table_args__={"schema":"reports"}

    id=Column(Integer,primary_key=True, index=True)
    user_id=Column(Integer, ForeignKey("auth.users.id", ondelete="CASCADE"))
    photo_url=Column(String(500), nullable=True)
    location=Column(String(255))
    description=Column(Text)
    water_source=Column(String(100))
    status=Column(String, default="pending")
    created_at=Column(TIMESTAMP(timezone=True), server_default=func.now())
 
class WaterStation(Base):
    __tablename__ = "water_stations"
    __table_args__ = {"schema": "monitoring"}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255))
    latitude = Column(Float)
    longitude = Column(Float)
    location = Column(String(255))

class StationReading(Base):
    __tablename__ = "station_readings"
    __table_args__ = {"schema": "monitoring"}

    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(
        Integer,
        ForeignKey("monitoring.water_stations.id", ondelete="CASCADE"),
        nullable=False
    )

    parameter = Column(String, nullable=False)   # maps water_parameter enum
    value = Column(Numeric)
    recorded_at = Column(DateTime(timezone=True), server_default=func.now())