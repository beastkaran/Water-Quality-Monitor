from sqlalchemy import Column, Integer, String
from database import Base

class User(Base):
    __tablename__="users"
    __table_args__={"schema":"auth"}

    id= Column(Integer, primary_key=True)
    name=Column(String)
    email= Column(String,unique=True, index=True)
    password=Column(String)
    role=Column(String)