from pydantic import BaseModel
from typing import Optional, List
import uuid


class CompanyCreate(BaseModel):
    name: str
    company_number: Optional[str] = None
    sic_codes: Optional[List[str]] = []
    postcode: Optional[str] = None
    region: Optional[str] = None
    employees: Optional[int] = None
    turnover: Optional[float] = None


class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    company_number: Optional[str] = None
    sic_codes: Optional[List[str]] = None
    postcode: Optional[str] = None
    region: Optional[str] = None
    employees: Optional[int] = None
    turnover: Optional[float] = None


class CompanyResponse(BaseModel):
    id: str
    user_id: str
    name: str
    company_number: Optional[str] = None
    sic_codes: Optional[List[str]] = []
    postcode: Optional[str] = None
    region: Optional[str] = None
    employees: Optional[int] = None
    turnover: Optional[float] = None
    created_at: Optional[str] = None
