# backend/auth.py

from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from schemas import User, Token
from utils import hash_password, verify_password, create_access_token
from database import user_db

router = APIRouter()

# === Register New User ===
@router.post("/register", response_model=Token)
def register(user: User):
    if user.username in user_db:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already exists"
        )

    hashed_pw = hash_password(user.password)
    user_db[user.username] = hashed_pw

    token = create_access_token({"sub": user.username})
    return {"access_token": token, "token_type": "bearer"}


# === Login Existing User ===
@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    stored_pw = user_db.get(form_data.username)

    if not stored_pw or not verify_password(form_data.password, stored_pw):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token({"sub": form_data.username})
    return {"access_token": token, "token_type": "bearer"}
