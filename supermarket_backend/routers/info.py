from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Annotated
from sqlmodel import Session, select
from db.models import Product, Screen, Shelf
from db.database import engine
from dependencies.auth import User, get_current_active_user

router = APIRouter(
    prefix="/info",
    tags=["info"],
    dependencies=[Depends(get_current_active_user)],  # Use a list for dependencies
)

# Request and Response Models
class InfoRequest(BaseModel):
    barcode: int  # Barcode is an integer representing the ID in the database

class ProductInfo(BaseModel):
    id: int
    name: str
    category: str
    price: float
    status: str

class ShelfInfo(BaseModel):
    id: int
    unique_name: str
    location: str
    capacity: int

class ScreenInfo(BaseModel):
    id: int
    name: str
    status: str

class InfoResponse(BaseModel):
    scanned_type: str  # Indicates if the scanned item is a product, shelf, or screen
    product_brief: Optional[ProductInfo] = None
    shelf_brief: Optional[ShelfInfo] = None
    screen_brief: Optional[ScreenInfo] = None

# Dependency for database session
def get_session():
    with Session(engine) as session:
        yield session

@router.post("/", response_model=InfoResponse)
async def get_info(
    request: InfoRequest,
    session: Session = Depends(get_session)
):
    # Determine if the barcode matches a Product, Shelf, or Screen
    product = session.exec(select(Product).where(Product.id == request.barcode)).first()
    if product:
        # If the barcode is for a product, find connected shelf and screen
        shelf = session.exec(select(Shelf).where(Shelf.id == product.shelf_id)).first()
        screen = session.exec(select(Screen).where(Screen.current_display == product.name)).first()  # Assuming screen's current_display stores product name or ID
        return InfoResponse(
            scanned_type="product",
            product_brief=ProductInfo(
                id=product.id,
                name=product.name,
                category=product.category,
                price=product.price,
                status=product.status
            ),
            shelf_brief=ShelfInfo(
                id=shelf.id,
                unique_name=shelf.unique_name,
                location=shelf.location,
                capacity=shelf.capacity
            ) if shelf else None,
            screen_brief=ScreenInfo(
                id=screen.id,
                name=screen.name,
                status=screen.status
            ) if screen else None
        )

    shelf = session.exec(select(Shelf).where(Shelf.id == request.barcode)).first()
    if shelf:
        # If the barcode is for a shelf, find associated product and screen
        product = session.exec(select(Product).where(Product.shelf_id == shelf.id)).first()
        screen = session.exec(select(Screen).where(Screen.shelf_id == shelf.id)).first()
        return InfoResponse(
            scanned_type="shelf",
            product_brief=ProductInfo(
                id=product.id,
                name=product.name,
                category=product.category,
                price=product.price,
                status=product.status
            ) if product else None,
            shelf_brief=ShelfInfo(
                id=shelf.id,
                unique_name=shelf.unique_name,
                location=shelf.location,
                capacity=shelf.capacity
            ),
            screen_brief=ScreenInfo(
                id=screen.id,
                name=screen.name,
                status=screen.status
            ) if screen else None
        )

    screen = session.exec(select(Screen).where(Screen.id == request.barcode)).first()
    if screen:
        # If the barcode is for a screen, find associated product and shelf
        product = session.exec(select(Product).where(Product.name == screen.current_display)).first()  # Assuming `current_display` holds product name or ID
        shelf = session.exec(select(Shelf).where(Shelf.id == screen.shelf_id)).first()
        return InfoResponse(
            scanned_type="screen",
            product_brief=ProductInfo(
                id=product.id,
                name=product.name,
                category=product.category,
                price=product.price,
                status=product.status
            ) if product else None,
            shelf_brief=ShelfInfo(
                id=shelf.id,
                unique_name=shelf.unique_name,
                location=shelf.location,
                capacity=shelf.capacity
            ) if shelf else None,
            screen_brief=ScreenInfo(
                id=screen.id,
                name=screen.name,
                status=screen.status
            )
        )

    # If no match is found
    raise HTTPException(status_code=404, detail="No item found for the given barcode")
