from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlmodel import Session, select

from app.database import get_session
from app.models import User
from app.auth import create_token, verify_token

app = FastAPI()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


@app.get("/")
def root():
    return {"status": "Backend running"}


# ---------------- SIGNUP ----------------
@app.post("/signup")
def signup(name: str, email: str, password: str, session: Session = Depends(get_session)):

    existing = session.exec(select(User).where(User.email == email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(name=name, email=email, password=password)
    session.add(user)
    session.commit()
    session.refresh(user)

    return {"message": "User registered successfully"}


# ---------------- LOGIN ----------------
@app.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: Session = Depends(get_session)
):
    user = session.exec(
        select(User).where(User.email == form_data.username)
    ).first()

    if not user or user.password != form_data.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_token({"user_id": user.id, "email": user.email})
    return {"accessToken": token}


# ---------------- PROFILE ----------------
@app.post("/profile")
def profile(
    token: str = Depends(oauth2_scheme),
    session: Session = Depends(get_session)
):
    try:
        payload = verify_token(token)
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = session.get(User, payload["user_id"])
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return {
        "id": user.id,
        "name": user.name,
        "email": user.email
    }
