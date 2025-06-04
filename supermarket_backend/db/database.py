from sqlmodel import SQLModel, create_engine
from sqlalchemy.exc import OperationalError
from sqlalchemy import text
from .models import *
import os


SUPERMARKET_ID = os.getenv("SUPERMARKET_ID", "s100001")


mysql_file_name = "database.db"
mysql_url = f"mysql+pymysql://root:secretpass@100.92.172.33:4324/{SUPERMARKET_ID}"


engine = create_engine(mysql_url)


def check_db_connection():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
            print("Database connection successful!")
    except OperationalError as e:
        print("Failed to connect to the database:", e)


def create_db_and_tables():
    print("Creating database and tables")
    SQLModel.metadata.create_all(engine)


# create_db_and_tables()

# check_db_connection()
