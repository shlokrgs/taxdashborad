# backend/main.py

from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from database import SessionLocal
from models import SaleRecord, Base
import pandas as pd
import os
import shutil
from typing import List

# Configurations
SECRET_KEY = "your_secret_key_here"
ALGORITHM = "HS256"

UPLOAD_BASE = "uploaded_files"
MERGED_BASE = "merged_files"

os.makedirs(UPLOAD_BASE, exist_ok=True)
os.makedirs(MERGED_BASE, exist_ok=True)

# FastAPI app
app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, set allowed domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")

# Fake user store (replace with real DB in production)
fake_users = {}

# Utils
def create_access_token(data: dict):
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None

async def get_current_user(token: str = Depends(oauth2_scheme)):
    username = verify_token(token)
    if username is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    return username

# ========== AUTH APIs ==========

@app.post("/register")
async def register(form_data: OAuth2PasswordRequestForm = Depends()):
    if form_data.username in fake_users:
        raise HTTPException(status_code=400, detail="Username already registered.")
    fake_users[form_data.username] = form_data.password
    token = create_access_token({"sub": form_data.username})
    return {"access_token": token, "token_type": "bearer"}

@app.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user_pass = fake_users.get(form_data.username)
    if not user_pass or user_pass != form_data.password:
        raise HTTPException(status_code=401, detail="Invalid credentials.")
    token = create_access_token({"sub": form_data.username})
    return {"access_token": token, "token_type": "bearer"}

# ========== UPLOAD Excel Files ==========

@app.post("/upload")
async def upload_files(user: str = Depends(get_current_user), files: List[UploadFile] = File(...)):
    user_dir = os.path.join(UPLOAD_BASE, user)
    os.makedirs(user_dir, exist_ok=True)
    for file in files:
        file_path = os.path.join(user_dir, file.filename)
        with open(file_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
    return {"message": "Files uploaded successfully."}

# ========== MERGE Excel Files ==========

@app.get("/merge")
async def merge_files(user: str = Depends(get_current_user)):
    user_dir = os.path.join(UPLOAD_BASE, user)
    files = [f for f in os.listdir(user_dir) if f.endswith(('.xls', '.xlsx'))]

    if not files:
        raise HTTPException(status_code=404, detail="No uploaded Excel files found.")

    dfs = []
    for f in files:
        df = pd.read_excel(os.path.join(user_dir, f))
        if 'Date' in df.columns:
            df['Date'] = pd.to_datetime(df['Date'], errors='coerce')
            df['Month'] = df['Date'].dt.strftime('%B')
            df['Year'] = df['Date'].dt.year
            df['Financial Year'] = df['Date'].apply(lambda d: f"{d.year-1}-{d.year}" if d.month <= 3 else f"{d.year}-{d.year+1}")
        if {'Sale Value', 'Tax Value'}.issubset(df.columns):
            df['Invoice Value'] = df['Sale Value'] + df['Tax Value']
        dfs.append(df)

    combined = pd.concat(dfs, ignore_index=True)
    output_path = os.path.join(MERGED_BASE, f"{user}_merged.parquet")
    combined.to_parquet(output_path, index=False)
    return {"message": "Merged and saved."}

# ========== PREVIEW Data ==========

@app.get("/preview")
async def preview_data(user: str = Depends(get_current_user)):
    path = os.path.join(MERGED_BASE, f"{user}_merged.parquet")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="No merged data found.")

    df = pd.read_parquet(path)
    return df.head(100).to_dict(orient="records")

# ========== SUMMARY Data ==========

@app.get("/summary")
async def filtered_summary(
    month: str = "",
    financial_year: str = "",
    product: str = "",
    tax_rate: float = None,
    user: str = Depends(get_current_user)
):
    path = os.path.join(MERGED_BASE, f"{user}_merged.parquet")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="No merged data found.")

    df = pd.read_parquet(path)
    df.columns = [col.strip() for col in df.columns]

    if month:
        df = df[df["Month"].str.lower().str.strip() == month.lower().strip()]
    if financial_year:
        df = df[df["Financial Year"].astype(str).str.strip() == financial_year.strip()]
    if product:
        df["Product"] = df["Product"].astype(str).str.strip()
        df = df[df["Product"].str.lower() == product.lower().strip()]
    if tax_rate is not None:
        try:
            tax_rate = float(tax_rate)
            df = df[df["Tax Rate"] == tax_rate]
        except ValueError:
            pass

    if df.empty:
        return []

    summary = (
        df.groupby(["Month", "Financial Year", "Product"])
        .agg({
            "Qty": "sum",
            "Sale Value": "sum",
            "Tax Value": "sum",
            "Invoice Value": "sum",
            "Tax Rate": "mean"
        })
        .reset_index()
        .round(2)
    )

    return summary.to_dict(orient="records")

# ========== DOWNLOAD Excel ==========

@app.get("/download")
async def download_excel(user: str = Depends(get_current_user)):
    path = os.path.join(MERGED_BASE, f"{user}_merged.parquet")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="No merged file found.")

    df = pd.read_parquet(path)
    output_excel = os.path.join(MERGED_BASE, f"{user}_filtered.xlsx")
    df.to_excel(output_excel, index=False)
    return FileResponse(output_excel, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", filename=f"{user}_filtered.xlsx")

# ========== RESET Uploads ==========

@app.delete("/reset")
async def reset_all(user: str = Depends(get_current_user)):
    user_dir = os.path.join(UPLOAD_BASE, user)
    merged_file = os.path.join(MERGED_BASE, f"{user}_merged.parquet")

    if os.path.exists(user_dir):
        shutil.rmtree(user_dir)
    if os.path.exists(merged_file):
        os.remove(merged_file)

    return {"message": "Reset completed successfully."}
