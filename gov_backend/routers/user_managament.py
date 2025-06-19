# routers/user_management.py

from typing import List, Optional, Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, constr
from sqlmodel import Session, select
from dependencies.auth import (
    get_current_active_user,
    User,
    get_password_hash,
    require_Role,
)
from db.database import gov_engine
from db.models import GovUsers, GovRefreshToken

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
    Email: Optional[EmailStr]
    FirstName: str
    LastName: str
    Role: str
    Disabled: bool

    class Config:
        orm_mode = True


@router.post(
    "/create", response_model=UserResponse, status_code=status.HTTP_201_CREATED
)
def create_user(
    user: UserCreate,
    current_user: User = Depends(get_current_active_user),
):
    with Session(gov_engine) as session:
        statement = select(GovUsers).where(
            (GovUsers.Username == user.Username) | (GovUsers.Email == user.Email)
        )
        existing_user = session.exec(statement).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username or Email already registered",
            )

        hashed_Password = get_password_hash(user.Password)

        new_user = GovUsers(
            Username=user.Username,
            Email=user.Email,
            FirstName=user.FirstName,
            LastName=user.LastName,
            Password=hashed_Password,
            Role=user.Role,
            Disabled=user.Disabled,
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
        )


@router.put("/edit/{UserID}", response_model=UserResponse)
def update_user(
    UserID: int,
    user_update: UserUpdate,
    current_user: User = Depends(require_Role(["staff"])),
):
    with Session(gov_engine) as session:
        user = session.exec(select(GovUsers).where(GovUsers.UserID == UserID)).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        if user_update.Email:
            Email_check = session.exec(
                select(GovUsers).where(
                    GovUsers.Email == user_update.Email, GovUsers.UserID != UserID
                )
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
        )


@router.delete("/delete/{UserID}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    UserID: int,
    current_user: User = Depends(get_current_active_user),
):
    with Session(gov_engine) as session:
        statement = select(GovUsers).where(GovUsers.UserID == UserID)
        user = session.exec(statement).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        gettokens = select(GovRefreshToken).where(GovRefreshToken.UserID == UserID)
        delettokens = session.exec(gettokens).all()
        for token in delettokens:
            session.delete(token)

        session.delete(user)
        session.commit()
        return


@router.get("/list", response_model=List[UserResponse])
def list_users(
    current_user: User = Depends(require_Role(["staff"])),
):
    with Session(gov_engine) as session:
        statement = select(GovUsers)
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
            )
            for user in users
        ]
