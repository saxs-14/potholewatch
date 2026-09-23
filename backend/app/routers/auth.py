from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.auth import login_user, register_user
from app.database import get_db

router = APIRouter(prefix="/api/auth", tags=["auth"])

class Credentials(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=8, max_length=128)

def response(user, token):
    return {"access_token": token, "token_type": "bearer", "user": {"id": user.id, "email": user.email, "role": user.role}}

@router.post("/register")
def register(data: Credentials, db: Session = Depends(get_db)):
    user, token = register_user(db, data.email, data.password)
    return response(user, token)

@router.post("/login")
def login(data: Credentials, db: Session = Depends(get_db)):
    user, token = login_user(db, data.email, data.password)
    return response(user, token)
