from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Annotated
from sqlmodel import Session, select
from db.models import Product, Screen, Shelf
from db.database import engine
from dependencies.auth import User, get_current_active_user

router = APIRouter(
    prefix="/assign",
    tags=["assign"],
    dependencies=[Depends(get_current_active_user)],  # Enforce authentication on all endpoints
)

# Request Models
class AssignProductRequest(BaseModel):
    product_id: int
    shelf_id: int

class AssignScreenRequest(BaseModel):
    screen_id: int
    shelf_id: int

# Dependency for database session
def get_session():
    with Session(engine) as session:
        yield session

@router.post("/product-to-shelf")
async def assign_product_to_shelf(
    request: AssignProductRequest,
    session: Session = Depends(get_session)
):
    # Check if the shelf exists
    shelf = session.exec(select(Shelf).where(Shelf.id == request.shelf_id)).first()
    if not shelf:
        raise HTTPException(status_code=404, detail="Shelf not found")

    # Check if the product exists
    product = session.exec(select(Product).where(Product.id == request.product_id)).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Check if the shelf is already assigned to another product
    existing_product = session.exec(select(Product).where(Product.shelf_id == request.shelf_id)).first()
    if existing_product:
        raise HTTPException(status_code=400, detail=f"Shelf {request.shelf_id} is already assigned to Product ID {existing_product.id}")

    # Assign the product to the shelf
    product.shelf_id = request.shelf_id
    session.add(product)
    session.commit()
    session.refresh(product)

    return {"message": "Product successfully assigned to shelf", "product_id": product.id, "shelf_id": shelf.id}

@router.post("/screen-to-shelf")
async def assign_screen_to_shelf(
    request: AssignScreenRequest,
    session: Session = Depends(get_session)
):
    # Check if the shelf exists
    shelf = session.exec(select(Shelf).where(Shelf.id == request.shelf_id)).first()
    if not shelf:
        raise HTTPException(status_code=404, detail="Shelf not found")

    # Check if the screen exists
    screen = session.exec(select(Screen).where(Screen.id == request.screen_id)).first()
    if not screen:
        raise HTTPException(status_code=404, detail="Screen not found")

    # Check if the shelf is already assigned to another screen
    existing_screen = session.exec(select(Screen).where(Screen.shelf_id == request.shelf_id)).first()
    if existing_screen:
        raise HTTPException(status_code=400, detail=f"Shelf {request.shelf_id} is already assigned to Screen ID {existing_screen.id}")

    # Assign the screen to the shelf
    screen.shelf_id = request.shelf_id
    session.add(screen)
    session.commit()
    session.refresh(screen)

    return {"message": "Screen successfully assigned to shelf", "screen_id": screen.id, "shelf_id": shelf.id}
