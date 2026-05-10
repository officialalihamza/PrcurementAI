from pydantic import BaseModel
from typing import Optional, List


class CompanyCreate(BaseModel):
    name: str
    company_number: Optional[str] = None
    sic_codes: Optional[List[str]] = []
    postcode: Optional[str] = None
    region: Optional[str] = None
    employees: Optional[int] = None
    turnover: Optional[float] = None
    # Phase 1 extended fields
    legal_structure: Optional[str] = None
    incorporation_date: Optional[str] = None
    primary_sectors: Optional[List[str]] = []
    geographic_coverage: Optional[str] = "regional"
    regions_active: Optional[List[str]] = []
    years_public_sector: Optional[int] = 0
    past_contract_count: Optional[int] = 0
    past_contract_total_value: Optional[float] = None
    certifications: Optional[List[str]] = []
    has_iso_9001: Optional[bool] = False
    has_iso_27001: Optional[bool] = False
    has_cyber_essentials: Optional[bool] = False
    has_modern_slavery: Optional[bool] = False
    has_gdpr_docs: Optional[bool] = False
    has_public_liability: Optional[bool] = False
    turnover_latest: Optional[float] = None
    credit_rating: Optional[str] = None
    onboarding_completed: Optional[bool] = False
    onboarding_step: Optional[int] = 0


class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    company_number: Optional[str] = None
    sic_codes: Optional[List[str]] = None
    postcode: Optional[str] = None
    region: Optional[str] = None
    employees: Optional[int] = None
    turnover: Optional[float] = None
    legal_structure: Optional[str] = None
    incorporation_date: Optional[str] = None
    primary_sectors: Optional[List[str]] = None
    geographic_coverage: Optional[str] = None
    regions_active: Optional[List[str]] = None
    years_public_sector: Optional[int] = None
    past_contract_count: Optional[int] = None
    past_contract_total_value: Optional[float] = None
    certifications: Optional[List[str]] = None
    has_iso_9001: Optional[bool] = None
    has_iso_27001: Optional[bool] = None
    has_cyber_essentials: Optional[bool] = None
    has_modern_slavery: Optional[bool] = None
    has_gdpr_docs: Optional[bool] = None
    has_public_liability: Optional[bool] = None
    turnover_latest: Optional[float] = None
    credit_rating: Optional[str] = None
    onboarding_completed: Optional[bool] = None
    onboarding_step: Optional[int] = None


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
    legal_structure: Optional[str] = None
    incorporation_date: Optional[str] = None
    primary_sectors: Optional[List[str]] = []
    geographic_coverage: Optional[str] = None
    regions_active: Optional[List[str]] = []
    years_public_sector: Optional[int] = None
    past_contract_count: Optional[int] = None
    past_contract_total_value: Optional[float] = None
    certifications: Optional[List[str]] = []
    has_iso_9001: Optional[bool] = False
    has_iso_27001: Optional[bool] = False
    has_cyber_essentials: Optional[bool] = False
    has_modern_slavery: Optional[bool] = False
    has_gdpr_docs: Optional[bool] = False
    has_public_liability: Optional[bool] = False
    turnover_latest: Optional[float] = None
    credit_rating: Optional[str] = None
    onboarding_completed: Optional[bool] = False
    onboarding_step: Optional[int] = None
    created_at: Optional[str] = None
