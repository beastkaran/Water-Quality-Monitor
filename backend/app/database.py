from sqlmodel import SQLModel, create_engine, Session

DATABASE_URL = "postgresql://postgres@localhost:5432/water_quality"

engine = create_engine(DATABASE_URL)

def get_session():
    with Session(engine) as session:
        yield session
