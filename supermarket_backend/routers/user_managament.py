# routers/user_management.py

from typing import List, Optional, Annotated
from fastapi import APIRouter, Depends, HTTPException, status, Security
from pydantic import BaseModel, EmailStr, constr
from sqlmodel import Session, select, update, delete
from dependencies.auth import (
    get_current_active_user,
    Token,
    authenticate_user,
    create_access_token,
    create_refresh_token,
    verify_refresh_token,
    User,
    get_password_hash,
)
from db.database import engine
from db.models import Users, RefreshToken
from datetime import datetime
from fastapi.security import OAuth2PasswordBearer, APIKeyHeader
import os

router = APIRouter(
    prefix="/users",
    tags=["User Management"],
    responses={404: {"description": "Not found"}},
)

# Pydantic Schemas

class UserCreate(BaseModel):
    Username: Annotated[str, constr(min_length=3, max_length=50)]
    Email: EmailStr
    FirstName: Annotated[str, constr(max_length=50)]
    LastName: Annotated[str, constr(max_length=50)]
    Password: Annotated[str, constr(min_length=6, max_length=255)]
    Role: Optional[Annotated[str, constr(min_length=5, max_length=7)]] = None
    Disabled: Optional[bool] = False


class UserUpdate(BaseModel):
    Email: Optional[EmailStr] = None
    FirstName: Optional[Annotated[str, constr(max_length=50)]] = None
    LastName: Optional[Annotated[str, constr(max_length=50)]] = None
    Password: Optional[Annotated[str, constr(min_length=6, max_length=255)]] = None
    Role: Optional[Annotated[str, constr(min_length=5, max_length=7)]] = None
    Disabled: Optional[bool] = None


class UserResponse(BaseModel):
    UserID: int
    Username: str
    Email: EmailStr
    FirstName: str
    LastName: str
    Role: str
    Disabled: bool
    LastUsed: Optional[datetime] = None

    class Config:
        orm_mode = True

# Security for Initialize Owner Endpoint

# Define an API key header for initialization
INITIALIZE_OWNER_API_KEY = os.getenv("INITIALIZE_OWNER_API_KEY", "owner_key")
api_key_header = APIKeyHeader(name="X-Initialize-Owner-Token", auto_error=False)

def verify_initialize_owner_token(api_key: str = Security(api_key_header)):

    if api_key != INITIALIZE_OWNER_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid initialization token",
        )
    return api_key

# Dependency for Role-Based Access Control

def require_Role(required_Roles: List[str]):
    def Role_checker(current_user: User = Depends(get_current_active_user)):
        if current_user.Role not in required_Roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return current_user
    return Role_checker

# Endpoint to Add a New User
@router.post("/create", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user: UserCreate,
    current_user: User = Depends(require_Role(["owner", "manager"])),
):
    with Session(engine) as session:
        # Check if Username or Email already exists
        statement = select(Users).where(
            (Users.Username == user.Username) | (Users.Email == user.Email)
        )
        existing_user = session.exec(statement).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username or Email already registered",
            )

        # Determine the role based on current user's role
        if current_user.Role == "manager":
            # Managers can only create staff
            if user.Role and user.Role != "staff":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Managers can only create staff users",
                )
            user.Role = "staff"  # Override to ensure staff role
        elif current_user.Role == "owner":
            # Owners can create managers and staff
            if user.Role not in ["manager", "staff", None]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid role. Only 'manager' or 'staff' can be assigned",
                )
            if not user.Role:
                user.Role = "staff"  # Default role

        # Hash the Password
        hashed_Password = get_password_hash(user.Password)

        # Create new user instance
        new_user = Users(
            Username=user.Username,
            Email=user.Email,
            FirstName=user.FirstName,
            LastName=user.LastName,
            Password=hashed_Password,
            Role=user.Role,
            Disabled=user.Disabled,
            LastUsed=None,
        )
        session.add(new_user)
        session.commit()
        session.refresh(new_user)
        return UserResponse(
            UserID=new_user.UserID,
            Username=new_user.Username,
            Email=new_user.Email,
            FirstName=new_user.FirstName,
            LastName=new_user.LastName,
            Role=new_user.Role,
            Disabled=new_user.Disabled,
            LastUsed=new_user.LastUsed,
        )

# Endpoint to Edit an Existing User
@router.put("/edit/{UserID}", response_model=UserResponse)
def update_user(
    UserID: int,
    user_update: UserUpdate,
    current_user: User = Depends(require_Role(["owner", "manager"])),
):
    with Session(engine) as session:
        statement = select(Users).where(Users.UserID == UserID)
        user = session.exec(statement).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        # Prevent managers from modifying owners or managers
        if current_user.Role == "manager":
            if user.Role != "staff":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Managers can only modify staff users",
                )

        # If current user is manager, prevent changing role
        if current_user.Role == "manager" and user_update.Role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Managers cannot change user roles",
            )

        # If current user is owner, validate role changes
        if current_user.Role == "owner" and user_update.Role:
            if user_update.Role not in ["manager", "staff"]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid role. Only 'manager' or 'staff' can be assigned",
                )

        # Update fields if provided
        if user_update.Email:
            # Check if the new Email is already in use
            Email_check = session.exec(
                select(Users).where(Users.Email == user_update.Email, Users.UserID != UserID)
            ).first()
            if Email_check:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already in use",
                )
            user.Email = user_update.Email
        if user_update.FirstName:
            user.FirstName = user_update.FirstName
        if user_update.LastName:
            user.LastName = user_update.LastName
        if user_update.Password:
            user.Password = get_password_hash(user_update.Password)
        if user_update.Role:
            # Only owners can change Roles
            user.Role = user_update.Role
        if user_update.Disabled is not None:
            user.Disabled = user_update.Disabled

        session.add(user)
        session.commit()
        session.refresh(user)

        return UserResponse(
            UserID=user.UserID,
            Username=user.Username,
            Email=user.Email,
            FirstName=user.FirstName,
            LastName=user.LastName,
            Role=user.Role,
            Disabled=user.Disabled,
            LastUsed=user.LastUsed,
        )

# Endpoint to Delete a User
@router.delete("/delete/{UserID}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    UserID: int,
    current_user: User = Depends(require_Role(["owner", "manager"])),
):
    with Session(engine) as session:
        statement = select(Users).where(Users.UserID == UserID)
        user = session.exec(statement).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        # Prevent deletion of the owner
        if user.Role == "owner":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot delete the owner",
            )

        # If current user is manager, ensure they are deleting a staff member
        if current_user.Role == "manager" and user.Role != "staff":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Managers can only delete staff users",
            )

        # Delete associated refresh tokens
        gettokens = select(RefreshToken).where(RefreshToken.UserID == UserID)
        delettokens = session.exec(gettokens).all()
        for token in delettokens:
            session.delete(token)

        # Delete the user
        session.delete(user)
        session.commit()
        return

# Endpoint to List Users
@router.get("/list", response_model=List[UserResponse])
def list_users(
    # skip: int = 0,
    # limit: int = 10,
    current_user: User = Depends(require_Role(["owner", "manager"])),
):
    with Session(engine) as session:
        statement = select(Users)  #.offset(skip).limit(limit)
        users = session.exec(statement).all()
        return [
            UserResponse(
                UserID=user.UserID,
                Username=user.Username,
                Email=user.Email,
                FirstName=user.FirstName,
                LastName=user.LastName,
                Role=user.Role,
                Disabled=user.Disabled,
                LastUsed=user.LastUsed,
            )
            for user in users
        ]
    
# Endpoint to Initialize Owner (Only if no owner exists)
@router.post(
    "/initialize_owner",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(verify_initialize_owner_token)],
)
def initialize_owner(user: UserCreate):
    """
    Initialize the first owner of the system.
    This endpoint can only be used if no owner exists.
    It is protected by an initialization token.
    """
    with Session(engine) as session:
        # Check if any owner exists
        statement = select(Users).where(Users.Role == "owner")
        existing_owner = session.exec(statement).first()
        if existing_owner:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Owner already exists",
            )

        # Enforce role as 'owner'
        user.Role = "owner"

        # Hash the Password
        hashed_Password = get_password_hash(user.Password)

        # Create new owner instance
        new_owner = Users(
            Username=user.Username,
            Email=user.Email,
            FirstName=user.FirstName,
            LastName=user.LastName,
            Password=hashed_Password,
            Role=user.Role,
            Disabled=user.Disabled,
            LastUsed=None,
        )
        session.add(new_owner)
        session.commit()
        session.refresh(new_owner)
        return UserResponse(
            UserID=new_owner.UserID,
            Username=new_owner.Username,
            Email=new_owner.Email,
            FirstName=new_owner.FirstName,
            LastName=new_owner.LastName,
            Role=new_owner.Role,
            Disabled=new_owner.Disabled,
            LastUsed=new_owner.LastUsed,
        )

