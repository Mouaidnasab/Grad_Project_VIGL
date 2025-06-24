from typing import Optional, Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from dependencies.auth import (
    get_current_active_user,
    Token,
    authenticate_user,
    create_access_token,
    create_refresh_token,
    verify_refresh_token,
    User,
)
from pydantic import BaseModel

from datetime import timedelta
from sqlmodel import Session, select
from db.database import gov_engine
from db.models import GovRefreshToken

router = APIRouter()

ACCESS_TOKEN_EXPIRE_MINUTES = 15


class UserProfile(BaseModel):
    Username: Optional[str] = None
    Email: Optional[str] = None
    FullName: Optional[str] = None
    Role: Optional[str] = None


class ValidateTokenRequest(BaseModel):
    token: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


@router.post("/user_auth/token", response_model=Token, tags=["User Authentication"])
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect Username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.Username}, expires_delta=access_token_expires
    )
    user_id = user.UserID if user.UserID is not None else 0
    refresh_token = create_refresh_token(data={"sub": user.Username}, UserID=user_id)
    return Token(access_token=access_token, refresh_token=refresh_token)


@router.post(
    "/user_auth/refresh-token", response_model=Token, tags=["User Authentication"]
)
async def refresh_access_token(request: RefreshTokenRequest):
    refresh_token = request.refresh_token
    Username = verify_refresh_token(refresh_token)
    UserID = 0
    if not Username:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or expired refresh token",
        )

    with Session(gov_engine) as session:
        statement = select(GovRefreshToken).where(
            GovRefreshToken.Token == refresh_token
        )
        token_record = session.exec(statement).first()

        if token_record:
            UserID = token_record.UserID
            token_record.Revoked = True
            session.add(token_record)
            session.commit()

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    new_access_token = create_access_token(
        data={"sub": Username}, expires_delta=access_token_expires
    )
    new_refresh_token = create_refresh_token(data={"sub": Username}, UserID=UserID)

    return Token(access_token=new_access_token, refresh_token=new_refresh_token)


@router.get("/current_user/me", response_model=UserProfile, tags=["Current User"])
async def read_users_me(
    current_user: Annotated[User, Depends(get_current_active_user)],
    detail_level: int = 1,
):
    first_name = current_user.FirstName or ""
    last_name = current_user.LastName or ""
    FullName = f"{first_name} {last_name}"
    if detail_level == 1:
        return UserProfile(FullName=FullName)
    elif detail_level == 2:
        return UserProfile(Username=current_user.Username, FullName=FullName)
    elif detail_level == 3:
        return UserProfile(
            Username=current_user.Username,
            Email=current_user.Email,
            FullName=FullName,
            Role=current_user.Role,
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid detail level. Please specify 1, 2, or 3.",
        )


@router.post("/user_auth/validate-token", tags=["User Authentication"])
async def validate_token(token_request: ValidateTokenRequest):
    token = token_request.token

    try:
        decoded_data = verify_refresh_token(token)

        if not decoded_data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token is invalid or expired.",
            )

        with Session(gov_engine) as session:
            statement = select(GovRefreshToken).where(GovRefreshToken.Token == token)
            token_record = session.exec(statement).first()

            if token_record and token_record.Revoked:
                return {"valid": False, "reason": "Token is revoked."}

        return {"valid": True, "reason": "Token is valid and active."}

    except Exception:
        return {"valid": False, "reason": "Token is invalid or expired."}
