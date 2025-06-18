# routers/products.py

from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlmodel import Session, create_engine
import json
from pathlib import Path


from db.database import gov_engine
from db.models import (
    GovPriceHistory,
    GovProducts,
    Categories,
    Supermarkets,
)
from dependencies.auth import User, require_Role
from db.create_supermarket import BASE_MYSQL_URL, Products, PriceHistory

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


class GetProductsFromSupermarketResponse(BaseModel):
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


@router.post("/create/")
def create_product(
    product: AddRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_Role(["staff"])),
):
    category = session.get(Categories, product.CategoryID)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    existing_product = session.exec(
        select(GovProducts).where(GovProducts.ProductName == product.ProductName)
    ).first()
    if existing_product:
        raise HTTPException(status_code=400, detail="Product already exists")

    new_product = GovProducts(
        ProductID=product.Barcode,
        ProductName=product.ProductName,
        CategoryID=product.CategoryID,
        Description=product.Description,
    )
    new_price = GovPriceHistory(
        ProductID=product.Barcode,
        SuggestedPrice=product.SuggestedPrice,
        Threshold=float(product.SuggestedPrice) * (float(product.Threshold) / 100 + 1),
        StartDate=datetime.now(),
        EndDate=None,
        ChangedBy=current_user.UserID,
    )

    session.add(new_product)
    session.add(new_price)
    session.commit()
    session.refresh(new_product)
    session.refresh(new_price)
    return {
        "message": "Product created successfully",
        "product": new_product,
        "price_history": new_price,
    }


@router.put("/update/{product_id}/")
def update_product(
    product_id: int,
    product: UpdateRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_Role(["staff"])),
):
    existing_product = session.get(GovProducts, product_id)
    if not existing_product:
        raise HTTPException(status_code=404, detail="Product not found")

    existing_product.ProductName = product.ProductName
    existing_product.Description = product.Description

    active_prices = (
        session.exec(
            select(GovPriceHistory)
            .where(GovPriceHistory.ProductID == product_id)  # type: ignore
            .where(GovPriceHistory.EndDate.is_(None))  # type: ignore
        )  # type: ignore
        .scalars()
        .all()
    )

    if not active_prices[0].SuggestedPrice == product.SuggestedPrice:
        product.Threshold = round(
            (active_prices[0].Threshold / active_prices[0].SuggestedPrice - 1) * 100
        )
        print(product.Threshold)

    now = datetime.now()
    for price_history in active_prices:
        price_history.EndDate = now

    new_price = GovPriceHistory(
        ProductID=product_id,
        SuggestedPrice=product.SuggestedPrice,
        Threshold=float(product.SuggestedPrice) * (float(product.Threshold) / 100 + 1),
        StartDate=now,
        EndDate=None,
        ChangedBy=current_user.UserID,
    )

    if "new_price" in locals():
        session.add(new_price)
    session.commit()
    if "new_price" in locals():
        session.refresh(new_price)
    session.refresh(existing_product)
    return {
        "message": "Product updated successfully",
        "product": existing_product,
        "price_history": new_price if "new_price" in locals() else None,
    }


@router.get("/get/", response_model=List[GetResponse])
def get_products(
    session: Session = Depends(get_session),
):
    products = session.scalars(select(GovProducts)).all()
    categories = session.scalars(select(Categories)).all()
    gov_prices = session.scalars(select(GovPriceHistory)).all()

    organized_products = []
    for product in products:
        category = next(
            (c for c in categories if c.CategoryID == product.CategoryID), None
        )
        gov_price = next(
            (
                p
                for p in gov_prices
                if p.ProductID == product.ProductID and p.EndDate is None
            ),
            None,
        )
        organized_products.append(
            GetResponse(Product=product, Category=category, Price=gov_price)
        )

    return organized_products


@router.get("/get/{product_id}/", response_model=GetResponse)
def get_specific_product(
    product_id: int,
    session: Session = Depends(get_session),
):
    product = session.get(GovProducts, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    category = session.get(Categories, product.CategoryID)

    Price = session.scalar(
        select(GovPriceHistory)
        .where(GovPriceHistory.ProductID == product_id)
        .where(GovPriceHistory.EndDate.is_(None))
    )
    return GetResponse(Product=product, Category=category, Price=Price)


@router.get(
    "/get_from_all_supermarkets/",
    response_model=List[GetProductsFromSupermarketResponse],
)
def get_products_from_all_supermarkets(
    session: Session = Depends(get_session),
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
                        select(PriceHistory).where(
                            PriceHistory.ProductID == product.ProductID,
                            PriceHistory.EndDate == None,
                        )
                    )

                gov_price = session.scalar(
                    select(GovPriceHistory).where(
                        GovPriceHistory.ProductID == product.ProductID,
                        GovPriceHistory.EndDate == None,
                    )
                )

                gov_product = next(
                    (gp for gp in gov_products if gp.ProductID == product.ProductID),
                    None,
                )
                category = None
                if gov_product:
                    category = next(
                        (
                            cat
                            for cat in categories
                            if cat.CategoryID == gov_product.CategoryID
                        ),
                        None,
                    )

                supermarket_products.append(
                    SupermarketProducts(
                        Product=gov_product,
                        Category=category,
                        GovPrice=gov_price,
                        SupermarketPrice=supermarket_price,
                    )
                )

            results.append(
                GetProductsFromSupermarketResponse(
                    Supermarket=supermarket, Products=supermarket_products
                )
            )

    return results


@router.get(
    "/get_from_supermarket/{supermarket_id}/",
    response_model=GetProductsFromSupermarketResponse,
)
def get_products_from_specific_supermarket(
    supermarket_id: int,
    session: Session = Depends(get_session),
):
    supermarket = session.get(Supermarkets, supermarket_id)

    gov_products = session.scalars(select(GovProducts)).all()
    categories = session.scalars(select(Categories)).all()

    if not supermarket:
        raise HTTPException(status_code=404, detail="Supermarket not found")

    supermarket_products = []

    supermarket_db = "s" + str(supermarket.SupermarketID)
    new_engine = create_engine(f"{BASE_MYSQL_URL}{supermarket_db}")

    with Session(new_engine) as supermarket_session:
        products = supermarket_session.scalars(select(Products)).all()

    for product in products:
        with Session(new_engine) as supermarket_session:
            supermarket_price = supermarket_session.scalar(
                select(PriceHistory).where(
                    PriceHistory.ProductID == product.ProductID,
                    PriceHistory.EndDate == None,
                )
            )

        gov_price = session.scalar(
            select(GovPriceHistory).where(
                GovPriceHistory.ProductID == product.ProductID,
                GovPriceHistory.EndDate == None,
            )
        )

        gov_product = next(
            (gp for gp in gov_products if gp.ProductID == product.ProductID), None
        )
        category = None
        if gov_product:
            category = next(
                (cat for cat in categories if cat.CategoryID == gov_product.CategoryID),
                None,
            )

        supermarket_products.append(
            SupermarketProducts(
                Product=gov_product,
                Category=category,
                GovPrice=gov_price,
                SupermarketPrice=supermarket_price,
            )
        )

    return GetProductsFromSupermarketResponse(
        Supermarket=supermarket, Products=supermarket_products
    )


class SupermarketPriceResponse(BaseModel):
    SupermarketName: str
    SupermarketAddress: Optional[str]
    Price: Optional[float] = None


class GetProductPricesResponse(BaseModel):
    Product: GovProducts
    GovPrice: Optional[GovPriceHistory] = None
    SupermarketPrices: List[SupermarketPriceResponse]


@router.get(
    "/prices/full/{product_id}/",
    response_model=GetProductPricesResponse,
)
def get_product_prices(
    product_id: int,
    session: Session = Depends(get_session),
):
    gov_product = session.get(GovProducts, product_id)
    if not gov_product:
        raise HTTPException(status_code=404, detail="Product not found")

    gov_price = session.scalar(
        select(GovPriceHistory).where(
            GovPriceHistory.ProductID == product_id,
            GovPriceHistory.EndDate.is_(None),
        )
    )

    supermarkets = session.scalars(select(Supermarkets)).all()
    supermarket_prices: List[SupermarketPriceResponse] = []

    for sm in supermarkets:
        db_name = f"s{sm.SupermarketID}"
        engine = create_engine(f"{BASE_MYSQL_URL}{db_name}")

        with Session(engine) as sm_session:
            price_rec = sm_session.scalar(
                select(PriceHistory).where(
                    PriceHistory.ProductID == product_id,
                    PriceHistory.EndDate.is_(None),
                )
            )

        if price_rec is None:
            continue

        price_value = price_rec.Price

        supermarket_prices.append(
            SupermarketPriceResponse(
                SupermarketName=sm.RegisteredName,
                SupermarketAddress=sm.Address,
                Price=price_value,
            )
        )

    return GetProductPricesResponse(
        Product=gov_product,
        GovPrice=gov_price,
        SupermarketPrices=supermarket_prices,
    )


class SuggestedProduct(BaseModel):
    ProductName: str
    CategoryID: int
    CategoryName: str
    Description: str
    Suppermarket: str


@router.post("/upload_suggested_product/")
async def upload_suggested_product(data: SuggestedProduct):
    file_path = Path("src/suggested_products.json")

    if file_path.exists():
        with open(file_path, "r") as f:
            raw = json.load(f)
        if isinstance(raw, list):
            products: dict[str, dict] = {
                str(i + 1): entry for i, entry in enumerate(raw)
            }
        else:
            products: dict[str, dict] = raw
    else:
        products = {}

    if products:
        max_id = max(int(k) for k in products)
        next_id = max_id + 1
    else:
        next_id = 1

    new_entry = {
        "ProductName": data.ProductName,
        "CategoryID": data.CategoryID,
        "CategoryName": data.CategoryName,
        "Description": data.Description,
        "Suppermarket": data.Suppermarket,
        "DateCreated": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    }

    products[str(next_id)] = new_entry

    with open(file_path, "w") as f:
        json.dump(products, f, indent=4)

    return {"message": "Suggested product saved successfully", "id": next_id}


@router.get("/get_suggested_products/")
async def get_suggested_products():
    file_path = Path("src/suggested_products.json")

    if file_path.exists():
        with open(file_path, "r") as file:
            products = json.load(file)
    else:
        products = []

    return {"suggested_products": products}


@router.delete("/delete_suggested_product/{id}/")
async def delete_suggested_product(id: int):
    file_path = Path("src/suggested_products.json")

    if file_path.exists():
        with open(file_path, "r") as f:
            raw = json.load(f)
        if isinstance(raw, list):
            products: dict[str, dict] = {
                str(i + 1): entry for i, entry in enumerate(raw)
            }
        else:
            products = raw
    else:
        products = {}

    key = str(id)
    if key in products:
        del products[key]
    else:
        raise HTTPException(status_code=404, detail="No suggested product with that ID")

    with open(file_path, "w") as f:
        json.dump(products, f, indent=4)

    return {"message": "Suggested product deleted successfully", "id": id}
