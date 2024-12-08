# db/models.py

from typing import Optional, List
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship, Index
from enum import Enum

class RoleEnum(str, Enum):
    owner = "owner"
    manager = "manager"
    staff = "staff"

class Categories(SQLModel, table=True):
    __tablename__ = "categories"

    CategoryID: Optional[int] = Field(default=None, primary_key=True, index=True)
    CategoryName: Optional[str] = Field(default=None, max_length=100)
    Description: Optional[str] = Field(default=None, max_length=255)

    # Relationships
    products: List["Products"] = Relationship(back_populates="category")


class Products(SQLModel, table=True):
    __tablename__ = "products"

    ProductID: Optional[int] = Field(default=None, primary_key=True, index=True)
    ProductName: Optional[str] = Field(default=None, max_length=100)
    CategoryID: Optional[int] = Field(default=None, foreign_key="categories.CategoryID", index=True)
    Description: Optional[str] = Field(default=None, max_length=255)

    # Relationships
    category: Optional[Categories] = Relationship(back_populates="products")
    product_screens: List["ProductScreen"] = Relationship(back_populates="product")
    price_histories: List["PriceHistory"] = Relationship(back_populates="product")
    promotions: List["Promotions"] = Relationship(back_populates="product")


class Screens(SQLModel, table=True):
    __tablename__ = "screens"

    ScreenID: Optional[int] = Field(default=None, primary_key=True, index=True)
    Status: Optional[str] = Field(default=None, max_length=50)

    # Relationships
    product_screens: List["ProductScreen"] = Relationship(back_populates="screen")


class Shelfs(SQLModel, table=True):
    __tablename__ = "shelfs"

    ShelfID: Optional[int] = Field(default=None, primary_key=True, index=True)
    Isle: Optional[str] = Field(default=None, max_length=50)
    Shelf: Optional[str] = Field(default=None, max_length=50)

    # Relationships
    product_screens: List["ProductScreen"] = Relationship(back_populates="shelf")


class ProductScreen(SQLModel, table=True):
    __tablename__ = "product_screens"

    ProductScreenID: Optional[int] = Field(default=None, primary_key=True, index=True)
    ProductID: Optional[int] = Field(default=None, foreign_key="products.ProductID", index=True)
    ScreenID: Optional[int] = Field(default=None, foreign_key="screens.ScreenID", index=True)
    ShelfID: Optional[int] = Field(default=None, foreign_key="shelfs.ShelfID", index=True)
    Isle: Optional[str] = Field(default=None, max_length=50)

    # Relationships
    product: Optional[Products] = Relationship(back_populates="product_screens")
    screen: Optional[Screens] = Relationship(back_populates="product_screens")
    shelf: Optional[Shelfs] = Relationship(back_populates="product_screens")


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
    LastUsed: Optional[datetime] = Field(default=None)

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
    ProductID: Optional[int] = Field(default=None, foreign_key="products.ProductID", index=True)
    Price: Optional[float] = Field(default=None)
    StartDate: Optional[datetime] = Field(default=None)
    EndDate: Optional[datetime] = Field(default=None)
    ChangedBy: Optional[int] = Field(default=None, foreign_key="users.UserID", index=True)

    # Relationships
    product: Optional[Products] = Relationship(back_populates="price_histories")
    changed_by_user: Optional[Users] = Relationship(back_populates="price_histories_changed")


class Promotions(SQLModel, table=True):
    __tablename__ = "promotions"
    __table_args__ = (
        Index("idx_promotions_createdby", "CreatedBy"),
        Index("idx_promotions_productid", "ProductID"),
    )

    PromotionID: Optional[int] = Field(default=None, primary_key=True, index=True)
    ProductID: Optional[int] = Field(default=None, foreign_key="products.ProductID", index=True)
    PromotionName: Optional[str] = Field(default=None, max_length=100)
    Discount: Optional[float] = Field(default=None)
    StartDate: Optional[datetime] = Field(default=None)
    EndDate: Optional[datetime] = Field(default=None)
    CreatedBy: Optional[int] = Field(default=None, foreign_key="users.UserID", index=True)

    # Relationships
    product: Optional[Products] = Relationship(back_populates="promotions")
    created_by_user: Optional[Users] = Relationship(back_populates="promotions_created")

class Supermarkets(SQLModel, table=True):
    __tablename__ = "supermarkets"

    RegisteredID: Optional[int] = Field(default=None, primary_key=True)
    RegisteredDate: datetime = Field(default_factory=datetime.now, nullable=False)
    RegisteredName: str = Field(index=True, max_length=255)
    Address: Optional[str] = Field(default=None, max_length=500)
    ContactPersonFullName: Optional[str] = Field(default=None, max_length=100)

    ContactPersonUserID: Optional[int] = Field(default=None, foreign_key="users.UserID")