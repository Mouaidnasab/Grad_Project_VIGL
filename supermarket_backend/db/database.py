from sqlmodel import SQLModel,create_engine
from sqlalchemy.exc import OperationalError
from sqlalchemy import text
from .models import *




mysql_file_name = "database.db"
mysql_url = f"mysql+pymysql://root:secretpass@100.92.172.33:4324/Supermarket"


engine = create_engine(mysql_url)

def check_db_connection():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))  # Use text() to make it executable
            print("Database connection successful!")
    except OperationalError as e:
        print("Failed to connect to the database:", e)

def create_db_and_tables():
    print("Creating database and tables")
    SQLModel.metadata.create_all(engine)