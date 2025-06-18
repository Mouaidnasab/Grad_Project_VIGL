# routers/shelf_management.py

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from pydantic import BaseModel
from db.database import engine
from db.gov_database import gov_engine
from db.gov_models import GovProducts, Categories
from db.models import Products, Shelfs, Screens, ProductScreen, PriceHistory
from dependencies.auth import User, require_Role
from typing import List

from routers.screen_management import (
    ScreenUpdateRequest,
    update_screen_display,
)


router = APIRouter(
    prefix="/shelf",
    tags=["Shelf Management"],
)


def get_session():
    with Session(engine) as session:
        yield session


def get_gov_session():
    with Session(gov_engine) as session:
        yield session


class RelationScreenRequest(BaseModel):
    shelf_id: int
    screen_id: int


class RelationProductRequest(BaseModel):
    shelf_id: int
    product_id: int


class RelationResponse(BaseModel):
    message: str


@router.post("/add", response_model=Shelfs)
def add_shelf(
    shelf_add: Shelfs,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_Role(["owner", "manager"])),
):
    new_shelf = Shelfs(**shelf_add.model_dump())
    session.add(new_shelf)
    session.commit()
    session.refresh(new_shelf)
    return new_shelf


@router.post("/create_relation_screen", response_model=RelationResponse)
def create_relation_screen(
    request: RelationScreenRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_Role(["owner", "manager"])),
):
    shelf = session.exec(
        select(Shelfs).where(Shelfs.ShelfID == request.shelf_id)
    ).first()
    if not shelf:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shelf not found.",
        )

    screen = session.exec(
        select(Screens).where(Screens.ScreenID == request.screen_id)
    ).first()
    if not screen:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Screen not found.",
        )

    conflict = session.exec(
        select(ProductScreen).where(
            ProductScreen.ScreenID == request.screen_id,
            ProductScreen.ShelfID != request.shelf_id,
        )
    ).first()
    if conflict:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Screen is already related to another shelf.",
        )

    relation = session.exec(
        select(ProductScreen).where(ProductScreen.ShelfID == request.shelf_id)
    ).first()

    if relation:
        relation.ScreenID = request.screen_id
        session.add(relation)
        session.commit()
        session.refresh(relation)
        return RelationResponse(message="Relation updated successfully")

    new_relation = ProductScreen(
        ShelfID=request.shelf_id,
        ScreenID=request.screen_id,
        ProductID=None,
    )
    session.add(new_relation)
    session.commit()
    session.refresh(new_relation)
    return RelationResponse(message="Relation created successfully")


@router.put("/update_relation_screen", response_model=RelationResponse)
def update_relation_screen(
    request: RelationScreenRequest,
    session: Session = Depends(get_session),
    current_user=Depends(require_Role(["owner", "manager"])),
):
    shelf = session.exec(
        select(Shelfs).where(Shelfs.ShelfID == request.shelf_id)
    ).first()
    if not shelf:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Shelf not found."
        )
    screen = session.exec(
        select(Screens).where(Screens.ScreenID == request.screen_id)
    ).first()
    screen_in_relation = session.exec(
        select(ProductScreen).where(ProductScreen.ScreenID == request.screen_id)
    ).first()
    if not screen and screen_in_relation.ShelfID != request.shelf_id:  # type: ignore
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Screen not found or in different relation.",
        )

    product_screen = session.exec(
        select(ProductScreen).where(ProductScreen.ShelfID == request.shelf_id)
    ).first()
    if not product_screen:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Relation with the specified shelf not found.",
        )

    product_screen.ScreenID = request.screen_id
    session.add(product_screen)
    session.commit()
    session.refresh(product_screen)

    return RelationResponse(message="Relation updated successfully")


@router.put("/update_relation_product", response_model=RelationResponse)
def update_relation_product(
    request: RelationProductRequest,
    session: Session = Depends(get_session),
    gov_session: Session = Depends(get_gov_session),
    current_user=Depends(require_Role(["owner", "manager"])),
):
    shelf = session.exec(
        select(Shelfs).where(Shelfs.ShelfID == request.shelf_id)
    ).first()
    if not shelf:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Shelf not found."
        )

    product_screen = session.exec(
        select(ProductScreen).where(ProductScreen.ShelfID == request.shelf_id)
    ).first()
    if not product_screen:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Relation with the specified shelf not found.",
        )

    if request.product_id == 0:
        product_screen.ProductID = None
    else:
        product = session.exec(
            select(Products).where(Products.ProductID == request.product_id)
        ).first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Product not found."
            )

        product_screen.ProductID = request.product_id
        product_screen.ChangedAt = datetime.now()

        update_screen_display(
            update_request=ScreenUpdateRequest(
                product_id=product_screen.ProductID, template_name=""
            ),
            session=session,
            gov_session=gov_session,
        )

    session.add(product_screen)
    session.commit()
    session.refresh(product_screen)

    return RelationResponse(message="Relation updated successfully")


@router.get("/get_relations", response_model=List[ProductScreen])
def get_relations(
    session: Session = Depends(get_session),
    current_user: User = Depends(require_Role(["owner", "manager"])),
):
    return session.exec(select(ProductScreen)).all()


class GetResponse(BaseModel):
    shelf: Shelfs
    screen: Screens
    product: GovProducts
    category: Categories
    price: PriceHistory

@router.get("/get_relations_by_unkown/{id}", response_model=GetResponse)
def get_relations_by_unkown(
    id: int,
    session: Session = Depends(get_session),
    gov_session: Session = Depends(get_gov_session),
    current_user: User = Depends(require_Role(["owner", "manager"])),
):
    is_shelf = session.exec(select(Shelfs).where(Shelfs.ShelfID == id)).first()
    is_screen = session.exec(select(Screens).where(Screens.ScreenID == id)).first()
    is_product = session.exec(select(Products).where(Products.ProductID == id)).first()

    if is_shelf:
        relation = session.exec(
            select(ProductScreen).where(ProductScreen.ShelfID == id)
        ).first()
    elif is_screen:
        relation = session.exec(
            select(ProductScreen).where(ProductScreen.ScreenID == id)
        ).first()
    elif is_product:
        relation = session.exec(
            select(ProductScreen).where(ProductScreen.ProductID == id)
        ).first()
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Relation not found."
        )

    product = gov_session.exec(
        select(GovProducts).where(GovProducts.ProductID == relation.ProductID)  # type: ignore
    ).first()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Product not found."
        )

    if not relation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Relation not found."
        )

    return GetResponse(
        shelf=session.get(Shelfs, relation.ShelfID),  # type: ignore
        screen=session.get(Screens, relation.ScreenID),  # type: ignore
        product=gov_session.get(GovProducts, relation.ProductID),  # type: ignore
        category=gov_session.get(Categories, product.CategoryID),  # type: ignore
        price=session.scalar(
            select(PriceHistory).where(
                PriceHistory.ProductID == product.ProductID,
                PriceHistory.EndDate.is_(None),  # type: ignore
            )
        ),
    )

@router.get("/get", response_model=List[Shelfs])
def get_shelves(
    session: Session = Depends(get_session),
    current_user: User = Depends(require_Role(["owner", "manager"])),
):
    linked_shelf_ids = session.exec(select(ProductScreen.ShelfID)).all()
    shelves = session.exec(
        select(Shelfs).where(Shelfs.ShelfID.not_in(linked_shelf_ids))  # type: ignore
    ).all()
    return shelves

@router.get("/get/{shelf_id}", response_model=Shelfs)
def get_shelf_by_id(
    shelf_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_Role(["owner", "manager"])),
):
    shelf = session.get(Shelfs, shelf_id)
    if not shelf:
        raise HTTPException(status_code=404, detail="Shelf not found")
    return shelf


@router.delete("/delete_relation/{ProductScreenID}/")
def delete_relation(
    ProductScreenID: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_Role(["owner", "manager"])),
):
    relation = session.exec(
        select(ProductScreen).where(ProductScreen.ProductScreenID == ProductScreenID)
    ).first()
    if not relation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Relation not found."
        )
    session.delete(relation)
    session.commit()
    return {"message": "Relation deleted successfully"}
