from datetime import datetime, timedelta, timezone
from typing import Annotated, Optional
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError
from passlib.context import CryptContext
from pydantic import BaseModel
from sqlmodel import Session, select
from db.database import engine
from db.models import Staff, RefreshToken

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
    username: Optional[str] = None

class User(BaseModel):
    username: str
    email: Optional[str] = None
    id: Optional[int] = None
    name: Optional[str] = None
    role: Optional[str] = None
    disabled: Optional[bool] = None

class UserInDB(User):
    hashed_password: str

# Helper functions for password hashing and verification
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

# Database interactions to get user data
def get_user_from_db(username: str):
    with Session(engine) as session:
        statement = select(Staff).where(Staff.username == username)
        user = session.exec(statement).one_or_none()
        if user:
            return UserInDB(
                username=user.username,
                name=user.name,
                role=user.role,
                id=user.id,
                email=user.email,
                hashed_password=user.hashed_password,
                disabled=user.disabled,
            )
        return None

# Authentication function
def authenticate_user(username: str, password: str):
    user = get_user_from_db(username)
    if not user or user.disabled or not verify_password(password, user.hashed_password):
        return False
    with Session(engine) as session:
        user_record = session.exec(select(Staff).where(Staff.username == username)).one()
        user_record.last_login = datetime.now(timezone.utc)
        session.add(user_record)
        session.commit()
    return user

# Token creation functions
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta if expires_delta else timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict, user_id: int, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta if expires_delta else timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    # Store the token in the RefreshToken table
    with Session(engine) as session:
        new_token = RefreshToken(
            token=encoded_jwt,
            user_id=user_id,
            created_at=datetime.now(timezone.utc),
            expires_at=expire,  # Ensure expires_at is timezone-aware
            revoked=False
        )
        session.add(new_token)
        session.commit()
    
    return encoded_jwt

# Token verification function for refresh token with database validation
def verify_refresh_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            return None

        # Verify the token in the database
        with Session(engine) as session:
            statement = select(RefreshToken).where(RefreshToken.token == token, RefreshToken.revoked == False)
            refresh_token = session.exec(statement).first()
            if not refresh_token or refresh_token.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Expired or invalid refresh token. Please log in again."
                )
        return username
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has expired. Please log in again."
        )
    except InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

# Dependency to get the current user based on token
async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except InvalidTokenError:
        raise credentials_exception
    user = get_user_from_db(token_data.username)
    if user is None:
        raise credentials_exception
    return user

# Dependency to ensure user is active
async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)],
):
    if current_user.disabled:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user
















# without refresh token

# from datetime import datetime, timedelta, timezone
# from typing import Annotated, Optional
# import jwt
# from fastapi import Depends, HTTPException, status
# from fastapi.security import OAuth2PasswordBearer
# from jwt.exceptions import InvalidTokenError
# from passlib.context import CryptContext
# from pydantic import BaseModel
# from sqlmodel import SQLModel, Session, select
# from sqlalchemy.exc import NoResultFound

# # Import the pre-created engine from db.database
# from db.database import engine
# from db.models import Staff

# SECRET_KEY = "0e2ea5c457d4877e1ef2c0902edc6956cb47ef485672742372601cc1765158d3"
# ALGORITHM = "HS256"
# ACCESS_TOKEN_EXPIRE_MINUTES = 30

# # Password hashing configuration
# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
# oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# # User models for token data and user information
# class Token(BaseModel):
#     access_token: str
#     token_type: str

# class TokenData(BaseModel):
#     username: Optional[str] = None

# class User(BaseModel):
#     username: str
#     email: Optional[str] = None
#     id: Optional[int] = None
#     name: Optional[str] = None
#     role: Optional[str] = None
#     disabled: Optional[bool] = None

# class UserInDB(User):
#     hashed_password: str

# # Helper functions for password hashing and verification
# def verify_password(plain_password, hashed_password):
#     return pwd_context.verify(plain_password, hashed_password)

# def get_password_hash(password):
#     return pwd_context.hash(password)



# # Database interactions to get user data
# def get_user_from_db(username: str):
#     with Session(engine) as session:
#         statement = select(Staff).where(Staff.username == username)
#         try:
#             staff = session.exec(statement).one()
#             return UserInDB(
#                 username=staff.username,
#                 name=staff.name,
#                 role=staff.role,
#                 id=staff.id,
#                 email=staff.email,
#                 hashed_password=staff.hashed_password,
#                 disabled=staff.disabled,
#             )
#         except NoResultFound:
#             return None

# # Authentication function
# def authenticate_user(username: str, password: str):
#     user = get_user_from_db(username)
#     if not user:
#         return False
#     if user.disabled:
#         return False
#     if not verify_password(password, user.hashed_password):
#         return False
#     # Update last_login timestamp on successful login
#     with Session(engine) as session:
#         statement = select(Staff).where(Staff.username == username)
#         staff = session.exec(statement).one()
#         staff.last_login = datetime.utcnow()
#         session.add(staff)
#         session.commit()
#     return user

# # Token creation function
# def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
#     to_encode = data.copy()
#     expire = datetime.now(timezone.utc) + expires_delta if expires_delta else timedelta(minutes=15)
#     to_encode.update({"exp": expire})
#     encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
#     return encoded_jwt

# # Dependency to get the current user based on token
# async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]):
#     credentials_exception = HTTPException(
#         status_code=status.HTTP_401_UNAUTHORIZED,
#         detail="Could not validate credentials",
#         headers={"WWW-Authenticate": "Bearer"},
#     )
#     try:
#         payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
#         username: str = payload.get("sub")
#         if username is None:
#             raise credentials_exception
#         token_data = TokenData(username=username)
#     except InvalidTokenError:
#         raise credentials_exception
#     user = get_user_from_db(token_data.username)
#     if user is None:
#         raise credentials_exception
#     return user

# # Dependency to ensure user is active
# async def get_current_active_user(
#     current_user: Annotated[User, Depends(get_current_user)],
# ):
#     if current_user.disabled:
#         raise HTTPException(status_code=400, detail="Inactive user")
#     return current_user
