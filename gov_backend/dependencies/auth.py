# dependencies/auth.py

from datetime import datetime, timedelta, timezone
from typing import Annotated, Optional, List
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError
from passlib.context import CryptContext
from pydantic import BaseModel
from sqlmodel import Session, select
from db.database import gov_engine
from db.models import GovUsers, GovRefreshToken

# Secret and algorithm configurations
SECRET_KEY = "0e2ea5c457d4877e1ef2c0902edc6956cb47ef485672742372601cc1765158d3"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Password hashing configuration
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/user_auth/token")


# Token Models
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    Username: Optional[str] = None


class User(BaseModel):
    Username: str
    Email: Optional[str] = None
    UserID: Optional[int] = None
    FirstName: Optional[str] = None
    LastName: Optional[str] = None
    Role: Optional[str] = None
    Disabled: Optional[bool] = None


class UserInDB(User):
    Password: str


# Helper functions for Password hashing and verification
def verify_Password(plain_Password: str, Password: str) -> bool:
    return pwd_context.verify(plain_Password, Password)


def get_password_hash(Password: str) -> str:
    return pwd_context.hash(Password)


# Database interactions to get user data
def get_user_from_db(Username: str) -> Optional[UserInDB]:
    with Session(gov_engine) as session:
        statement = select(GovUsers).where(GovUsers.Username == Username)
        user = session.exec(statement).one_or_none()
        if user:
            return UserInDB(
                Username=user.Username,
                Email=user.Email,
                UserID=user.UserID,
                FirstName=user.FirstName,
                LastName=user.LastName,
                Role=user.Role,
                Disabled=user.Disabled,
                Password=user.Password,
            )
        return None


def authenticate_user(Username: str, Password: str) -> Optional[UserInDB]:
    user = get_user_from_db(Username)
    if not user:
        return None
    if user.Disabled:
        return None
    if not verify_Password(Password, user.Password):
        return None

    with Session(gov_engine) as session:
        user_record = session.exec(
            select(GovUsers).where(GovUsers.Username == Username)
        ).one()
        session.add(user_record)
        session.commit()
    return user


# Token creation functions
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta
        if expires_delta
        else timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_refresh_token(
    data: dict, UserID: int, expires_delta: Optional[timedelta] = None
) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta if expires_delta else timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    )
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    with Session(gov_engine) as session:
        new_token = GovRefreshToken(
            Token=encoded_jwt,
            UserID=UserID,
            CreatedAt=datetime.now(timezone.utc),
            ExpiresAt=expire,
            Revoked=False,
        )
        session.add(new_token)
        session.commit()

    return encoded_jwt


# Token verification function for refresh token with database validation
def verify_refresh_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        Username = payload.get("sub")
        if Username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="InvalID token: missing subject",
                headers={"WWW-Authenticate": "Bearer"},
            )

        with Session(gov_engine) as session:
            statement = select(GovRefreshToken).where(
                GovRefreshToken.Token == token, GovRefreshToken.Revoked == False
            )
            refresh_token = session.exec(statement).first()
            if not refresh_token:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid refresh token",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            if refresh_token.ExpiresAt.replace(tzinfo=timezone.utc) < datetime.now(
                timezone.utc
            ):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Refresh token has expired",
                    headers={"WWW-Authenticate": "Bearer"},
                )
        return Username
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="InvalID token",
            headers={"WWW-Authenticate": "Bearer"},
        )


# Dependency to get the current user based on token
async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        Username: str = payload.get("sub")
        if Username is None:
            raise credentials_exception
        token_data = TokenData(Username=Username)
    except (ExpiredSignatureError, InvalidTokenError):
        raise credentials_exception

    user = get_user_from_db(token_data.Username)
    if user is None:
        raise credentials_exception
    return user


# Dependency to ensure user is active
async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    if current_user.Disabled:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


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
