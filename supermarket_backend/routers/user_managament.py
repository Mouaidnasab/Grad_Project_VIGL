# routers/user_management.py

from typing import List, Optional, Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, constr
from sqlmodel import Session, select
from dependencies.auth import (
    User,
    get_password_hash,
    require_Role,
)
from db.database import engine
from db.models import Users, RefreshToken

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

    class Config:
        orm_mode = True


@router.post(
    "/create/", response_model=UserResponse, status_code=status.HTTP_201_CREATED
)
def create_user(
    user: UserCreate,
    current_user: User = Depends(require_Role(["owner", "manager"])),
):
    with Session(engine) as session:
        statement = select(Users).where(
            (Users.Username == user.Username) | (Users.Email == user.Email)
        )
        existing_user = session.exec(statement).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username or Email already registered",
            )

        if current_user.Role == "manager":
            if user.Role and user.Role != "staff":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Managers can only create staff users",
                )
            user.Role = "staff"
        elif current_user.Role == "owner":
            if user.Role not in ["manager", "staff", None]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid role. Only 'manager' or 'staff' can be assigned",
                )
            if not user.Role:
                user.Role = "staff"

        hashed_Password = get_password_hash(user.Password)

        new_user = Users(
            Username=user.Username,
            Email=user.Email,
            FirstName=user.FirstName,
            LastName=user.LastName,
            Password=hashed_Password,
            Role=user.Role,  # type: ignore
            Disabled=user.Disabled or False,
        )
        session.add(new_user)
        session.commit()
        session.refresh(new_user)
        return UserResponse(
            UserID=new_user.UserID or 0,
            Username=new_user.Username or "",
            Email=new_user.Email or "",
            FirstName=new_user.FirstName or "",
            LastName=new_user.LastName or "",
            Role=new_user.Role or "",
            Disabled=new_user.Disabled,
        )


@router.put("/edit/{UserID}/", response_model=UserResponse)
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

        if current_user.Role == "manager":
            if user.Role != "staff":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Managers can only modify staff users",
                )

        if current_user.Role == "manager" and user_update.Role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Managers cannot change user roles",
            )

        if current_user.Role == "owner" and user_update.Role:
            if user_update.Role not in ["manager", "staff"]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid role. Only 'manager' or 'staff' can be assigned",
                )

        if user_update.Email:
            Email_check = session.exec(
                select(Users).where(
                    Users.Email == user_update.Email, Users.UserID != UserID
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
            user.Role = user_update.Role  # type: ignore
        if user_update.Disabled is not None:
            user.Disabled = user_update.Disabled

        session.add(user)
        session.commit()
        session.refresh(user)

        return UserResponse(
            UserID=user.UserID or 0,
            Username=user.Username or "",
            Email=str(user.Email),
            FirstName=user.FirstName or "",
            LastName=user.LastName or "",
            Role=user.Role or "",
            Disabled=user.Disabled,
        )


@router.delete("/delete/{UserID}/", status_code=status.HTTP_204_NO_CONTENT)
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

        if user.Role == "owner":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot delete the owner",
            )

        if current_user.Role == "manager" and user.Role != "staff":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Managers can only delete staff users",
            )

        gettokens = select(RefreshToken).where(RefreshToken.UserID == UserID)
        delettokens = session.exec(gettokens).all()
        for token in delettokens:
            session.delete(token)

        session.delete(user)
        session.commit()
        return


@router.get("/list/", response_model=List[UserResponse])
def list_users(
    current_user: User = Depends(require_Role(["owner", "manager"])),
):
    with Session(engine) as session:
        statement = select(Users)
        users = session.exec(statement).all()
        return [
            UserResponse(
                UserID=user.UserID or 0,
                Username=user.Username or "",
                Email=user.Email or "",
                FirstName=user.FirstName or "",
                LastName=user.LastName or "",
                Role=user.Role or "",
                Disabled=user.Disabled,
            )
            for user in users
        ]


@router.get("/is_first_login/", response_model=bool)
def is_first_login():
    with Session(engine) as session:
        owner = session.exec(select(Users).where(Users.Role == "owner")).first()
        refresh = session.exec(
            select(RefreshToken).where(RefreshToken.UserID == owner.UserID)  # type: ignore
        ).first()  # type: ignore
        return not refresh
