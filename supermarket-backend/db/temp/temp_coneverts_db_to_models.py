import pymysql
from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime

# Database connection configuration
db_config = {
    "host": "100.92.172.33",
    "port": 4324,  # Default MySQL port; change if needed
    "user": "root",
    "password": "secretpass",
    "database": "ESL"
}

# Connect to the MySQL database and fetch table, column, and foreign key details
def fetch_tables_and_columns():
    connection = pymysql.connect(
        host=db_config["host"],
        port=db_config["port"],
        user=db_config["user"],
        password=db_config["password"],
        database=db_config["database"]
    )
    cursor = connection.cursor(pymysql.cursors.DictCursor)
    
    # Get all tables
    cursor.execute("SHOW TABLES")
    tables = [table[f"Tables_in_{db_config['database']}"] for table in cursor.fetchall()]

    # Get columns and foreign keys for each table
    table_columns = {}
    foreign_keys = {}
    for table in tables:
        cursor.execute(f"DESCRIBE {table}")
        table_columns[table] = cursor.fetchall()

        cursor.execute(f"""
            SELECT COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE TABLE_NAME = '{table}' AND TABLE_SCHEMA = '{db_config['database']}' AND REFERENCED_TABLE_NAME IS NOT NULL
        """)
        foreign_keys[table] = cursor.fetchall()

    cursor.close()
    connection.close()
    return table_columns, foreign_keys

# Generate SQLModel classes
def generate_sqlmodel_classes(table_columns, foreign_keys):
    independent_classes = []
    dependent_classes = []

    for table, columns in table_columns.items():
        class_name = table.capitalize().replace("_", "")  # Ensure proper Python class naming
        class_def = f"class {class_name}(SQLModel, table=True):\n"
        
        # Add columns
        for column in columns:
            field_type = map_mysql_type_to_sqlmodel(column["Type"])
            is_id = column["Key"] == "PRI" and column["Field"] == "id"
            nullable = "True" if column["Null"] == "YES" else "False"
            primary_key = "primary_key=True" if column["Key"] == "PRI" else ""
            default = f", default={repr(column['Default'])}" if column["Default"] else ""
            
            class_def += (
                f"    {column['Field']}: {f'Optional[{field_type}]' if is_id else field_type} = Field("
                f"nullable={nullable}, {primary_key}{default})\n"
            )
        
        # Add relationships
        relationships = []
        if table in foreign_keys and foreign_keys[table]:
            relationships.append("\n    # Relationships\n")
            for fk in foreign_keys[table]:
                referenced_class = fk["REFERENCED_TABLE_NAME"].capitalize().replace("_", "")
                relationships.append(
                    f"    {fk['COLUMN_NAME']}_rel: {referenced_class} = Relationship(back_populates='{table.lower()}s')\n"
                )
            class_def += "".join(relationships)

        class_def += "\n"
        if table in foreign_keys and foreign_keys[table]:
            dependent_classes.append((class_name, class_def))
        else:
            independent_classes.append((class_name, class_def))

    # Sort classes: independent classes first, dependent classes later
    sorted_classes = independent_classes + dependent_classes
    return "\n".join(class_def for _, class_def in sorted_classes)

# Map MySQL types to SQLModel/Python types
def map_mysql_type_to_sqlmodel(mysql_type):
    if "int" in mysql_type:
        return "int"
    elif "varchar" in mysql_type or "text" in mysql_type or "char" in mysql_type:
        return "str"
    elif "float" in mysql_type or "double" in mysql_type:
        return "float"
    elif "decimal" in mysql_type:
        return "float"  # Adjust as needed for more precision
    elif "datetime" in mysql_type or "timestamp" in mysql_type:
        return "datetime"
    elif "date" in mysql_type:
        return "datetime"  # Using datetime to handle both date and datetime
    elif "time" in mysql_type:
        return "datetime"  # Using datetime for simplicity
    elif "blob" in mysql_type:
        return "bytes"
    else:
        return "str"  # Fallback type

# Main script
if __name__ == "__main__":
    table_columns, foreign_keys = fetch_tables_and_columns()
    sqlmodel_classes = generate_sqlmodel_classes(table_columns, foreign_keys)
    
    # Save to a file or print the classes
    with open("models.py", "w") as f:
        f.write("from sqlmodel import SQLModel, Field, Relationship\n")
        f.write("from typing import Optional, List\n")
        f.write("from datetime import datetime\n\n")
        f.write(sqlmodel_classes)
    
    print("SQLModel classes with sorted dependencies generated and written to sqlmodel_classes.py.")
