from sqlmodel import SQLModel, create_engine
from sqlalchemy.exc import OperationalError
from sqlalchemy import text
from .models import *
import os
from dotenv import load_dotenv

load_dotenv()


def get_supermarket_id() -> str:
    load_dotenv(override=True)
    return os.environ["SUPERMARKET_ID"]


SupermarketID = get_supermarket_id()
SUBERMARKET_DB_USERNAME = os.getenv("SUBERMARKET_DB_USERNAME", "root")
SUBERMARKET_DB_PASSWORD = os.getenv("SUBERMARKET_DB_PASSWORD", "secretpass")
SUBERMARKET_DB_HOST = os.getenv("SUBERMARKET_DB_HOST", "100.92.172.33")
SUBERMARKET_DB_PORT = os.getenv("SUBERMARKET_DB_PORT", "4324")


mysql_file_name = "database.db"
mysql_url = f"mysql+pymysql://{SUBERMARKET_DB_USERNAME}:{SUBERMARKET_DB_PASSWORD}@{SUBERMARKET_DB_HOST}:{SUBERMARKET_DB_PORT}/{SupermarketID}"


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
