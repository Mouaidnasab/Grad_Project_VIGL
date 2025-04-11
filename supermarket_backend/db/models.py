# db/models.py

from typing import Optional, List
from datetime import datetime, date
from sqlmodel import SQLModel, Field, Relationship, Index
from enum import Enum
from sqlalchemy import Column, BigInteger as sa_BigInteger, ForeignKey, UniqueConstraint

class RoleEnum(str, Enum):
    owner = "owner"
    manager = "manager"
    staff = "staff"




class Products(SQLModel, table=True):
    __tablename__ = "products"

    ProductID: Optional[int] = Field(
        sa_column=Column(sa_BigInteger, primary_key=True), 
        default=None
    )

    # Relationships
    product_screens: List["ProductScreen"] = Relationship(back_populates="product")
    price_histories: List["PriceHistory"] = Relationship(back_populates="product")
    promotions: List["Promotions"] = Relationship(back_populates="product")

    class Config:
        arbitrary_types_allowed = True

class Screens(SQLModel, table=True):
    __tablename__ = "screens"

    ScreenID: Optional[int] = Field(
        sa_column=Column(sa_BigInteger, primary_key=True), 
        default=None
    )
    Status: Optional[str] = Field(default=None, max_length=50)
    IP: Optional[str] = Field(default=None, max_length=50)
    Description: Optional[str] = Field(default=None, max_length=255)

    # Relationships
    product_screens: List["ProductScreen"] = Relationship(back_populates="screen")


class Shelfs(SQLModel, table=True):
    __tablename__ = "shelfs"

    ShelfID: Optional[int] = Field(
        sa_column=Column(sa_BigInteger, primary_key=True), 
        default=None
    )
    Isle: Optional[str] = Field(default=None, max_length=50)
    Floor: Optional[str] = Field(default=None, max_length=50)
    Section: Optional[str] = Field(default=None, max_length=50)
    Description: Optional[str] = Field(default=None, max_length=255)


    # Relationships
    product_screens: List["ProductScreen"] = Relationship(back_populates="shelf")

class ProductScreen(SQLModel, table=True):
    __tablename__ = "product_screens"

    ProductScreenID: Optional[int] = Field(default=None, primary_key=True, index=True)
    ShelfID: Optional[int] = Field(sa_column=Column(sa_BigInteger, ForeignKey("shelfs.ShelfID")))
    ScreenID: Optional[int] = Field(sa_column=Column(sa_BigInteger, ForeignKey("screens.ScreenID")))
    ProductID: Optional[int] = Field(sa_column=Column(sa_BigInteger, ForeignKey("products.ProductID"), nullable=True))
    ChangedAt: datetime = Field(default_factory=datetime.now)

    # Relationships
    product: Optional["Products"] = Relationship(back_populates="product_screens")
    screen: Optional["Screens"] = Relationship(back_populates="product_screens")
    shelf: Optional["Shelfs"] = Relationship(back_populates="product_screens")

    class Config:
        arbitrary_types_allowed = True

    __table_args__ = (
        UniqueConstraint("ShelfID", "ScreenID", name="uq_shelf_screen"),
    )

class RefreshToken(SQLModel, table=True):
    __tablename__ = "refresh_tokens"

    TokenID: Optional[int] = Field(default=None, primary_key=True)
    Token: str = Field(index=True, unique=True)
    UserID: int = Field(foreign_key="users.UserID")
    CreatedAt: Optional[datetime] = Field(default=None)
    ExpiresAt: datetime
    Revoked: bool = Field(default=False)

    # Relationships
    user: Optional["Users"] = Relationship(back_populates="refresh_tokens")


class Users(SQLModel, table=True):
    __tablename__ = "users"

    UserID: Optional[int] = Field(default=None, primary_key=True, index=True)
    Username: Optional[str] = Field(default=None, max_length=50)
    FirstName: Optional[str] = Field(default=None, max_length=50)
    LastName: Optional[str] = Field(default=None, max_length=50)
    Password: Optional[str] = Field(default=None, max_length=255)
    Role: Optional[RoleEnum] = Field(default=None, max_length=50)
    Email: Optional[str] = Field(default=None, max_length=100)
    Disabled: bool = Field(default=False)

    # Relationships
    price_histories_changed: List["PriceHistory"] = Relationship(back_populates="changed_by_user")
    promotions_created: List["Promotions"] = Relationship(back_populates="created_by_user")
    refresh_tokens: List[RefreshToken] = Relationship(back_populates="user")

class PriceHistory(SQLModel, table=True):
    __tablename__ = "price_histories"
    __table_args__ = (
        Index("idx_pricehistory_changedby", "ChangedBy"),
        Index("idx_pricehistory_productid", "ProductID"),
    )

    HistoryID: Optional[int] = Field(default=None, primary_key=True, index=True)
    ProductID: Optional[int] = Field(sa_column=Column(sa_BigInteger, ForeignKey("products.ProductID")))
    Price: Optional[float] = Field(default=None)
    StartDate: Optional[date] = Field(default=None)
    EndDate: Optional[date] = Field(default=None)
    ChangedBy: Optional[int] = Field(default=None, foreign_key="users.UserID", index=True)

    # Relationships
    product: Optional["Products"] = Relationship(back_populates="price_histories")
    changed_by_user: Optional["Users"] = Relationship(back_populates="price_histories_changed")

    class Config:
        arbitrary_types_allowed = True


class Promotions(SQLModel, table=True):
    __tablename__ = "promotions"
    __table_args__ = (
        Index("idx_promotions_createdby", "CreatedBy"),
        Index("idx_promotions_productid", "ProductID"),
    )

    PromotionID: Optional[int] = Field(default=None, primary_key=True, index=True)
    ProductID: Optional[int] = Field(sa_column=Column(sa_BigInteger, ForeignKey("products.ProductID")))
    PromotionName: Optional[str] = Field(default=None, max_length=100)
    Discount: Optional[float] = Field(default=None)
    StartDate: Optional[date] = Field(default=None)
    EndDate: Optional[date] = Field(default=None)
    CreatedBy: Optional[int] = Field(default=None, foreign_key="users.UserID", index=True)

    # Relationships
    product: Optional["Products"] = Relationship(back_populates="promotions")
    created_by_user: Optional["Users"] = Relationship(back_populates="promotions_created")

    class Config:
        arbitrary_types_allowed = True


