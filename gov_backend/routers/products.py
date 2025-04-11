# routers/products.py

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlmodel import Session

from db.database import gov_engine
from db.models import GovProducts, Categories
from dependencies.auth import get_current_active_user, User

router = APIRouter(
    prefix="/product",
    tags=["Product"],
)

# Dependency to get a database session
def get_session():
    with Session(gov_engine) as session:
        yield session

class GetResponse(BaseModel):
    Product: GovProducts
    Category: Categories

# Endpoint to get products
@router.get("/get/", response_model=List[GetResponse])
def templatey(
    session: Session = Depends(get_session),
    # current_user: User = Depends(get_current_active_user)
):
    products = session.exec(select(GovProducts)).scalars().all()
    categories = session.exec(select(Categories)).scalars().all()


    organized_products = []
    for product in products:
        category = next((c for c in categories if c.CategoryID == product.CategoryID), None)
        organized_products.append(GetResponse(Product=product, Category=category))

    return organized_products
