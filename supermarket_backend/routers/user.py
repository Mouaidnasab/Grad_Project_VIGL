from typing import Optional, Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from dependencies.auth import (
    get_current_active_user, Token, authenticate_user, create_access_token,
    create_refresh_token, verify_refresh_token, User
)
from pydantic import BaseModel

from datetime import timedelta
from sqlmodel import Session, select
from db.database import engine
from db.models import RefreshToken

router = APIRouter()

ACCESS_TOKEN_EXPIRE_MINUTES = 15

class UserProfile(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    name: Optional[str] = None
    role: Optional[str] = None  # Adding role for detailed information

@router.post("/user_auth/token", response_model=Token, tags=["User Authentication"])
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(data={"sub": user.username}, expires_delta=access_token_expires)
    refresh_token = create_refresh_token(data={"sub": user.username}, user_id=user.id)
    return Token(access_token=access_token, refresh_token=refresh_token)

@router.post("/user_auth/refresh-token", response_model=Token, tags=["User Authentication"])
async def refresh_access_token(refresh_token: str):
    username = verify_refresh_token(refresh_token)
    if not username:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or expired refresh token",
        )

    # Fetch the user_id before closing the session
    with Session(engine) as session:
        statement = select(RefreshToken).where(RefreshToken.token == refresh_token)
        token_record = session.exec(statement).first()
        
        if token_record:
            # Store user_id and revoke token before closing session
            user_id = token_record.user_id
            token_record.revoked = True
            session.add(token_record)
            session.commit()

    # Issue a new access token and refresh token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    new_access_token = create_access_token(data={"sub": username}, expires_delta=access_token_expires)
    new_refresh_token = create_refresh_token(data={"sub": username}, user_id=user_id)

    return Token(access_token=new_access_token, refresh_token=new_refresh_token)


@router.get("/user/me", response_model=UserProfile, tags=["Current User"])
async def read_users_me(
    current_user: Annotated[User, Depends(get_current_active_user)],
    detail_level: int = 1
):
    if detail_level == 1:
        return UserProfile(name=current_user.name)
    elif detail_level == 2:
        return UserProfile(username=current_user.username, name=current_user.name)
    elif detail_level == 3:
        return UserProfile(
            username=current_user.username,
            email=current_user.email,
            name=current_user.name,
            role=current_user.role
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid detail level. Please specify 1, 2, or 3."
        )
    


#test
# @router.get("/me/items/")
# async def read_own_items(current_user: Annotated[User, Depends(get_current_active_user)]):
#     return [{"item_id": "Foo", "owner": current_user.username}]
