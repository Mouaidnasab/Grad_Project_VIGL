# routers/products.py

from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlmodel import Session, create_engine


from db.database import gov_engine
from db.models import GovPriceHistory, GovProducts, Categories, GovPriceHistory, Supermarkets
from dependencies.auth import get_current_active_user, User, require_Role
from db.create_supermarket import BASE_MYSQL_URL, Products, PriceHistory, Promotions

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
    Price: GovPriceHistory

class SupermarketProducts(BaseModel):
    Product: GovProducts
    Category: Categories
    GovPrice: GovPriceHistory
    SupermarketPrice: PriceHistory
    Promotion: Optional[Promotions] = None


class GetSupermarketResponse(BaseModel):
    Supermarket: Supermarkets
    Products: List[SupermarketProducts]

class AddRequest(BaseModel):
    Barcode: str
    SuggestedPrice: float
    Threshold: int
    ProductName: str
    CategoryID: int
    Description: str

class UpdateRequest(BaseModel):
    SuggestedPrice: Optional[float] = None
    Threshold: Optional[int] = None
    ProductName: Optional[str] = None
    Description: Optional[str] = None


# Endpoint to get products
@router.get("/get/", response_model=List[GetResponse])
def get_products(
    session: Session = Depends(get_session),
    # current_user: User = Depends(get_current_active_user)
):
    products = session.exec(select(GovProducts)).scalars().all()
    categories = session.exec(select(Categories)).scalars().all()
    gov_prices = session.exec(select(GovPriceHistory)).scalars().all()


    organized_products = []
    for product in products:
        category = next((c for c in categories if c.CategoryID == product.CategoryID), None)
        gov_price = next((p for p in gov_prices if p.ProductID == product.ProductID and p.EndDate is None), None)
        organized_products.append(GetResponse(Product=product, Category=category, Price=gov_price))

    return organized_products

# Endpoint to create a new product
@router.post("/create")
def create_product(
    product: AddRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_Role(["staff"]))
):
    # Check if the category exists
    category = session.get(Categories, product.CategoryID)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    # Check if the product already exists
    existing_product = session.exec(select(GovProducts).where(GovProducts.ProductName == product.ProductName)).first()
    if existing_product:
        raise HTTPException(status_code=400, detail="Product already exists")
    

    new_product = GovProducts(
        ProductID=product.Barcode,
        ProductName=product.ProductName,
        CategoryID=product.CategoryID,
        Description=product.Description
    )   
    new_price = GovPriceHistory(
        ProductID=product.Barcode,
        SuggestedPrice=product.SuggestedPrice,
        Threshold=float(product.SuggestedPrice) * (float(product.Threshold)/100 + 1),
        StartDate=datetime.now(),
        EndDate=None,
        ChangedBy=current_user.UserID

    )

    # Add the new product and price history to the session and commit
    session.add(new_product)
    session.add(new_price)
    session.commit()
    session.refresh(new_product)
    session.refresh(new_price)
    return {
        "message": "Product created successfully",
        "product": new_product,
        "price_history": new_price
    }


# Endpoint to update a product
@router.put("/update/{product_id}")
def update_product(
    product_id: int,
    product: UpdateRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_Role(["staff"]))
):
    # 1) load the existing product
    existing_product = session.get(GovProducts, product_id)
    if not existing_product:
        raise HTTPException(status_code=404, detail="Product not found")

    # 2) update its fields
    if product.ProductName is not None:
        existing_product.ProductName = product.ProductName
    if product.Description is not None:
        existing_product.Description = product.Description

    if product.SuggestedPrice is not None or product.Threshold is not None:
        # 3) fetch the active price history entries as model instances
        active_prices = session.exec(
            select(GovPriceHistory)
            .where(GovPriceHistory.ProductID == product_id)
            .where(GovPriceHistory.EndDate.is_(None))
        ).scalars().all()

        if not active_prices:
            raise HTTPException(status_code=404, detail="Active price history not found")

        # 4) close out old price histories
        now = datetime.now()
        for price_history in active_prices:
            price_history.EndDate = now

        # 5) create the new price history row
        new_price = GovPriceHistory(
            ProductID=product_id,
            SuggestedPrice=product.SuggestedPrice,
            Threshold=float(product.SuggestedPrice) * (float(product.Threshold)/100 + 1),
            StartDate=now,
            EndDate=None,
            ChangedBy=current_user.UserID
        )

    if 'new_price' in locals():
        session.add(new_price)
    session.commit()
    if 'new_price' in locals():
        session.refresh(new_price)
    session.refresh(existing_product)
    return {
        "message": "Product updated successfully",
        "product": existing_product,
        "price_history": new_price if 'new_price' in locals() else None
    }


# Endpoint to get a specific product by ID
@router.get("/get/{product_id}", response_model=GetResponse)
def get_product(
    product_id: int,
    session: Session = Depends(get_session),
    # current_user: User = Depends(get_current_active_user)
):
    product = session.get(GovProducts, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    category = session.get(Categories, product.CategoryID)
    return GetResponse(Product=product, Category=category)


@router.get("/get_from_all_supermarkets", response_model=List[GetSupermarketResponse])
def get_products_from_all_supermarkets(
    session: Session = Depends(get_session),
    # current_user: User = Depends(get_current_active_user)
):
    supermarkets = session.scalars(select(Supermarkets)).all()
    results = []

    gov_products = session.scalars(select(GovProducts)).all()
    categories = session.scalars(select(Categories)).all()

    if supermarkets:
        for supermarket in supermarkets:
            supermarket_products = []

            supermarket_db = "s" + str(supermarket.SupermarketID)
            new_engine = create_engine(f"{BASE_MYSQL_URL}{supermarket_db}")

            with Session(new_engine) as supermarket_session:
                products = supermarket_session.scalars(select(Products)).all()

            for product in products:
                with Session(new_engine) as supermarket_session:
                    supermarket_price = supermarket_session.scalar(
                        select(PriceHistory)
                        .where(PriceHistory.ProductID == product.ProductID, 
                               PriceHistory.EndDate == None)
                    )
                    supermarket_promo = supermarket_session.scalar(
                        select(Promotions)
                        .where(Promotions.ProductID == product.ProductID, 
                               Promotions.EndDate > datetime.now())
                    )
                gov_price = session.scalar(
                    select(GovPriceHistory)
                    .where(GovPriceHistory.ProductID == product.ProductID, 
                           GovPriceHistory.EndDate == None)
                )

                gov_product = next((gp for gp in gov_products if gp.ProductID == product.ProductID), None)
                category = None
                if gov_product:
                    category = next((cat for cat in categories if cat.CategoryID == gov_product.CategoryID), None)

                supermarket_products.append(
                    SupermarketProducts(
                        Product=gov_product,
                        Category=category,
                        GovPrice=gov_price,
                        SupermarketPrice=supermarket_price,
                        Promotion=supermarket_promo
                    )
                )

            results.append(
                GetSupermarketResponse(
                    Supermarket=supermarket,
                    Products=supermarket_products
                )
            )

    return results
