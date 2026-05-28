import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3307")
DB_USER = os.getenv("DB_USER", "root")
DB_PASS = os.getenv("DB_PASS", "root")
DB_NAME = os.getenv("DB_NAME", "travel_recommendation")

try:
    conn = mysql.connector.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASS,
        database=DB_NAME
    )
    cursor = conn.cursor()
    cursor.execute("SHOW TABLES")
    tables = [t[0] for t in cursor.fetchall()]
    
    for table in ["users"]:
        if table in tables:
            cursor.execute(f"DESCRIBE {table}")
            print(f"\nColumns in {table}:")
            for col in cursor.fetchall():
                print(f"- {col[0]} ({col[1]})")
        
    conn.close()
except Exception as e:
    print(f"Error: {e}")
