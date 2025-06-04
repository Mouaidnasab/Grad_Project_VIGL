from sqlmodel import SQLModel, Session, create_engine
from sqlalchemy import text
from .supermarket_models import *


BASE_MYSQL_URL = "mysql+pymysql://root:secretpass@100.92.172.33:4324/"


def create_supermarket_database(db_name: str, owner: Users):
    db_name = f"s{db_name}"
    print(f"Creating database `{db_name}` (if not exists)...")

    with create_engine(BASE_MYSQL_URL).connect() as conn:
        conn.execute(text(f"CREATE DATABASE IF NOT EXISTS `{db_name}`;"))
    print(f"Database `{db_name}` ready.")

    new_engine = create_engine(f"{BASE_MYSQL_URL}{db_name}")

    print(f"Creating supermarket tables in `{db_name}`...")
    SQLModel.metadata.create_all(
        new_engine,
        tables=[
            Screens.__table__,
            Products.__table__,
            Shelfs.__table__,
            ProductScreen.__table__,
            Users.__table__,
            PriceHistory.__table__,
            Promotions.__table__,
            RefreshToken.__table__,
        ],
    )
    session = Session(new_engine)
    session.add(owner)
    session.commit()
    print(f"Owner user created in `{db_name}`.")

    print(f"Supermarket tables created in `{db_name}`.")

    return
