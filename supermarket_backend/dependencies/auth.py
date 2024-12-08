# dependencies/auth.py

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
from db.models import Users, RefreshToken

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
    ID: Optional[int] = None
    FirstName: Optional[str] = None
    LastName: Optional[str] = None
    Role: Optional[str] = None
    Disabled: Optional[bool] = None

class UserInDB(User):
    Password: str

# Helper functions for Password hashing and verification
def verify_Password(plain_Password: str, Password: str) -> bool:
    """Verify a plain Password against its hashed version."""
    return pwd_context.verify(plain_Password, Password)

def get_password_hash(Password: str) -> str:
    """Hash a plain Password."""
    return pwd_context.hash(Password)

# Database interactions to get user data
def get_user_from_db(Username: str) -> Optional[UserInDB]:
    """
    Retrieve a user from the database by Username.

    Args:
        Username (str): The Username of the user to retrieve.

    Returns:
        Optional[UserInDB]: The user object if found, else None.
    """
    with Session(engine) as session:
        statement = select(Users).where(Users.Username == Username)
        user = session.exec(statement).one_or_none()
        if user:
            return UserInDB(
                Username=user.Username,
                Email=user.Email,
                ID=user.UserID,
                FirstName=user.FirstName,
                LastName=user.LastName,
                Role=user.Role,
                Disabled=user.Disabled,
                Password=user.Password,
            )
        return None

# Authentication function
def authenticate_user(Username: str, Password: str) -> Optional[UserInDB]:
    """
    Authenticate a user by Username and Password.

    Args:
        Username (str): The Username of the user.
        Password (str): The plain Password of the user.

    Returns:
        Optional[UserInDB]: The authenticated user object if successful, else None.
    """
    user = get_user_from_db(Username)
    if not user:
        return None
    if user.Disabled:
        return None
    if not verify_Password(Password, user.Password):
        return None

    # Update Last_used timestamp
    with Session(engine) as session:
        user_record = session.exec(select(Users).where(Users.Username == Username)).one()
        user_record.LastUsed = datetime.now(timezone.utc)
        session.add(user_record)
        session.commit()
    return user

# Token creation functions
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token.

    Args:
        data (dict): The data to encode in the token.
        expires_delta (Optional[timedelta]): The token's expiration time.

    Returns:
        str: The encoded JWT token.
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta if expires_delta else timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict, UserID: int, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT refresh token and store it in the database.

    Args:
        data (dict): The data to encode in the token.
        UserID (int): The ID of the user.
        expires_delta (Optional[timedelta]): The token's expiration time.

    Returns:
        str: The encoded JWT refresh token.
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta if expires_delta else timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    # Store the token in the RefreshToken table
    with Session(engine) as session:
        new_token = RefreshToken(
            Token=encoded_jwt,
            UserID=UserID,
            CreatedAt=datetime.now(timezone.utc),
            ExpiresAt=expire,  # Ensure ExpiresAt is timezone-aware
            Revoked=False
        )
        session.add(new_token)
        session.commit()
    
    return encoded_jwt

# Token verification function for refresh token with database valIDation
def verify_refresh_token(token: str) -> Optional[str]:
    """
    Verify a refresh token.

    Args:
        token (str): The refresh token to verify.

    Returns:
        Optional[str]: The Username if the token is valID, else None.

    Raises:
        HTTPException: If the token is invalID or expired.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        Username = payload.get("sub")
        if Username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="InvalID token: missing subject",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Verify the token in the database
        with Session(engine) as session:
            statement = select(RefreshToken).where(
                RefreshToken.Token == token,
                RefreshToken.Revoked == False
            )
            refresh_token = session.exec(statement).first()
            if not refresh_token:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="InvalID refresh token",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            if refresh_token.ExpiresAt.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
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
    """
    Retrieve the current user based on the provIDed JWT token.

    Args:
        token (str): The JWT token.

    Returns:
        User: The current authenticated user.

    Raises:
        HTTPException: If the token is invalID or the user doesn't exist.
    """
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
async def get_current_active_user(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    """
    Ensure that the current user is active (not Disabled).

    Args:
        current_user (User): The current authenticated user.

    Returns:
        User: The active user.

    Raises:
        HTTPException: If the user is Disabled.
    """
    if current_user.Disabled:
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
# from db.models import Users

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
#     Username: Optional[str] = None

# class User(BaseModel):
#     Username: str
#     Email: Optional[str] = None
#     ID: Optional[int] = None
#     name: Optional[str] = None
#     Role: Optional[str] = None
#     Disabled: Optional[bool] = None

# class UserInDB(User):
#     Password: str

# # Helper functions for Password hashing and verification
# def verify_Password(plain_Password, Password):
#     return pwd_context.verify(plain_Password, Password)

# def get_Password_hash(Password):
#     return pwd_context.hash(Password)



# # Database interactions to get user data
# def get_user_from_db(Username: str):
#     with Session(engine) as session:
#         statement = select(Users).where(Users.Username == Username)
#         try:
#             Users = session.exec(statement).one()
#             return UserInDB(
#                 Username=Users.Username,
#                 name=Users.name,
#                 Role=Users.Role,
#                 ID=Users.ID,
#                 Email=Users.Email,
#                 Password=Users.Password,
#                 Disabled=Users.Disabled,
#             )
#         except NoResultFound:
#             return None

# # Authentication function
# def authenticate_user(Username: str, Password: str):
#     user = get_user_from_db(Username)
#     if not user:
#         return False
#     if user.Disabled:
#         return False
#     if not verify_Password(Password, user.Password):
#         return False
#     # Update Last_login timestamp on successful login
#     with Session(engine) as session:
#         statement = select(Users).where(Users.Username == Username)
#         Users = session.exec(statement).one()
#         Users.Last_login = datetime.utcnow()
#         session.add(Users)
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
#         detail="Could not valIDate credentials",
#         headers={"WWW-Authenticate": "Bearer"},
#     )
#     try:
#         payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
#         Username: str = payload.get("sub")
#         if Username is None:
#             raise credentials_exception
#         token_data = TokenData(Username=Username)
#     except InvalidTokenError:
#         raise credentials_exception
#     user = get_user_from_db(token_data.Username)
#     if user is None:
#         raise credentials_exception
#     return user

# # Dependency to ensure user is active
# async def get_current_active_user(
#     current_user: Annotated[User, Depends(get_current_user)],
# ):
#     if current_user.Disabled:
#         raise HTTPException(status_code=400, detail="Inactive user")
#     return current_user
