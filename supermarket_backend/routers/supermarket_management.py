# routers/supermarket_management.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import Optional

from db.database import engine
from db.models import Supermarkets, Users
from dependencies.auth import get_current_active_user, User  # Ensure correct import

router = APIRouter(
    prefix="/supermarket",
    tags=["Supermarket Management"],
)

# Dependency to get a database session
def get_session():
    with Session(engine) as session:
        yield session

@router.post("/create", response_model=Supermarkets, status_code=status.HTTP_201_CREATED)
def create_supermarket(
    supermarket: Supermarkets,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)  # Secure endpoint
):
    """
    Create a new supermarket.
    Only users with the role 'owner' can perform this action.
    The contact person must have the role 'manager' or 'owner'.
    """
    # **Constraint 1: Only owners can create supermarkets**
    if current_user.Role != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners can create supermarkets.",
        )
    
    # Check if a supermarket already exists
    existing_supermarket = session.exec(select(Supermarkets)).first()
    if existing_supermarket:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A supermarket already exists. Edit the existing supermarket instead.",
        )
    
    # Validate ContactPersonFullName if provided
    if supermarket.ContactPersonFullName:
        # Split the full name into first and last names
        names = supermarket.ContactPersonFullName.strip().split()
        if len(names) < 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ContactPersonFullName must include both first name and last name.",
            )
        first_name = names[0]
        last_name = ' '.join(names[1:])
        
        # Check if a user with matching first and last name exists
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
        
        # **Constraint 2: Contact person must be a manager or owner**
        if user.Role not in ["manager", "owner"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Contact person must have the role 'manager' or 'owner'.",
            )
        
        # Set ContactPersonUserID to the user's UserID
        supermarket.ContactPersonUserID = user.UserID
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ContactPersonFullName is required.",
        )
    
    # Remove RegisteredID if it's set (let the database handle it)
    supermarket.RegisteredID = None
    
    # Create the supermarket entry
    session.add(supermarket)
    session.commit()
    session.refresh(supermarket)
    return supermarket

@router.put("/edit", response_model=Supermarkets)
def update_supermarket(
    supermarket_update: Supermarkets,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)  # Secure endpoint
):
    """
    Update the existing supermarket.
    Only users with the role 'owner' can perform this action.
    The contact person must have the role 'manager' or 'owner'.
    """
    # **Constraint 1: Only owners can edit supermarkets**
    if current_user.Role != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners can edit supermarkets.",
        )
    
    # Retrieve the existing supermarket (first row)
    existing_supermarket = session.exec(select(Supermarkets)).first()
    if not existing_supermarket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No supermarket found to update.",
        )
    
    # If ContactPersonFullName is being updated, validate it
    if supermarket_update.ContactPersonFullName:
        names = supermarket_update.ContactPersonFullName.strip().split()
        if len(names) < 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ContactPersonFullName must include both first name and last name.",
            )
        first_name = names[0]
        last_name = ' '.join(names[1:])
        
        # Check if a user with matching first and last name exists
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
        
        # **Constraint 2: Contact person must be a manager or owner**
        if user.Role not in ["manager", "owner"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Contact person must have the role 'manager' or 'owner'.",
            )
        
        # Set ContactPersonUserID to the user's UserID
        existing_supermarket.ContactPersonUserID = user.UserID
    
    # Update other fields (excluding ContactPersonUserID and RegisteredID)
    update_data = supermarket_update.dict(exclude={"ContactPersonUserID", "RegisteredID"}, exclude_unset=True)
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
    """
    Retrieve the existing supermarket information.
    Accessible by any authenticated user.
    """
    supermarket = session.exec(select(Supermarkets)).first()
    if not supermarket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No supermarket found.",
        )
    return supermarket
