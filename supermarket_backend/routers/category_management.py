# routers/category_management.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List
from db.database import engine
from db.gov_models import Categories
from dependencies.auth import get_current_active_user, User, require_Role

router = APIRouter(
    prefix="/category",
    tags=["Category Management"],
)

# Dependency to get a database session
def get_session():
    with Session(engine) as session:
        yield session



@router.get("/get", response_model=List[Categories]) 
def get_categories(
    session: Session = Depends(get_session), 
    curreny_user: User = Depends(require_Role(["owner", "manager"])) 
):
    return session.exec(select(Categories)).all()  