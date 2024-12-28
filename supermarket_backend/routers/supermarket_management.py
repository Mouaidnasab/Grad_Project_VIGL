# routers/supermarket_management.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import Optional

from db.database import engine
from db.models import Supermarkets, Users
from dependencies.auth import get_current_active_user, User, require_Role

router = APIRouter(
    prefix="/supermarket",
    tags=["Supermarket Management"],
)

def get_session():
    with Session(engine) as session:
        yield session

@router.post("/create", response_model=Supermarkets, status_code=status.HTTP_201_CREATED)
def create_supermarket(
    supermarket: Supermarkets,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_Role(["owner"]))  
):

    existing_supermarket = session.exec(select(Supermarkets)).first()
    if existing_supermarket:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A supermarket already exists. Edit the existing supermarket instead.",
        )
    
    if supermarket.ContactPersonFullName:
        names = supermarket.ContactPersonFullName.strip().split()
        if len(names) < 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ContactPersonFullName must include both first name and last name.",
            )
        first_name = names[0]
        last_name = ' '.join(names[1:])
        
        user = session.exec(
            select(Users).where(
                Users.FirstName == first_name,
                Users.LastName == last_name
            )
        ).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Contact person must exist in the Users table.",
            )
        
        if user.Role not in ["manager", "owner"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Contact person must have the role 'manager' or 'owner'.",
            )
        
        supermarket.ContactPersonUserID = user.UserID
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ContactPersonFullName is required.",
        )
    
    supermarket.RegisteredID = None
    
    session.add(supermarket)
    session.commit()
    session.refresh(supermarket)
    return supermarket

@router.put("/edit", response_model=Supermarkets)
def update_supermarket(
    supermarket_update: Supermarkets,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_Role(["owner"]))
):

    
    existing_supermarket = session.exec(select(Supermarkets)).first()
    if not existing_supermarket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No supermarket found to update.",
        )
    
    if supermarket_update.ContactPersonFullName:
        names = supermarket_update.ContactPersonFullName.strip().split()
        if len(names) < 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ContactPersonFullName must include both first name and last name.",
            )
        first_name = names[0]
        last_name = ' '.join(names[1:])
        
        user = session.exec(
            select(Users).where(
                Users.FirstName == first_name,
                Users.LastName == last_name
            )
        ).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Contact person must exist in the Users table.",
            )
        
        if user.Role not in ["manager", "owner"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Contact person must have the role 'manager' or 'owner'.",
            )
        
        existing_supermarket.ContactPersonUserID = user.UserID
    
    update_data = supermarket_update.model_dump(exclude={"ContactPersonUserID", "RegisteredID"}, exclude_unset=True)
    for key, value in update_data.items():
        setattr(existing_supermarket, key, value)
    
    session.add(existing_supermarket)
    session.commit()
    session.refresh(existing_supermarket)
    return existing_supermarket

@router.get("/info", response_model=Supermarkets)
def get_supermarket(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)  # Secure endpoint
):

    supermarket = session.exec(select(Supermarkets)).first()
    if not supermarket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No supermarket found.",
        )
    return supermarket
