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
    Username: Optional[str] = None
    Email: Optional[str] = None
    FullName: Optional[str] = None
    Role: Optional[str] = None  # Adding role for detailed information

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
    access_token = create_access_token(data={"sub": user.Username}, expires_delta=access_token_expires)
    refresh_token = create_refresh_token(data={"sub": user.Username}, UserID=user.ID)
    return Token(access_token=access_token, refresh_token=refresh_token)

@router.post("/user_auth/refresh-token", response_model=Token, tags=["User Authentication"])
async def refresh_access_token(refresh_token: str):
    Username = verify_refresh_token(refresh_token)
    if not Username:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or expired refresh token",
        )

    # Fetch the UserID before closing the session
    with Session(engine) as session:
        statement = select(RefreshToken).where(RefreshToken.Token == refresh_token)
        token_record = session.exec(statement).first()
        
        if token_record:
            # Store UserID and revoke token before closing session
            UserID = token_record.UserID
            token_record.Revoked = True
            session.add(token_record)
            session.commit()

    # Issue a new access token and refresh token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    new_access_token = create_access_token(data={"sub": Username}, expires_delta=access_token_expires)
    new_refresh_token = create_refresh_token(data={"sub": Username}, UserID=UserID)

    return Token(access_token=new_access_token, refresh_token=new_refresh_token)


@router.get("/current_user/me", response_model=UserProfile, tags=["Current User"])
async def read_users_me(
    current_user: Annotated[User, Depends(get_current_active_user)],
    detail_level: int = 1
):
    FullName=str(current_user.FirstName + " " + current_user.LastName)
    if detail_level == 1:
        return UserProfile(FullName = FullName)
    elif detail_level == 2:
        return UserProfile(Username=current_user.Username, FullName = FullName)
    elif detail_level == 3:
        return UserProfile(
            Username=current_user.Username,
            Email=current_user.Email,
            FullName = FullName,
            Role=current_user.Role
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid detail level. Please specify 1, 2, or 3."
        )
    


#test
# @router.get("/me/items/")
# async def read_own_items(current_user: Annotated[User, Depends(get_current_active_user)]):
#     return [{"item_id": "Foo", "owner": current_user.Username}]
