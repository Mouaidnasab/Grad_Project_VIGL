# db/models.py

from typing import Optional, List
from datetime import datetime, date
from sqlmodel import SQLModel, Field, Relationship, Index
from enum import Enum
from sqlalchemy import (
    Column,
    BigInteger as sa_BigInteger,
    ForeignKey,
    Sequence,
    UniqueConstraint,
)


class GovRoleEnum(str, Enum):
    staff = "staff"
    customer = "customer"


class Categories(SQLModel, table=True):
    __tablename__ = "categories"

    CategoryID: Optional[int] = Field(default=None, primary_key=True, index=True)
    CategoryName: Optional[str] = Field(default=None, max_length=100)
    Description: Optional[str] = Field(default=None, max_length=255)

    # Relationships
    products: List["GovProducts"] = Relationship(back_populates="category")


class GovProducts(SQLModel, table=True):
    __tablename__ = "gov_products"

    ProductID: Optional[int] = Field(
        sa_column=Column(sa_BigInteger, primary_key=True, autoincrement=False),
        default=None,
    )
    ProductName: Optional[str] = Field(default=None, max_length=100)
    CategoryID: Optional[int] = Field(
        default=None, foreign_key="categories.CategoryID", index=True
    )
    Description: Optional[str] = Field(default=None, max_length=255)

    # Relationships
    category: Optional["Categories"] = Relationship(back_populates="products")
    price_histories: List["GovPriceHistory"] = Relationship(back_populates="product")
    penalties: List["Penalties"] = Relationship(back_populates="product")

    class Config:
        arbitrary_types_allowed = True


class GovRefreshToken(SQLModel, table=True, extend_existing=True):
    __tablename__ = "gov_refresh_tokens"

    TokenID: Optional[int] = Field(default=None, primary_key=True)
    Token: str = Field(index=True, unique=True)
    UserID: int = Field(foreign_key="gov_users.UserID")
    CreatedAt: Optional[datetime] = Field(default=None)
    ExpiresAt: datetime
    Revoked: bool = Field(default=False)

    # Relationships
    user: Optional["GovUsers"] = Relationship(back_populates="refresh_tokens")


class GovUsers(SQLModel, table=True):
    __tablename__ = "gov_users"

    UserID: Optional[int] = Field(default=None, primary_key=True, index=True)
    Username: Optional[str] = Field(default=None, max_length=50)
    FirstName: Optional[str] = Field(default=None, max_length=50)
    LastName: Optional[str] = Field(default=None, max_length=50)
    Password: Optional[str] = Field(default=None, max_length=255)
    Role: Optional[GovRoleEnum] = Field(default=None, max_length=50)
    Email: Optional[str] = Field(default=None, max_length=100)
    Disabled: bool = Field(default=False)

    # Relationships
    price_histories_changed: List["GovPriceHistory"] = Relationship(
        back_populates="changed_by_user"
    )
    refresh_tokens: List[GovRefreshToken] = Relationship(back_populates="user")


class GovPriceHistory(SQLModel, table=True):
    __tablename__ = "gov_price_histories"
    __table_args__ = (
        Index("idx_pricehistory_changedby", "ChangedBy"),
        Index("idx_pricehistory_productid", "ProductID"),
    )

    HistoryID: Optional[int] = Field(default=None, primary_key=True, index=True)
    ProductID: Optional[int] = Field(
        sa_column=Column(sa_BigInteger, ForeignKey("gov_products.ProductID"))
    )
    SuggestedPrice: Optional[float] = Field(default=None)
    Threshold: Optional[int] = Field(default=None)
    StartDate: Optional[date] = Field(default=None)
    EndDate: Optional[date] = Field(default=None)
    ChangedBy: Optional[int] = Field(
        default=None, foreign_key="gov_users.UserID", index=True
    )

    # Relationships
    product: Optional["GovProducts"] = Relationship(back_populates="price_histories")
    changed_by_user: Optional["GovUsers"] = Relationship(
        back_populates="price_histories_changed"
    )

    class Config:
        arbitrary_types_allowed = True


class Supermarkets(SQLModel, table=True):
    __tablename__ = "supermarkets"
    __table_args__ = {
        "mysql_engine": "InnoDB",
        "mysql_auto_increment": "100000",
    }

    SupermarketID: Optional[int] = Field(
        default=None,
        sa_column=Column(
            sa_BigInteger,
            primary_key=True,
            autoincrement=True,
        ),
    )
    RegisteredDate: date = Field(default_factory=date.today, nullable=False)
    RegisteredName: str = Field(index=True, max_length=255)
    Address: Optional[str] = Field(default=None, max_length=500)
    ContactPersonFullName: Optional[str] = Field(default=None, max_length=100)
    ContactPersonUserID: Optional[int] = Field(default=None)

    # Relationships
    penalties: List["Penalties"] = Relationship(back_populates="supermarket")


class PenaltyStatusEnum(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    LATE = "late"


class Penalties(SQLModel, table=True):
    __tablename__ = "penalties"
    __table_args__ = {
        "mysql_engine": "InnoDB",
        "mysql_auto_increment": "500000",
    }

    PenaltyID: Optional[int] = Field(
        default=None,
        sa_column=Column(
            sa_BigInteger,
            primary_key=True,
            autoincrement=True,
        ),
    )
    IssuedDate: date = Field(default_factory=date.today, nullable=False)
    LastPaymentDate: Optional[date] = Field(default=None)
    Amount: Optional[float] = Field(default=None)
    Reason: Optional[str] = Field(default=None, max_length=255)
    ProductID: Optional[int] = Field(
        default=None,
        sa_column=Column(sa_BigInteger, ForeignKey("gov_products.ProductID")),
    )
    SupermarketID: Optional[int] = Field(
        default=None,
        sa_column=Column(sa_BigInteger, ForeignKey("supermarkets.SupermarketID")),
    )
    Status: Optional[PenaltyStatusEnum] = Field(default=None)

    # Relationships
    product: Optional["GovProducts"] = Relationship(back_populates="penalties")
    supermarket: Optional["Supermarkets"] = Relationship(back_populates="penalties")
