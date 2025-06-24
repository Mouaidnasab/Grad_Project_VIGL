# routers/product_management.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from pydantic import BaseModel
from db.database import engine
from db.models import ProductScreen, Products, PriceHistory, Promotions
from db.gov_models import (
    Categories,
    GovProducts,
    Penalties,
    GovPriceHistory,
    PenaltyStatusEnum,
)
from db.gov_database import gov_engine
from dependencies.auth import get_current_active_user, User
from datetime import datetime, date, timedelta
from typing import List, Optional
import requests
import os
from dotenv import load_dotenv
from .screen_management import (
    ScreenUpdateRequest,
    update_screen_display,
)
import logging


GOV_HOST = os.getenv("GOV_HOST")


def get_supermarket_id() -> str:
    load_dotenv(override=True)
    return os.environ["SUPERMARKET_ID"]


router = APIRouter(
    prefix="/product",
    tags=["Product Management"],
)


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


class PriceHistoryRecord(BaseModel):
    Price: float
    StartDate: datetime
    EndDate: Optional[datetime]
    ChangedBy: Optional[int]


class PriceHistoryResponse(BaseModel):
    ProductID: int
    ProductName: Optional[str]
    PriceHistory: List[PriceHistoryRecord]


class GetResponse(BaseModel):
    Products: list[OrganizedProducts]


@router.post("/add", response_model=ProductResponse)
def add_product(
    product_add: AddRequest,
    session: Session = Depends(get_session),
    gov_session: Session = Depends(get_gov_session),
    current_user: User = Depends(get_current_active_user),
):
    existing_product = session.exec(
        select(Products).where(Products.ProductID == product_add.Barcode)
    ).first()
    if existing_product:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Product already exists."
        )

    gov_product = gov_session.exec(
        select(GovProducts).where(GovProducts.ProductID == product_add.Barcode)
    ).first()
    if not gov_product:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product does not exist in government database.",
        )

    new_product = Products(
        ProductID=int(product_add.Barcode),
    )
    new_price = PriceHistory(
        ProductID=int(product_add.Barcode),
        Price=product_add.Price,
        StartDate=datetime.now(),
        ChangedBy=current_user.UserID,
    )

    SupermarketID = get_supermarket_id()
    SupermarketID = int(SupermarketID[1:])

    gov_price = gov_session.exec(
        select(GovPriceHistory).where(GovPriceHistory.ProductID == product_add.Barcode)
    ).first()
    if (
        gov_price
        and gov_price.Threshold is not None
        and gov_price.Threshold < product_add.Price
    ):
        penalty = Penalties(
            ProductID=int(product_add.Barcode),
            Amount=1000,
            Reason="Price over threshold",
            IssuedDate=datetime.now(),
            LastPaymentDate=datetime.now() + timedelta(days=15),
            SupermarketID=SupermarketID,
            Status=PenaltyStatusEnum.PENDING,
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
        message="Product added successfully", product=new_product, price=new_price
    )


@router.get("/get", response_model=GetResponse)
def get_products(
    session: Session = Depends(get_session),
    current_user=Depends(get_current_active_user),
):
    supermarket_products = session.exec(select(Products)).all()
    product_ids = [p.ProductID for p in supermarket_products]
    local_product_ids_set = set(product_ids)

    price_query = select(PriceHistory).where(
        PriceHistory.ProductID.in_(product_ids),  # type: ignore
        PriceHistory.EndDate == None,  # noqa: E711
    )
    local_prices_result = session.exec(price_query).all()
    local_prices = {pr.ProductID: pr.Price for pr in local_prices_result}

    promo_query = select(Promotions).where(
        Promotions.ProductID.in_(product_ids),  # type: ignore
        Promotions.EndDate > datetime.now(),  # type: ignore
    )
    local_promos_result = session.exec(promo_query).all()
    local_promos = {
        promo.ProductID: (promo.Discount, promo.EndDate)
        for promo in local_promos_result
    }

    # Fetch government data
    try:
        gov_resp = requests.get(f"{GOV_HOST}/product/get", verify=False)
        gov_resp.raise_for_status()
        gov_products_data = gov_resp.json()
    except Exception as e:
        raise HTTPException(
            status_code=500, detail="Error fetching government products data"
        )

    # Merge and build response
    products = []
    for item in gov_products_data:
        prod = item["Product"]
        pid = prod["ProductID"]
        if pid not in local_product_ids_set:
            continue

        cat = item["Category"]
        price_info = item["Price"]
        local_price = local_prices.get(pid, 0)
        discount, discount_end = local_promos.get(pid, (0, None))

        products.append(
            OrganizedProducts(
                ProductID=pid,
                ProductName=prod["ProductName"],
                CategoryID=prod["CategoryID"],
                CategoryName=cat["CategoryName"],
                Price=float(local_price),
                SuggestedPrice=price_info["SuggestedPrice"],
                Threshold=price_info["Threshold"],
                Discount=discount,
                DiscountEndDate=discount_end,
            )
        )

    return GetResponse(Products=products)


@router.get("/get/{product_id}", response_model=GetResponse)
def get_product_by_id(
    product_id: int,
    session: Session = Depends(get_session),
    gov_session: Session = Depends(get_gov_session),
    current_user=Depends(get_current_active_user),
):
    local_product = session.get(Products, product_id)
    if not local_product:
        raise HTTPException(status_code=404, detail="Product not found locally")

    local_price_obj = session.exec(
        select(PriceHistory)
        .where(PriceHistory.ProductID == product_id)
        .where(PriceHistory.EndDate.is_(None))
    ).first()
    local_price = local_price_obj.Price if local_price_obj else 0

    promo_obj = session.exec(
        select(Promotions)
        .where(Promotions.ProductID == product_id)
        .where(Promotions.EndDate > datetime.now())
    ).first()
    discount = promo_obj.Discount if promo_obj else 0
    discount_end = promo_obj.EndDate if promo_obj else None

    gov_product = gov_session.get(GovProducts, product_id)
    if not gov_product:
        raise HTTPException(
            status_code=404, detail="Product not found in government DB"
        )

    gov_price = gov_session.exec(
        select(GovPriceHistory)
        .where(GovPriceHistory.ProductID == product_id)
        .where(GovPriceHistory.EndDate.is_(None))
    ).first()

    gov_category = gov_session.get(Categories, gov_product.CategoryID)

    organized = OrganizedProducts(
        ProductID=product_id,
        ProductName=gov_product.ProductName,
        CategoryID=gov_product.CategoryID,
        CategoryName=gov_category.CategoryName if gov_category else None,
        Price=float(local_price),
        SuggestedPrice=gov_price.SuggestedPrice if gov_price else None,
        Threshold=gov_price.Threshold if gov_price else None,
        Discount=discount,
        DiscountEndDate=discount_end,
    )

    return GetResponse(Products=[organized])


@router.put("/update_price/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    new_price: float,
    session: Session = Depends(get_session),
    gov_session: Session = Depends(get_gov_session),
    current_user: User = Depends(get_current_active_user),
):
    product = session.exec(
        select(Products).where(Products.ProductID == product_id)
    ).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Product not found."
        )

    old_price = session.exec(
        select(PriceHistory)
        .where(PriceHistory.ProductID == product_id)
        .where(PriceHistory.EndDate.is_(None))  # type: ignore
    ).first()
    if old_price:
        old_price.EndDate = datetime.now()
        session.add(old_price)
        session.commit()
    price_history = PriceHistory(
        ProductID=product_id,
        Price=new_price,
        StartDate=datetime.now(),
        ChangedBy=current_user.UserID,
    )
    session.add(price_history)
    session.commit()
    session.refresh(price_history)

    SupermarketID = get_supermarket_id()
    SupermarketID = int(SupermarketID[1:])

    gov_price = gov_session.exec(
        select(GovPriceHistory).where(GovPriceHistory.ProductID == product.ProductID)
    ).first()
    if (
        gov_price
        and gov_price.Threshold is not None
        and price_history.Price is not None
        and gov_price.Threshold < price_history.Price
    ):
        penalty = Penalties(
            ProductID=product.ProductID,
            Amount=1000,
            Reason="Price over threshold",
            IssuedDate=datetime.now(),
            LastPaymentDate=datetime.now() + timedelta(days=15),
            SupermarketID=SupermarketID,
            Status=PenaltyStatusEnum.PENDING,
        )
        gov_session.add(penalty)
        gov_session.commit()
        gov_session.refresh(penalty)

    update_screen_display(
        update_request=ScreenUpdateRequest(product_id=product_id, template_name=""),
        session=session,
        gov_session=gov_session,
    )

    return ProductResponse(
        message=f"Price updated successfully and old price ({old_price.Price if old_price else 'N/A'}) archived",
        price=price_history,
        product=product,
    )


@router.put("/update_discount/{product_id}", response_model=DiscountResponse)
def update_discount(
    product_id: int,
    new_discount: DiscountRequest,
    gov_session: Session = Depends(get_gov_session),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
):
    print(new_discount.EndDate, new_discount.Discount)
    product = session.exec(
        select(Products).where(Products.ProductID == product_id)
    ).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Product not found."
        )

    if new_discount.EndDate and new_discount.EndDate < datetime.now().date():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Discount end date must be in the future.",
        )
    promotions = session.exec(
        select(Promotions)
        .where(Promotions.ProductID == product_id)
        .where(Promotions.EndDate > datetime.now())  # type: ignore
    ).all()

    for promotion in promotions:
        promotion.EndDate = datetime.now()
        session.add(promotion)

    session.commit()

    promotion = Promotions(
        PromotionName="Discount",
        ProductID=product_id,
        Discount=new_discount.Discount,
        StartDate=datetime.now(),
        EndDate=new_discount.EndDate,
        CreatedBy=current_user.UserID,
    )

    session.add(promotion)
    session.commit()
    session.refresh(promotion)

    update_screen_display(
        update_request=ScreenUpdateRequest(product_id=product_id, template_name=""),
        session=session,
        gov_session=gov_session,
    )
    return DiscountResponse(
        message="Discount updated successfully", promotion=promotion, product=product
    )


@router.delete("/delete/{product_id}")
def delete_product(
    product_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
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

    product = session.exec(
        select(Products).where(Products.ProductID == product_id)
    ).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Product not found."
        )

    session.delete(product)
    session.commit()
    return {
        "message": "Product deleted successfully",
    }


@router.get("/get_penalties", response_model=List[Penalties])
def get_penalties(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
):
    raw_id = get_supermarket_id()
    supermarket_id = raw_id[1:] if raw_id else ""

    url = f"{GOV_HOST}/penalty/get/{supermarket_id}"

    try:
        gov_resp = requests.get(url, verify=False)
        # special-case “not found” as “no penalties”
        if gov_resp.status_code == 404:
            return []
        gov_resp.raise_for_status()

        gov_penalties_data = gov_resp.json()

    except requests.exceptions.HTTPError as http_err:
        # if it slipped through, still treat 404 as empty
        if http_err.response is not None and http_err.response.status_code == 404:
            return []

        raise HTTPException(status_code=502, detail=f"Gov API error: {http_err}")
    except requests.exceptions.RequestException as e:
        raise HTTPException(
            status_code=502, detail="Error fetching government penalties data"
        )

    return gov_penalties_data


@router.get("/price_history/{product_id}", response_model=PriceHistoryResponse)
def get_price_history(
    product_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
):
    product = session.get(Products, product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Product not found."
        )

    history_records = session.exec(
        select(PriceHistory)
        .where(PriceHistory.ProductID == product_id)
        .order_by(PriceHistory.StartDate.desc())
    ).all()

    return PriceHistoryResponse(
        ProductID=product.ProductID,
        ProductName=getattr(product, "ProductName", None),
        PriceHistory=[
            PriceHistoryRecord(
                Price=record.Price,
                StartDate=record.StartDate,
                EndDate=record.EndDate,
                ChangedBy=record.ChangedBy,
            )
            for record in history_records
        ],
    )
