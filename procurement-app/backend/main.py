from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

from routers import auth, contracts, dashboard, alerts, company, eda, analytics

app = FastAPI(
    title="UK Procurement API",
    description="SaaS platform for UK government contract discovery",
    version="1.0.0",
)

origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(contracts.router, prefix="/contracts", tags=["contracts"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
app.include_router(alerts.router, prefix="/alerts", tags=["alerts"])
app.include_router(company.router, prefix="/company", tags=["company"])
app.include_router(eda.router, prefix="/dashboard", tags=["eda"])
app.include_router(analytics.router, prefix="/analytics", tags=["analytics"])


@app.get("/")
def root():
    return {"status": "ok", "message": "UK Procurement API v1.0.0"}


@app.get("/health")
def health():
    return {"status": "healthy"}
