# routers/supermarket_management.py

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session, select
from typing import List, Optional

from dependencies.auth import get_current_active_user, User, get_password_hash, require_Role
from db.models import Supermarkets, GovUsers
from db.supermarket_models import Users
from db.database import gov_engine
from db.create_supermarket import create_supermarket_database

router = APIRouter(
    prefix="/supermarket",
    tags=["Supermarket Management"],
)

def get_session():
    with Session(gov_engine) as session:
        yield session

class OwnerResponse(BaseModel):
    Username: str
    Email: str
    Password: str

    
@router.post("/create", status_code=status.HTTP_201_CREATED)
def create_supermarket(
    supermarket: Supermarkets,
    OwnerReq: OwnerResponse,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_Role(["staff"]))  
):

    existing_supermarket = session.exec(select(Supermarkets).where(Supermarkets.SupermarketID == supermarket.SupermarketID)).first()
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
        
        supermarket.ContactPersonUserID = "0000001"
        session.add(supermarket)
        session.commit()
        session.refresh(supermarket)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ContactPersonFullName is required.",
        )
    
    

    
    hashed_password = get_password_hash(OwnerReq.Password) 
    Owner = Users(
        Username = OwnerReq.Username,
        Role = "owner",
        Email = OwnerReq.Email,
        UserID = supermarket.ContactPersonUserID,
        FirstName = first_name,
        LastName = last_name,
        Password = hashed_password,
        Disabled = False
    )

    # Create Database for the supermarket
    create_supermarket_database(supermarket.SupermarketID, Owner)

    
    return {"message": "Supermarket created successfully."}

@router.put("/edit", response_model=Supermarkets)
def update_supermarket(
    supermarket_update: Supermarkets,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_Role(["staff"]))
):

    

    supermarket = session.exec(select(Supermarkets).where(Supermarkets.SupermarketID == supermarket_update.SupermarketID)).first()
    if not supermarket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supermarket not found.",
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
            select(GovUsers).where(
                GovUsers.FirstName == first_name,
                GovUsers.LastName == last_name
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
    
    update_data = supermarket_update.model_dump(exclude={"ContactPersonUserID", "RegisteredID"}, exclude_unset=True)
    for key, value in update_data.items():
        setattr(supermarket, key, value)
    
    session.add(supermarket)
    session.commit()
    session.refresh(supermarket)
    return supermarket

@router.get("/get", response_model=List[Supermarkets])
def get_supermarkets(
    session: Session = Depends(get_session), 
    current_user: User = Depends(require_Role(["staff","customer"])) 
):
    return session.scalars(select(Supermarkets)).all()
