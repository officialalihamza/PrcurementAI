from pydantic import BaseModel
from typing import Optional, List


class ContractSearchParams(BaseModel):
    cpv: Optional[List[str]] = []
    regions: Optional[List[str]] = []
    value_min: Optional[float] = 0
    value_max: Optional[float] = 10_000_000
    keyword: Optional[str] = None
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    sme_flag: Optional[str] = None  # all, sme, large
    sort: Optional[str] = "newest"  # newest, value, deadline
    page: Optional[int] = 1
    page_size: Optional[int] = 20


class DocumentLink(BaseModel):
    url:   str
    type:  Optional[str] = ""
    label: Optional[str] = "Document"
    title: Optional[str] = ""


class ContractResponse(BaseModel):
    ocid: str
    title: str
    buyer: str
    buyer_region: Optional[str] = None
    value: Optional[float] = None
    currency: str = "GBP"
    region: Optional[str] = None
    deadline: Optional[str] = None
    published: Optional[str] = None
    sme_suitable: Optional[bool] = None
    cpv_codes: Optional[List[str]] = []
    cpv_descriptions: Optional[List[str]] = []
    description: Optional[str] = None
    status: Optional[str] = None
    url: Optional[str] = None
    match_score: Optional[int] = 0
    documents: Optional[List[DocumentLink]] = []


class SavedContractCreate(BaseModel):
    ocid: str
    notes: Optional[str] = None


class SavedContractResponse(BaseModel):
    id: str
    user_id: str
    ocid: str
    saved_at: str
    notes: Optional[str] = None
