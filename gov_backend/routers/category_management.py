# routers/category_management.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List
from db.database import gov_engine
from db.models import Categories
from dependencies.auth import User, require_Role
router = APIRouter(
    prefix="/category",
    tags=["Category Management"],
)

# Dependency to get a database session
def get_session():
    with Session(gov_engine) as session:
        yield session



@router.get("/get", response_model=List[Categories]) 
def get_categories(
    session: Session = Depends(get_session), 
    current_user: User = Depends(require_Role(["staff"])) 
):
    return session.exec(select(Categories)).all()