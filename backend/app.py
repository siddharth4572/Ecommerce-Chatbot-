import sqlite3
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import datetime
from datetime import timezone # For timezone-aware UTC datetimes
import random
import os

# Initialize the Flask application
app = Flask(__name__)
# Enable Cross-Origin Resource Sharing (CORS) for all routes,
# allowing the frontend (on a different port) to communicate with this backend.
CORS(app)

# Database configuration
DATABASE_NAME = 'ecommerce.db'

def get_db_connection():
    """Establishes a connection to the SQLite database.
    Configures rows to be returned as dictionary-like objects for easier column access.
    """
    conn = sqlite3.connect(DATABASE_NAME)
    conn.row_factory = sqlite3.Row # Allows accessing columns by name (e.g., row['username'])
    return conn

def create_tables():
    """Sets up the necessary database tables if they haven't been created yet.
    This is typically run once when the application starts.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # Table for storing user credentials
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL
        )
    ''')

    # Table for storing product information
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            price REAL NOT NULL,
            stock INTEGER NOT NULL,
            description TEXT,
            image_url TEXT
        )
    ''')

    # Table for storing chat messages between users and the bot
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS chat_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,            -- Which user this message belongs to
            message TEXT NOT NULL,               -- The content of the message
            is_user_message BOOLEAN NOT NULL,    -- True if it's a user's message, False if it's a bot's response
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, -- When the message was recorded
            FOREIGN KEY (user_id) REFERENCES users (id)   -- Links to the users table
        )
    ''')
    conn.commit()
    conn.close()

def populate_products():
    """Adds a set of mock products to the database if the products table is currently empty.
    This is useful for development and demonstration purposes.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM products")
    if cursor.fetchone()[0] == 0:
        categories = ["Electronics", "Books", "Clothing", "Home & Kitchen", "Sports", "Toys"]
        product_adjectives = ["Premium", "Budget", "High-Performance", "Eco-Friendly", "Compact", "Durable", "Smart"]
        product_nouns = ["Laptop", "Smartphone", "Headphones", "Keyboard", "Mouse", "Monitor", "Charger", "Speaker", "Novel", "Textbook", "Cookbook", "T-Shirt", "Jeans", "Jacket", "Blender", "Toaster", "Coffee Maker", "Dumbbells", "Yoga Mat", "Action Figure", "Board Game"]

        products_to_add = []
        for i in range(105): # Aim for a bit over 100 products for a good variety
            adj = random.choice(product_adjectives)
            noun = random.choice(product_nouns)
            name = f"{adj} {noun} Model {random.randint(100, 999)}"
            category = random.choice(categories)
            price = round(random.uniform(10.0, 2000.0), 2)
            stock = random.randint(0, 200)
            description = f"A high-quality {name} from the {category} category. Perfect for your needs. Features include: feature A, feature B, and outstanding feature C. Only {stock} left in stock!"
            # Using picsum.photos for varied placeholder images.
            # Seeding with name and index helps get somewhat consistent images for the same product if repopulated.
            image_url = f"https://picsum.photos/seed/{name.replace(' ', '_')}_{i}/600/400"
            products_to_add.append((name, category, price, stock, description, image_url))

        cursor.executemany('''
            INSERT INTO products (name, category, price, stock, description, image_url)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', products_to_add)
        conn.commit()
        app.logger.info(f"{len(products_to_add)} products populated.")
    else:
        app.logger.info("Products table already populated.")
    conn.close()


# --- Utility / Helper Functions ---

def generate_session_token(user_id):
    """Creates a basic session token.
    NOTE: This is for demonstration only and is NOT cryptographically secure for production.
          A proper implementation would use JWT or a similar secure token mechanism.
    """
    return f"session_token_for_user_{user_id}_{datetime.datetime.now(timezone.utc).timestamp()}"

def parse_chat_intent(message):
    """
    Performs a very basic analysis of the user's message to extract potential
    product categories, price constraints, and general keywords.
    This is a simplified approach; a real-world chatbot would use more advanced NLP.
    """
    message_lower = message.lower() # Normalize to lowercase for easier matching
    intent = {"category": None, "min_price": None, "max_price": None, "keywords": []}
    words = message_lower.split()

    # Attempt to identify a product category from the message.
    # This list could be expanded or loaded from a configuration.
    categories_db = ["electronics", "laptop", "laptops", "mobile", "mobiles", "phone", "phones", "book", "books", "clothing", "clothes", "home", "kitchen", "sports", "toys", "headphones"]
    for word in words:
        if word in categories_db:
            # Map variations to a canonical category name if needed
            if word in ["laptop", "laptops", "mobile", "mobiles", "phone", "phones", "headphones"]:
                intent["category"] = "Electronics" # Grouping common electronics
            else:
                intent["category"] = word.capitalize()
            break # Use the first recognized category term

    # Attempt to extract price constraints (e.g., "under 50k", "between 1000 and 2000").
    # This is a very basic implementation and could be significantly improved using regex or NLP.
    try:
        if "under" in message_lower or "below" in message_lower:
            for i, word_val in enumerate(words):
                if word_val in ["under", "below"] and i + 1 < len(words):
                    price_str = words[i+1].replace('k', '000').replace(',', '')
                    intent["max_price"] = float(price_str)
                    break
        elif "over" in message_lower or "above" in message_lower:
            for i, word_val in enumerate(words):
                if word_val in ["over", "above"] and i + 1 < len(words):
                    price_str = words[i+1].replace('k', '000').replace(',', '')
                    intent["min_price"] = float(price_str)
                    break
        elif "between" in message_lower and "and" in message_lower:
            # Ensure 'between' appears before 'and' and they have values after them
            idx_between = words.index("between")
            idx_and = words.index("and")
            if idx_between < idx_and and idx_between + 1 < len(words) and idx_and + 1 < len(words):
                min_p_str = words[idx_between+1].replace('k', '000').replace(',', '')
                max_p_str = words[idx_and+1].replace('k', '000').replace(',', '')
                intent["min_price"] = float(min_p_str)
                intent["max_price"] = float(max_p_str)
    except (ValueError, IndexError): # Catch if 'between' or 'and' not found, or conversion fails
        app.logger.warning(f"Could not parse price from message: '{message}'")

    # Extract potential keywords by removing common stopwords, already identified category terms,
    # digits, and words related to price.
    # This is a naive approach; proper NLP techniques would be more robust.
    stopwords = [
        "show", "me", "find", "i'm", "looking", "for", "a", "an", "the", "is", "are", "of", "in", "on", "at",
        "under", "over", "below", "above", "between", "and", "can", "you", "please", "display", "what", "whats",
        "any", "some", "about"
    ]
    price_related_words = ["price", "cost", "budget", "range", "k", "thousand", "dollar", "dollars", "rupee", "rupees"]
    
    # Initial filtering of words not useful for keyword search
    base_potential_keywords = [
        word for word in words
        if word not in stopwords
        and word not in categories_db # Don't include raw category terms as keywords if already identified
        and not word.isdigit()
        and word not in price_related_words
    ]

    # If a category was identified, further refine keywords by removing words
    # that might be part of the category name itself (e.g., if category is "Home & Kitchen",
    # don't include "home" or "kitchen" as separate keywords).
    final_keywords = []
    identified_category_lower_words = []
    if intent.get("category"):
        # Ensure intent["category"] is not None before calling lower()
        identified_category_lower_words = intent["category"].lower().split()

    for pk_word in base_potential_keywords:
        # Only add if it's not part of the identified category phrase
        if not (identified_category_lower_words and pk_word in identified_category_lower_words):
            final_keywords.append(pk_word)
        
    intent["keywords"] = list(set(final_keywords)) # Use set for unique keywords

    app.logger.info(f"Parsed intent: {intent} from message: '{message}'")
    return intent

# --- API Endpoints ---

@app.route('/register', methods=['POST'])
def register():
    """Handles new user registration.
    Expects 'username' and 'password' in JSON body.
    """
    data = request.get_json()
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({"status": "error", "message": "Username and password are required."}), 400

    username = data['username']
    password = data['password']
    hashed_password = generate_password_hash(password)

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO users (username, password_hash) VALUES (?, ?)", (username, hashed_password))
        conn.commit()
        user_id = cursor.lastrowid
        return jsonify({"status": "success", "message": "User registered successfully.", "data": {"user_id": user_id, "username": username}}), 201
    except sqlite3.IntegrityError:
        return jsonify({"status": "error", "message": "Username already exists."}), 400
    finally:
        conn.close()

@app.route('/login', methods=['POST'])
def login():
    """Handles user login.
    Expects 'username' and 'password' in JSON body.
    Verifies credentials and returns a session token on success.
    """
    data = request.get_json()
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({"status": "error", "message": "Username and password are required."}), 400

    username = data['username']
    password = data['password']

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
    user = cursor.fetchone()
    conn.close()

    if user and check_password_hash(user['password_hash'], password):
        token = generate_session_token(user['id']) # Generate a basic session token
        return jsonify({
            "status": "success",
            "message": "Login successful.",
            "data": {"token": token, "user_id": user['id'], "username": user['username']}
        }), 200
    else:
        return jsonify({"status": "error", "message": "Invalid username or password."}), 401


@app.route('/products', methods=['GET'])
def get_products():
    """Endpoint to fetch products with optional filtering.
    Supports filtering by:
    - 'search': A general keyword search in product name or description.
    - 'category': Specific product category.
    - 'min_price': Minimum price.
    - 'max_price': Maximum price.
    """
    query_params = request.args
    search_term = query_params.get('search', '').lower()
    category_filter = query_params.get('category', '').lower()
    min_price_filter = query_params.get('min_price')
    max_price_filter = query_params.get('max_price')

    conn = get_db_connection()
    cursor = conn.cursor()

    base_query = "SELECT id, name, category, price, stock, description, image_url FROM products WHERE 1=1"
    params = []

    if search_term:
        base_query += " AND (LOWER(name) LIKE ? OR LOWER(description) LIKE ?)"
        params.extend([f"%{search_term}%", f"%{search_term}%"])
    if category_filter:
        base_query += " AND LOWER(category) = ?"
        params.append(category_filter)
    if min_price_filter:
        try:
            base_query += " AND price >= ?"
            params.append(float(min_price_filter))
        except ValueError:
            return jsonify({"status": "error", "message": "Invalid min_price format."}), 400
    if max_price_filter:
        try:
            base_query += " AND price <= ?"
            params.append(float(max_price_filter))
        except ValueError:
            return jsonify({"status": "error", "message": "Invalid max_price format."}), 400

    cursor.execute(base_query, tuple(params))
    products = [dict(row) for row in cursor.fetchall()]
    conn.close()

    if products:
        return jsonify({"status": "success", "message": "Products retrieved successfully.", "data": products}), 200
    else:
        return jsonify({"status": "success", "message": "No products found matching your criteria.", "data": []}), 200


@app.route('/chat', methods=['POST'])
def chat_handler():
    """Main endpoint for chatbot interactions.
    Receives a user's message, attempts to parse intent (category, price, keywords),
    queries the database for matching products, and returns them.
    """
    data = request.get_json()
    # Ensure essential data (message and user_id from an authenticated session) is present
    if not data or not data.get('message') or not data.get('user_id'):
        return jsonify({"status": "error", "message": "Message and user_id are required."}), 400

    user_message = data['message']
    user_id = data['user_id'] # User ID is crucial for context and history

    # Step 1: Attempt to understand the user's intent from their message
    intent = parse_chat_intent(user_message)

    # Step 2: Construct and execute a database query based on the parsed intent
    conn = get_db_connection()
    cursor = conn.cursor()
    query = "SELECT id, name, category, price, stock, description, image_url FROM products WHERE 1=1"
    params = []

    if intent.get("category"):
        query += " AND LOWER(category) = ?"
        params.append(intent["category"].lower())

    if intent.get("min_price") is not None:
        query += " AND price >= ?"
        params.append(intent["min_price"])

    if intent.get("max_price") is not None:
        query += " AND price <= ?"
        params.append(intent["max_price"])

    # If keywords were extracted, add conditions to search product names and descriptions.
    # This allows for more free-form searching beyond just category and price.
    if intent.get("keywords"):
        keyword_conditions = []
        for kw in intent["keywords"]:
            keyword_conditions.append("(LOWER(name) LIKE ? OR LOWER(description) LIKE ?)")
            params.extend([f"%{kw}%", f"%{kw}%"])
        if keyword_conditions:
            query += " AND (" + " OR ".join(keyword_conditions) + ")"


    cursor.execute(query, tuple(params))
    products_found = [dict(row) for row in cursor.fetchall()]
    conn.close()

    # Step 3: Prepare the response based on whether products were found
    if products_found:
        response_message = f"Found {len(products_found)} products matching your query."
        # The frontend will typically save the user's message and this bot response to history.
        return jsonify({
            "status": "success",
            "message": response_message,
            "data": {"products": products_found, "original_query": user_message, "parsed_intent": intent}
        }), 200
    else:
        # Provide a helpful message if no products match the query
        no_product_message = "I couldn't find any products matching your description."
        # Add more specific advice if some intent was parsed but still yielded no results
        if intent.get("category") or intent.get("min_price") is not None or intent.get("max_price") is not None or intent.get("keywords"):
            no_product_message += " You can try rephrasing your query or being more general."
        else: # Generic advice if no specific intent was understood
            no_product_message += " Please try asking about specific product categories, price ranges, or keywords."
        return jsonify({"status": "success", "message": no_product_message, "data": {"products": [], "original_query": user_message, "parsed_intent": intent}}), 200


@app.route('/chat/history', methods=['POST'])
def save_chat_history():
    """Endpoint for the frontend to save chat messages to the database.
    The frontend is responsible for sending both user messages and bot responses
    to this endpoint to be logged.
    """
    data = request.get_json()
    # Validate required fields for a chat history entry
    if not all(key in data for key in ['user_id', 'message']) or not isinstance(data.get('is_user_message'), bool):
        return jsonify({"status": "error", "message": "user_id, message, and is_user_message (boolean) are required."}), 400

    user_id = data['user_id']
    message_content = data['message']
    is_user = data['is_user_message']
    # Use timestamp from frontend if provided, otherwise generate a new UTC timestamp
    timestamp_str = data.get('timestamp', datetime.datetime.now(timezone.utc).isoformat() + "Z")

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('''
            INSERT INTO chat_history (user_id, message, is_user_message, timestamp)
            VALUES (?, ?, ?, ?)
        ''', (user_id, message_content, is_user, timestamp_str))
        conn.commit()
        return jsonify({"status": "success", "message": "Chat entry saved."}), 201
    except Exception as e:
        app.logger.error(f"Error saving chat history: {e}")
        return jsonify({"status": "error", "message": "Failed to save chat history."}), 500
    finally:
        conn.close()


@app.route('/chat/history', methods=['GET'])
def get_chat_history():
    """Endpoint to retrieve chat history for a specific user.
    Typically called when the user logs in or opens the chat interface
    to load previous conversation.
    """
    user_id_str = request.args.get('user_id')
    if not user_id_str:
        return jsonify({"status": "error", "message": "user_id parameter is required."}), 400

    try:
        user_id = int(user_id_str)
    except ValueError:
        return jsonify({"status": "error", "message": "user_id must be an integer."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    # Fetch the last 50 messages for the user, ordered by when they were recorded.
    # This provides a reasonable amount of recent history.
    cursor.execute('''
        SELECT user_id, message, is_user_message, timestamp
        FROM chat_history
        WHERE user_id = ?
        ORDER BY timestamp DESC
        LIMIT 50
    ''', (user_id,)) # Ensure user_id is passed as a tuple for the query
    history_rows = cursor.fetchall()
    conn.close()

    history = [
        {"user_id": row["user_id"], "message": row["message"], "is_user_message": bool(row["is_user_message"]), "timestamp": row["timestamp"]}
        for row in history_rows
    ]
    history.reverse() # Reverse to display in chronological order (oldest first)

    return jsonify({"status": "success", "message": "Chat history retrieved.", "data": {"history": history}}), 200


# --- Application Initialization ---
# This code will run once when the application starts, even when using Gunicorn.
with app.app_context():
    app.logger.info(f"Database will be created/connected at: {DATABASE_NAME}")
    create_tables()      # Create tables if they don't exist
    populate_products()  # Add mock products if the table is empty

    # Run the Flask development server
    # host='0.0.0.0' makes it accessible from any IP address on the network
    # debug=True enables debugger and auto-reloader (DO NOT use in production)
    app.run(host='0.0.0.0', port=5000, debug=True)