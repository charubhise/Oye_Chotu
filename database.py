"""
Database module for Oye Chotu! Voice Shopping.
Manages SQLite storage for products, active cart items, and placed demo orders.
"""

import sqlite3
import os
from typing import List, Dict, Any, Optional

DB_PATH = os.environ.get("CHOTU_DB_PATH", "chotu_shop.db")


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db(sample_products: Optional[List[Dict[str, Any]]] = None, force_reseed: bool = False) -> None:
    """Initialize SQLite tables and seed catalog products."""
    conn = get_connection()
    cur = conn.cursor()

    if force_reseed:
        cur.execute("DROP TABLE IF EXISTS products")

    cur.execute("""
    CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        marathi_name TEXT,
        hindi_name TEXT,
        category TEXT NOT NULL,
        category_label TEXT NOT NULL,
        product_type TEXT NOT NULL,
        price INTEGER NOT NULL,
        original_price INTEGER NOT NULL,
        sizes TEXT,
        rating REAL NOT NULL,
        review_count INTEGER NOT NULL,
        image_url TEXT NOT NULL,
        description TEXT NOT NULL,
        color TEXT,
        tags TEXT NOT NULL,
        in_stock INTEGER NOT NULL DEFAULT 1
    );
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS cart (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id)
    );
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS orders (
        order_id TEXT PRIMARY KEY,
        total_amount INTEGER NOT NULL,
        item_count INTEGER NOT NULL,
        items_summary TEXT NOT NULL,
        customer_name TEXT DEFAULT 'Valued Customer',
        delivery_address TEXT DEFAULT '102, Shanti Nagar, Mumbai, Maharashtra',
        payment_method TEXT DEFAULT 'Cash on Delivery (Simulated)',
        status TEXT DEFAULT 'Confirmed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    conn.commit()

    if sample_products:
        cur.execute("SELECT COUNT(*) FROM products")
        count = cur.fetchone()[0]
        if count == 0 or force_reseed:
            for p in sample_products:
                cur.execute("""
                INSERT OR REPLACE INTO products (
                    id, name, marathi_name, hindi_name, category, category_label,
                    product_type, price, original_price, sizes, rating, review_count, image_url,
                    description, color, tags, in_stock
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    p["id"],
                    p["name"],
                    p.get("marathi_name", ""),
                    p.get("hindi_name", ""),
                    p["category"],
                    p["category_label"],
                    p.get("product_type", ""),
                    p["price"],
                    p["original_price"],
                    ",".join(p.get("sizes", [])),
                    p["rating"],
                    p["review_count"],
                    p["image"],
                    p["description"],
                    p.get("color", ""),
                    ",".join(p.get("tags", [])),
                    1 if p.get("in_stock", True) else 0
                ))
            conn.commit()

    conn.close()


def query_products(
    requested_type: Optional[str] = None,
    requested_color: Optional[str] = None,
    category: Optional[str] = None,
    max_price: Optional[int] = None,
    min_price: Optional[int] = None,
    query_text: Optional[str] = None,
    sort_by_price_asc: bool = False
) -> List[Dict[str, Any]]:
    """Retrieve products with strict filtering priority from SQLite."""
    conn = get_connection()
    cur = conn.cursor()

    conditions = ["in_stock = 1"]
    params: List[Any] = []

    if requested_type:
        conditions.append("LOWER(product_type) = LOWER(?)")
        params.append(requested_type)

    if category:
        conditions.append("LOWER(category) = LOWER(?)")
        params.append(category)

    if requested_color:
        conditions.append("LOWER(color) = LOWER(?)")
        params.append(requested_color)

    if max_price is not None:
        conditions.append("price <= ?")
        params.append(max_price)

    if min_price is not None:
        conditions.append("price >= ?")
        params.append(min_price)

    sql = f"SELECT * FROM products WHERE {' AND '.join(conditions)}"

    if sort_by_price_asc:
        sql += " ORDER BY price ASC"
    else:
        sql += " ORDER BY rating DESC, review_count DESC"

    cur.execute(sql, params)
    rows = cur.fetchall()

    results: List[Dict[str, Any]] = []
    for r in rows:
        item = dict(r)
        item["tags"] = item["tags"].split(",") if item["tags"] else []
        results.append(item)

    conn.close()
    return results


def save_demo_order(order_data: Dict[str, Any]) -> str:
    """Record an order into SQLite and return order ID."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
    INSERT INTO orders (order_id, total_amount, item_count, items_summary, status)
    VALUES (?, ?, ?, ?, ?)
    """, (
        order_data["order_id"],
        order_data["total_amount"],
        order_data["item_count"],
        order_data["items_summary"],
        "Confirmed"
    ))
    conn.commit()
    conn.close()
    return order_data["order_id"]
