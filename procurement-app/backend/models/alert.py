from pydantic import BaseModel
from typing import Optional, List, Dict, Any


class AlertFilters(BaseModel):
    cpv: Optional[List[str]] = []
    regions: Optional[List[str]] = []
    value_min: Optional[float] = 0
    value_max: Optional[float] = 10_000_000
    sme_only: Optional[bool] = False
    keyword: Optional[str] = None


class AlertCreate(BaseModel):
    name: str
    filters: AlertFilters
    frequency: str  # daily, weekly, instant


class AlertUpdate(BaseModel):
    name: Optional[str] = None
    filters: Optional[AlertFilters] = None
    frequency: Optional[str] = None
    active: Optional[bool] = None


class AlertResponse(BaseModel):
    id: str
    user_id: str
    name: str
    filters: Dict[str, Any]
    frequency: str
    active: bool
    created_at: Optional[str] = None


class AlertHistoryResponse(BaseModel):
    id: str
    alert_id: str
    contracts: List[Dict[str, Any]]
    sent_at: str
