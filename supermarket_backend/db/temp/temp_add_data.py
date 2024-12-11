# edit this to work with the new dataase

from sqlmodel import SQLModel, Field, Session, create_engine
from datetime import datetime

from db.database import engine
from db.models import Product, Shelf, Screen

# Sample data for each table
products_data = [
    Product(id="11", name="Shampoo", category="Personal Care", shelf_id="111", price=5.50, status="active", last_updated=datetime(2023, 10, 30, 8, 0, 0)),
    Product(id="22", name="Toothpaste", category="Personal Care", shelf_id="222", price=2.99, status="active", last_updated=datetime(2023, 10, 30, 8, 0, 0)),
    Product(id="33", name="Chips", category="Snacks", shelf_id="333", price=1.25, status="active", last_updated=datetime(2023, 10, 30, 8, 0, 0)),
    Product(id="44", name="Soda", category="Beverages", shelf_id="444", price=1.75, status="active", last_updated=datetime(2023, 10, 30, 8, 0, 0)),
    Product(id="55", name="Bread", category="Bakery", shelf_id="555", price=2.00, status="active", last_updated=datetime(2023, 10, 30, 8, 0, 0)),
]

shelfs_data = [
    Shelf(id="111",unique_name="1A1", location="Aisle 1 - Section A1", capacity=20),
    Shelf(id="222",unique_name="1A2", location="Aisle 1 - Section A2", capacity=15),
    Shelf(id="333",unique_name="2B1", location="Aisle 2 - Section B1", capacity=10),
    Shelf(id="444",unique_name="2B2", location="Aisle 2 - Section B2", capacity=12),
    Shelf(id="555",unique_name="3C1", location="Aisle 3 - Section C1", capacity=25),
]

screens_data = [
    Screen(id=1, name="Screen 1", shelf_id="111", status="active", current_display="Shampoo", last_synced=datetime(2023, 10, 30, 8, 0, 0)),
    Screen(id=2, name="Screen 2", shelf_id="222", status="active", current_display="Toothpaste", last_synced=datetime(2023, 10, 30, 8, 0, 0)),
    Screen(id=3, name="Screen 3", shelf_id="333", status="inactive", current_display="Chips", last_synced=datetime(2023, 10, 30, 8, 0, 0)),
    Screen(id=4, name="Screen 4", shelf_id="444", status="active", current_display="Soda", last_synced=datetime(2023, 10, 30, 8, 0, 0)),
    Screen(id=5, name="Screen 5", shelf_id="555", status="inactive", current_display="Bread", last_synced=datetime(2023, 10, 30, 8, 0, 0)),
]

# Function to create tables and insert sample data
def setup_database():
    # Create tables
    SQLModel.metadata.create_all(engine)

    # Insert sample data
    with Session(engine) as session:
        session.add_all(products_data)
        session.add_all(shelfs_data)
        session.add_all(screens_data)
        session.commit()

# Run the setup function
setup_database()
