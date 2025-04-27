# backend/main.py

from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, status
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.routing import APIRouter
from typing import List
import pandas as pd
import os
import uuid
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from models import SaleRecord
from database import SessionLocal, engine
from utils import get_current_user
from schemas import ExcelRow
from fastapi import BackgroundTasks

# === Config ===
UPLOAD_BASE = "user_uploads"
MERGED_BASE = "user_merged"
os.makedirs(UPLOAD_BASE, exist_ok=True)
os.makedirs(MERGED_BASE, exist_ok=True)

app = FastAPI()
router = APIRouter()

# === CORS ===
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === Upload Files ===
@router.post("/upload")
async def upload_files(
    files: List[UploadFile] = File(...),
    user: str = Depends(get_current_user)
):
    user_dir = os.path.join(UPLOAD_BASE, user)
    os.makedirs(user_dir, exist_ok=True)

    for file in files:
        file_path = os.path.join(user_dir, f"{uuid.uuid4()}_{file.filename}")
        with open(file_path, "wb") as f:
            f.write(await file.read())

    return {"message": f"{len(files)} file(s) uploaded."}

# === Merge and Save ===
@router.get("/merge")
async def merge_files(user: str = Depends(get_current_user)):
    user_dir = os.path.join(UPLOAD_BASE, user)
    files = [f for f in os.listdir(user_dir) if f.endswith((".xls", ".xlsx"))]

    if not files:
        raise HTTPException(status_code=404, detail="No uploaded Excel files found.")

    async with SessionLocal() as session:
        for file in files:
            df = pd.read_excel(os.path.join(user_dir, file))
            df.columns = [col.strip() for col in df.columns]
            df['Date'] = pd.to_datetime(df['Date'], errors='coerce')
            df['Month'] = df['Date'].dt.strftime('%B')
            df['Year'] = df['Date'].dt.year
            df['Financial Year'] = df['Date'].apply(lambda d: f"{d.year-1}-{d.year}" if d.month <= 3 else f"{d.year}-{d.year+1}")
            df['Invoice Value'] = df['Sale Value'] + df['Tax Value']

            for row in df.itertuples(index=False):
                record = SaleRecord(
                    user=user,
                    customer_code=getattr(row, 'Customer_Code', None),
                    customer_name=getattr(row, 'Customer_Name', None),
                    customer_place=getattr(row, 'Customer_Place', None),
                    location_of_supply=getattr(row, 'Location_of_Supply', None),
                    date=getattr(row, 'Date', None),
                    product=getattr(row, 'Product', None),
                    tax_rate=getattr(row, 'Tax_Rate', None),
                    qty=getattr(row, 'Qty', None),
                    unit_of_qty=getattr(row, 'Unit_of_Qty', None),
                    sale_value=getattr(row, 'Sale_Value', None),
                    tax_value=getattr(row, 'Tax_Value', None),
                    total_value=getattr(row, 'Invoice Value', None),
                    financial_year=getattr(row, 'Financial Year', None),
                    month=getattr(row, 'Month', None)
                )
                session.add(record)
        await session.commit()

    return {"message": "Files merged and saved to database."}

# === Preview Top 100 ===
@router.get("/preview")
async def preview_data(user: str = Depends(get_current_user)):
    async with SessionLocal() as session:
        result = await session.execute(
            select(SaleRecord).where(SaleRecord.user == user).limit(100)
        )
        records = result.scalars().all()
        return [r.__dict__ for r in records]

# === Filtered Summary ===
@router.get("/summary")
async def filtered_summary(
    month: str = "",
    financial_year: str = "",
    product: str = "",
    tax_rate: float = None,
    user: str = Depends(get_current_user)
):
    async with SessionLocal() as session:
        query = select(
            SaleRecord.month,
            SaleRecord.financial_year,
            SaleRecord.product,
            func.sum(SaleRecord.qty).label("Qty"),
            func.sum(SaleRecord.sale_value).label("Sale Value"),
            func.sum(SaleRecord.tax_value).label("Tax Value"),
            func.sum(SaleRecord.total_value).label("Invoice Value"),
            func.avg(SaleRecord.tax_rate).label("Tax Rate")
        ).where(SaleRecord.user == user)

        if month:
            query = query.where(SaleRecord.month == month)
        if financial_year:
            query = query.where(SaleRecord.financial_year == financial_year)
        if product:
            query = query.where(SaleRecord.product == product)
        if tax_rate is not None:
            query = query.where(SaleRecord.tax_rate == tax_rate)

        query = query.group_by(SaleRecord.month, SaleRecord.financial_year, SaleRecord.product)
        result = await session.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

# === Download Filtered Excel ===
@router.get("/download")
async def download_excel(user: str = Depends(get_current_user)):
    async with SessionLocal() as session:
        result = await session.execute(
            select(SaleRecord).where(SaleRecord.user == user)
        )
        records = result.scalars().all()

    df = pd.DataFrame([r.__dict__ for r in records])
    df.drop(columns=["_sa_instance_state"], inplace=True)
    out_file = f"{user}_filtered.xlsx"
    df.to_excel(out_file, index=False)

    return FileResponse(
        out_file,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename=out_file
    )

# === Reset ===
@router.delete("/reset")
async def reset_all(user: str = Depends(get_current_user)):
    user_dir = os.path.join(UPLOAD_BASE, user)
    if os.path.exists(user_dir):
        for f in os.listdir(user_dir):
            os.remove(os.path.join(user_dir, f))

    async with SessionLocal() as session:
        await session.execute(
            SaleRecord.__table__.delete().where(SaleRecord.user == user)
        )
        await session.commit()

    return {"message": "All uploaded files and records removed."}

# Mount all routes
app.include_router(router)
