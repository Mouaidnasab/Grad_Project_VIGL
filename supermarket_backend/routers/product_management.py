# routers/product_management.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from pydantic import BaseModel
from db.database import engine
from db.models import ProductScreen, Products, PriceHistory,  Promotions
from db.gov_models import  GovProducts, Penalties, GovPriceHistory, PenaltyStatusEnum
from db.gov_database import gov_engine
from dependencies.auth import get_current_active_user, User, require_Role
from datetime import datetime, date, timedelta
from sqlalchemy import func, text
from typing import List, Optional
import requests


router = APIRouter(
    prefix="/product",
    tags=["Product Management"],
)



# Dependency to get a database session
def get_session():
    with Session(engine) as session:
        yield session

def get_gov_session():
    with Session(gov_engine) as session:
        yield session

class ProductResponse(BaseModel):
    message: str
    product: Products
    price: PriceHistory

class DiscountResponse(BaseModel):
    message: str
    product: Products
    promotion: Promotions

class AddRequest(BaseModel):
    Barcode: str
    Price: float

class OrganizedProducts(BaseModel):
    ProductID: int
    ProductName: str
    CategoryID: int
    CategoryName: str
    Price: float
    SuggestedPrice: float
    Threshold: float
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
    gov_session: Session = Depends(get_gov_session),
    current_user: User = Depends(get_current_active_user) 
):
    
    # Check if the product already exists
    existing_product = session.exec(
        select(Products).where(Products.ProductID == product_add.Barcode)
    ).first()
    if existing_product:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Product already exists.")
    
    # Check if the product exists in the government database
    gov_product = gov_session.exec(
        select(GovProducts).where(GovProducts.ProductID == product_add.Barcode)
    ).first()
    if not gov_product:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Product does not exist in government database.")
    

    new_product = Products(
        ProductID=product_add.Barcode,
    )
    new_price = PriceHistory(
        ProductID=product_add.Barcode,
        Price=product_add.Price,
        StartDate=datetime.now(),
        ChangedBy=current_user.UserID

    )
    SupermarketID = session.exec(text("SELECT DATABASE();")).scalar()[1:]
    
    gov_price = gov_session.exec(
        select(GovPriceHistory).where(GovPriceHistory.ProductID == product_add.Barcode)
    ).first()
    if gov_price and gov_price.Threshold < product_add.Price:
        penalty = Penalties(
            ProductID=product_add.Barcode,
            Amount= "1000",
            Reason="Price over threshold",
            IssuedDate=datetime.now(),
            LastPaymentDate=datetime.now() + timedelta(days=15),
            SupermarketID=SupermarketID,
            Status=PenaltyStatusEnum.PENDING
        )
        gov_session.add(penalty)
        gov_session.commit()
        gov_session.refresh(penalty)
        


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
    current_user = Depends(get_current_active_user)
):
    # Step 1: Get local supermarket products
    supermarket_products = session.exec(select(Products)).all()
    product_ids = [product.ProductID for product in supermarket_products]
    local_product_ids_set = set(product_ids)

    # Step 2: Query local PriceHistory for active prices (records with EndDate as None)
    price_query = select(PriceHistory).where(
        PriceHistory.ProductID.in_(product_ids),
        PriceHistory.EndDate == None
    )
    local_prices_result = session.exec(price_query).all()
    # Build a dictionary mapping ProductID to Price
    local_prices = {price.ProductID: price.Price for price in local_prices_result}

    # Step 3: Query local Promotions for active discount (records where EndDate is in the future)
    promo_query = select(Promotions).where(
        Promotions.ProductID.in_(product_ids),
        Promotions.EndDate > datetime.now()
    )
    local_promos_result = session.exec(promo_query).all()
    # Build a dictionary mapping ProductID to a tuple (Discount, DiscountEndDate)
    local_promos = {
        promo.ProductID: (promo.Discount, promo.EndDate)
        for promo in local_promos_result
    }
    
    # Step 4: Call the government backend to fetch product data
    try:
        gov_response = requests.get("http://localhost:8001/product/get")
        gov_response.raise_for_status()
        gov_products_data = gov_response.json()
    except Exception as e:
       raise HTTPException(status_code=500, detail="Error fetching government products data")

    # Step 5: Merge data from local queries with government products data, returning only local products
    products = []
    for item in gov_products_data:
        product_info = item["Product"]
        # Only process products that exist in our local supermarket data
        if product_info["ProductID"] not in local_product_ids_set:
            continue
            
        category_info = item["Category"]
        price_info = item["Price"]
        product_id = product_info["ProductID"]

        # Retrieve the local price if available (can be None)
        local_price = local_prices.get(product_id)
        # Retrieve promotion info; default to (0, None) if there is no active promotion
        discount, discount_end = local_promos.get(product_id, (0, None))
        
        product = OrganizedProducts(
            ProductID=product_info["ProductID"],
            ProductName=product_info["ProductName"],
            CategoryID=product_info["CategoryID"],
            CategoryName=category_info["CategoryName"],
            Price=float(local_price) if local_price is not None else 0,
            SuggestedPrice=price_info["SuggestedPrice"],
            Threshold=price_info["Threshold"],
            Discount=discount,
            DiscountEndDate=discount_end
        )
        products.append(product)

    # Return the merged response encapsulated in GetResponse
    return GetResponse(Products=products)


@router.put("/update_price/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    new_price: float,
    session: Session = Depends(get_session), 
    gov_session: Session = Depends(get_gov_session),
    current_user: User = Depends(get_current_active_user) 
):
    product = session.exec(select(Products).where(Products.ProductID == product_id)).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")

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

    SupermarketID = session.exec(text("SELECT DATABASE();")).scalar()[1:]

    gov_price = gov_session.exec(
        select(GovPriceHistory).where(GovPriceHistory.ProductID == product.ProductID)
    ).first()
    if gov_price and gov_price.Threshold < price_history.Price:


        penalty = Penalties(
            ProductID=product.ProductID,
            Amount= "1000",
            Reason="Price over threshold",
            IssuedDate=datetime.now(),
            LastPaymentDate=datetime.now() + timedelta(days=15),
            SupermarketID=SupermarketID,
            Status=PenaltyStatusEnum.PENDING
        )
        gov_session.add(penalty)
        gov_session.commit()
        gov_session.refresh(penalty)
    return ProductResponse(
        message=f"Price updated successfully and old price ({old_price.Price}) archived", 
        price=price_history,
        product=product
    )


@router.put("/update_discount/{product_id}", response_model=DiscountResponse)
def update_discount(
    product_id: int,
    new_discount: DiscountRequest,
    session: Session = Depends(get_session), 
    current_user: User = Depends(get_current_active_user) 
):
    
    product = session.exec(select(Products).where(Products.ProductID == product_id)).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")

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
            PromotionName="Discount",
            ProductID=product_id,
            Discount= new_discount.Discount,
            StartDate=datetime.now(),
            EndDate= new_discount.EndDate,
            CreatedBy=current_user.UserID
        )


    session.add(promotion)
    session.commit()
    session.refresh(promotion)
    return DiscountResponse(message="Discount updated successfully", promotion=promotion)


@router.delete("/delete/{product_id}")
def delete_product(
    product_id: int,
    session: Session = Depends(get_session), 
    current_user: User = Depends(get_current_active_user) 
):
    price_histories = session.exec(
        select(PriceHistory).where(PriceHistory.ProductID == product_id)
    ).all()
    for price_history in price_histories:
        session.delete(price_history)

    promotions = session.exec(
        select(Promotions).where(Promotions.ProductID == product_id)
    ).all()
    for promotion in promotions:
        session.delete(promotion)

    product_screens = session.exec(
        select(ProductScreen).where(ProductScreen.ProductID == product_id)
    ).all()
    for product_screen in product_screens:
        product_screen.ProductID = None

    session.commit()

    product = session.exec(select(Products).where(Products.ProductID == product_id)).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")

    session.delete(product)
    session.commit()
    return {
        "message": "Product deleted successfully", }

@router.get("/get_penalties", response_model=List[Penalties])
def get_penalties(
    session: Session = Depends(get_session), 
    current_user: User = Depends(get_current_active_user) 
):
    SupermarketID = session.exec(text("SELECT DATABASE();")).scalar()[1:]

    try:
        gov_response = requests.get("http://localhost:8001/penalty/get/" + SupermarketID)
        gov_response.raise_for_status()
        gov_penalties_data = gov_response.json()
        print(gov_penalties_data)
    except Exception as e:
       raise HTTPException(status_code=500, detail="Error fetching government products data")
    
    return gov_penalties_data
