import os
from sqlmodel import SQLModel, create_engine
from sqlalchemy.exc import OperationalError
from sqlalchemy import text
from .models import *
from dotenv import load_dotenv

load_dotenv()


GOV_DB = os.getenv("GOV_DB", "gov")
GOV_DB_USERNAME = os.getenv("GOV_DB_USERNAME", "root")
GOV_DB_PASSWORD = os.getenv("GOV_DB_PASSWORD", "secretpass")
GOV_DB_HOST = os.getenv("GOV_DB_HOST", "100.92.172.33")
GOV_DB_PORT = os.getenv("GOV_DB_PORT", "4324")


mysql_file_name = "database.db"
mysql_url = f"mysql+pymysql://{GOV_DB_USERNAME}:{GOV_DB_PASSWORD}@{GOV_DB_HOST}:{GOV_DB_PORT}/{GOV_DB}"


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
