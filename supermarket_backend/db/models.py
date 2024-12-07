# edit this to work with the new dataase

from typing import List, Optional # allows you to optionaly specify a type ex. Optional[int]

from sqlmodel import Field, SQLModel, Relationship
from datetime import datetime, timezone

class Product(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field()
    category: str = Field()
    shelf_id: int = Field()
    price: float = Field()
    status: str = Field()
    last_updated: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Screen(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field()
    shelf_id: int = Field()
    status: str = Field()
    current_display: str = Field()
    last_synced: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Shelf(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    unique_name: str = Field()
    location: str = Field()
    capacity: int = Field()
    

class RefreshToken(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    token: str = Field(index=True, unique=True)  # The JWT refresh token string
    user_id: int = Field(foreign_key="staff.id")  # Reference to the user
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))  # When the token was issued
    expires_at: datetime  # When the token expires
    revoked: bool = Field(default=False)  # If the token has been invalidated (rotation or manual logout)

    # Relationship to the User table, assuming the primary user table is `Staff`
    user: Optional["Staff"] = Relationship(back_populates="refresh_tokens")

    
class Staff(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field()
    username: str = Field(unique=True, index=True)
    email: str = Field(unique=True, index=True)
    hashed_password: str = Field()  # Renamed for clarity
    role: str = Field()
    disabled: bool = Field(default=False)  # New field for account status
    last_login: Optional[datetime] = Field(default=None)  # Timestamp for last login
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))  # Account creation timestamp
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))  # Last update timestamp

    refresh_tokens: List[RefreshToken] = Relationship(back_populates="user")


