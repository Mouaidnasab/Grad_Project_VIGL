# routers/shelf_management.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from pydantic import BaseModel
from db.database import engine
from db.models import Products, Shelfs, Screens, ProductScreen
from dependencies.auth import  User, require_Role
from typing import List


router = APIRouter(
    prefix="/shelf",
    tags=["Shelf Management"],
)

# Dependency to get a database session
def get_session():
    with Session(engine) as session:
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
    current_user: User = Depends(require_Role(["owner", "manager"])) 
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
    current_user: User = Depends(require_Role(["owner", "manager"])) 
):
    shelf = session.exec(select(Shelfs).where(Shelfs.ShelfID == request.shelf_id)).first()
    shelf_in_relation = session.exec(select(ProductScreen).where(ProductScreen.ShelfID == request.shelf_id)).first()
    if not shelf and not shelf_in_relation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shelf not found or in relation.")
    screen = session.exec(select(Screens).where(Screens.ScreenID == request.screen_id)).first()
    screen_in_relation = session.exec(select(ProductScreen).where(ProductScreen.ScreenID == request.screen_id)).first()
    if not screen and not screen_in_relation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Screen not found or in relation.")


    new_relation = ProductScreen(ShelfID=request.shelf_id, ScreenID=request.screen_id)
    session.add(new_relation)
    session.commit()
    session.refresh(new_relation)
    return RelationResponse(message="Relation created successfully")

@router.put("/update_relation_screen", response_model=RelationResponse)
def update_relation_screen(
    request: RelationScreenRequest, 
    session: Session = Depends(get_session), 
    current_user=Depends(require_Role(["owner", "manager"]))
):
    shelf = session.exec(select(Shelfs).where(Shelfs.ShelfID == request.shelf_id)).first()
    if not shelf:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shelf not found.")
    screen = session.exec(select(Screens).where(Screens.ScreenID == request.screen_id)).first()
    screen_in_relation = session.exec(select(ProductScreen).where(ProductScreen.ScreenID == request.screen_id)).first()
    if not screen and screen_in_relation.ShelfID != request.shelf_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Screen not found or in different relation.")

    product_screen = session.exec(select(ProductScreen).where(ProductScreen.ShelfID == request.shelf_id)).first()
    if not product_screen:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Relation with the specified shelf not found.")

    product_screen.ScreenID = request.screen_id
    session.add(product_screen)
    session.commit()
    session.refresh(product_screen)

    return RelationResponse(message="Relation updated successfully")

@router.put("/update_relation_product", response_model=RelationResponse)
def update_relation_product(
    request: RelationProductRequest, 
    session: Session = Depends(get_session), 
    current_user=Depends(require_Role(["owner", "manager"]))
):
    shelf = session.exec(select(Shelfs).where(Shelfs.ShelfID == request.shelf_id)).first()
    if not shelf:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shelf not found.")
    product = session.exec(select(Products).where(Products.ProductID == request.product_id)).first()
    product_in_relation = session.exec(select(ProductScreen).where(ProductScreen.ProductID == request.product_id)).first()
    if not product and product_in_relation.ShelfID != request.shelf_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found or in different relation.")

    product_screen = session.exec(select(ProductScreen).where(ProductScreen.ShelfID == request.shelf_id)).first()
    if not product_screen:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Relation with the specified shelf not found.")

    product_screen.ProductID = request.product_id
    session.add(product_screen)
    session.commit()
    session.refresh(product_screen)

    return RelationResponse(message="Relation updated successfully")



@router.get("/get_relations", response_model=List[ProductScreen])
def get_relations(
    session: Session = Depends(get_session), 
    current_user: User = Depends(require_Role(["owner", "manager"])) 
):
    return session.exec(select(ProductScreen)).all()  
