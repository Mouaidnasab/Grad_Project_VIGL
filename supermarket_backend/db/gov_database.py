from sqlmodel import SQLModel, create_engine
from sqlalchemy.exc import OperationalError
from sqlalchemy import text
from .models import *


mysql_file_name = "database.db"
mysql_url = f"mysql+pymysql://root:secretpass@100.92.172.33:4324/gov"


gov_engine = create_engine(mysql_url)


def check_db_connection():
    try:
        with gov_engine.connect() as connection:
            connection.execute(text("SELECT 1"))
            print("Database connection successful!")
    except OperationalError as e:
        print("Failed to connect to the database:", e)


def create_db_and_tables():
    print("Creating database and tables")
    SQLModel.metadata.create_all(gov_engine)
