# backend/schemas.py

from pydantic import BaseModel
from typing import List, Optional

# ✅ Used for user registration and login
class User(BaseModel):
    username: str
    password: str

# ✅ Returned after login/register
class Token(BaseModel):
    access_token: str
    token_type: str

# ✅ Uploaded Excel row structure (for edits or processing)
class ExcelRow(BaseModel):
    Customer_Code: Optional[str]
    Customer_Name: Optional[str]
    Customer_Place: Optional[str]
    Location_of_Supply: Optional[str]
    Date: Optional[str]
    Product: Optional[str]
    Tax_Rate: Optional[float]
    Qty: Optional[float]
    Unit_of_Qty: Optional[str]
    Sale_Value: Optional[float]
    Tax_Value: Optional[float]
    Total_Value: Optional[float]
    Financial_Year: Optional[str]

# ✅ For saving edited rows back to backend
class EditedData(BaseModel):
    rows: List[ExcelRow]

# === 📋 Filter Parameters for Summary API ===

class FilterParams(BaseModel):
    Month: Optional[str] = ""
    Financial_Year: Optional[str] = ""
    Product: Optional[str] = ""
    Tax_Rate: Optional[float] = None