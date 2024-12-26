# routers/product_management.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from pydantic import BaseModel
from db.database import engine
from db.models import Products,PriceHistory, Categories, Promotions
from dependencies.auth import get_current_active_user, User 
from datetime import datetime, date
from sqlalchemy import func
from typing import Optional

router = APIRouter(
    prefix="/product",
    tags=["Product Management"],
)



# Dependency to get a database session
def get_session():
    with Session(engine) as session:
        yield session

class ProductResponse(BaseModel):
    message: str
    product: Products
    price: PriceHistory
class AddRequest(BaseModel):
    Barcode: str
    Name: str
    CategoryID: str
    Price: float

class OrganizedProducts(BaseModel):
    ProductID: int
    ProductName: str
    CategoryID: int
    CategoryName: str
    Price: float
    Discount: float
    DiscountEndDate: Optional[date]
    
class DiscountRequest(BaseModel):
    Discount: float
    EndDate: Optional[date]

class GetResponse(BaseModel):
    Products: list[OrganizedProducts]
    
@router.post("/add", response_model=ProductResponse)
def add_product(
    product_add: AddRequest,
    session: Session = Depends(get_session), 
    current_user: User = Depends(get_current_active_user) 
):
    new_product = Products(
        ProductID=product_add.Barcode,
        ProductName=product_add.Name,
        CategoryID=product_add.CategoryID,
    )
    new_price = PriceHistory(
        ProductID=product_add.Barcode,
        Price=product_add.Price,
        StartDate=datetime.now(),
        ChangedBy=current_user.UserID

    )

    session.add(new_product)
    session.add(new_price)
    session.commit()
    session.refresh(new_product)
    session.refresh(new_price)
    return ProductResponse(
        message="Product added successfully",
        product=new_product,
        price=new_price
                       )



@router.get("/get", response_model=GetResponse)
def get_products(
    session: Session = Depends(get_session),
    current_user=Depends(get_current_active_user)
):
    # Subquery to get the current price
    current_price_subquery = (
        select(PriceHistory.ProductID, PriceHistory.Price)
        .where(PriceHistory.EndDate == None)
        .subquery()
    )

    # Subquery to get the active discount
    current_discount_subquery = (
        select(
            Promotions.ProductID,
            Promotions.Discount,
            Promotions.EndDate
        )
        .where(Promotions.EndDate > datetime.now())
        .subquery()
    )

    query = (
        select(
            Products.ProductID,
            Products.ProductName,
            Products.CategoryID,
            Categories.CategoryName,
            current_price_subquery.c.Price.label("Price"),
            func.coalesce(current_discount_subquery.c.Discount, 0).label("Discount"),
            current_discount_subquery.c.EndDate.label("DiscountEndDate")
        )
        .outerjoin(Categories, Categories.CategoryID == Products.CategoryID)
        .outerjoin(current_price_subquery, current_price_subquery.c.ProductID == Products.ProductID)
        .outerjoin(current_discount_subquery, current_discount_subquery.c.ProductID == Products.ProductID)
    )

    # Execute the query
    result = session.exec(query)
    # Construct the response
    products = [
        OrganizedProducts(
            ProductID=row.ProductID,
            ProductName=row.ProductName,
            CategoryID=row.CategoryID,
            CategoryName=row.CategoryName,
            Price=row.Price,
            Discount=row.Discount,
            DiscountEndDate=row.DiscountEndDate
        )
        for row in result
    ]

    return GetResponse(Products=products)


@router.put("/update_price/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    new_price: float,
    session: Session = Depends(get_session), 
    current_user: User = Depends(get_current_active_user) 
):
    product = session.exec(select(Products).where(Products.ProductID == product_id)).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")
    product_print = Products(
        ProductID=product.ProductID,
        ProductName=product.ProductName,
        CategoryID=product.CategoryID,
        Description=product.Description
    )
    old_price = session.exec(
        select(PriceHistory)
        .where(PriceHistory.ProductID == product_id)
        .where(PriceHistory.EndDate.is_(None))
    ).first()
    old_price.EndDate = datetime.now()
    session.add(old_price)
    session.commit()
    price_history = PriceHistory(
        ProductID=product_id,
        Price=new_price,
        StartDate=datetime.now(),
        ChangedBy=current_user.UserID
    )
    session.add(price_history)
    session.commit()
    session.refresh(price_history)
    return ProductResponse(
        message=f"Price updated successfully and old price ({old_price.Price}) archived", 
        product=product_print, 
        price=price_history
    )


@router.put("/update_discount/{product_id}", response_model=ProductResponse)
def update_discount(
    product_id: int,
    new_discount: DiscountRequest,
    session: Session = Depends(get_session), 
    current_user: User = Depends(get_current_active_user) 
):
    product = session.exec(select(Products).where(Products.ProductID == product_id)).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")
    product_print = Products(
        ProductID=product.ProductID,
        ProductName=product.ProductName,
        CategoryID=product.CategoryID,
        Description=product.Description
    )
    if new_discount.EndDate < datetime.now().date():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Discount end date must be in the future.")
    # Fetch all active promotions for the product
    promotions = session.exec(
        select(Promotions)
        .where(Promotions.ProductID == product_id)
        .where(Promotions.EndDate > datetime.now())
    ).all()

    # Update the end date of current promotions
    for promotion in promotions:
        promotion.EndDate = datetime.now()
        session.add(promotion)

    session.commit()
    
    promotion = Promotions(
            ProductID=product_id,
            Discount= new_discount.Discount,
            StartDate=datetime.now(),
            EndDate= new_discount.EndDate,
            ChangedBy=current_user.UserID
        )
    session.add(promotion)
    session.commit()
    session.refresh(promotion)
    return ProductResponse(message="Discount updated successfully", product=product_print, price=promotion)
