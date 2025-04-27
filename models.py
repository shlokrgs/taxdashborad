# backend/models.py
from sqlalchemy import Column, Integer, String, Float, Date
from database import Base

class SaleRecord(Base):
    __tablename__ = "sale_records"

    id = Column(Integer, primary_key=True, index=True)
    user = Column(String)
    customer_code = Column(String)
    customer_name = Column(String)
    customer_place = Column(String)
    location_of_supply = Column(String)
    date = Column(Date)
    product = Column(String)
    tax_rate = Column(Float)
    qty = Column(Float)
    unit_of_qty = Column(String)
    sale_value = Column(Float)
    tax_value = Column(Float)
    total_value = Column(Float)
    financial_year = Column(String)
    month = Column(String)
    year = Column(Integer)
