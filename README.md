# E-commerce Chatbot

## 1. Overview

This project is a full-stack E-commerce Sales Chatbot designed to enhance the customer shopping experience on an e-commerce platform. It features a Python Flask backend that serves product information and handles user interactions, and a Next.js (React) frontend that provides a responsive user interface for login, registration, and chatting with the bot.

The primary goal is to allow users to search for products using natural language, explore product details, and manage their session, all facilitated by an AI-powered assistant.

**Key Features:**
- User authentication (Login & Registration).
- Natural language processing for product queries (e.g., "show me laptops under ₹50000").
- Display of product information and cards.
- Chat history saving and retrieval.
- Responsive user interface for desktop and mobile devices.
- Mock e-commerce inventory with 100+ products.

## 2. Architecture

The application follows a client-server architecture:

*   **Frontend (Client-Side):** A Next.js (React) single-page application responsible for the user interface, user interactions, and communication with the backend API. It handles user input, displays chat messages and product information, and manages user sessions via `localStorage`.
*   **Backend (Server-Side):** A Python Flask application that provides a RESTful API. It manages user authentication, processes chat messages, parses user intent to query products from a mock database, and handles chat history.
*   **Database:** An SQLite database is used for the backend to store mock product inventory, user credentials, and chat history.

## 3. Technologies Used

*   **Backend:**
    *   **Python 3.x**
    *   **Flask:** A lightweight WSGI web application framework.
    *   **Flask-CORS:** For handling Cross-Origin Resource Sharing.
    *   **Werkzeug:** For password hashing (development purposes).
    *   **SQLite3:** For the relational database.
    *   *(For potential deployment: Gunicorn as a WSGI server)*
*   **Frontend:**
    *   **Next.js 15.x:** A React framework for server-rendered applications.
    *   **React 19.x:** A JavaScript library for building user interfaces.
    *   **TypeScript:** For static typing.
    *   **Tailwind CSS v3.x:** A utility-first CSS framework for styling.
    *   **Lucide React:** For icons.
    *   **Fetch API:** For making HTTP requests to the backend.
*   **Development Tools:**
    *   **Node.js & npm:** For frontend dependency management and running the dev server.
    *   **pip & venv:** For Python package management and virtual environments.
    *   **Git & GitHub (Implied):** For version control.

## 4. Features Implemented

### Backend Features:
*   **User Authentication:**
    *   `POST /register`: Registers new users with hashed passwords.
    *   `POST /login`: Authenticates users and returns a simple session token and user details.
*   **Product Interaction:**
    *   `GET /products`: Allows searching/filtering products by keyword, category, and price range.
    *   `POST /chat`: Accepts user messages, performs basic intent parsing (category, price), and returns relevant product data or a conversational response.
*   **Chat History:**
    *   `POST /chat/history`: Stores individual chat messages (both user and bot) with user ID and timestamp.
    *   `GET /chat/history`: Retrieves the chat history for a given user.
*   **Mock Inventory:** Automatically populates the SQLite database with 100+ diverse mock product entries on first run.
*   **CORS:** Enabled to allow requests from the frontend development server.
*   **JSON Responses:** All API responses are in a consistent JSON format (`{status, message, data}`).

### Frontend Features:
*   **Login & Registration:** Secure pages for user authentication, interacting with the backend.
*   **Responsive Chatbot UI:**
    *   Chat window for displaying conversation history.
    *   Input field for users to type messages.
    *   "Send" button functionality.
    *   "Reset Chat" button to clear the current chat view (client-side visual reset).
*   **Product Display:** Product information returned by the chatbot is displayed in clear, styled cards.
*   **Chat History:**
    *   Automatically loads previous chat session for a logged-in user.
    *   Saves each user and bot interaction to the backend.
*   **Session Management:** Uses `localStorage` to persist user authentication status (user ID, username, token).
*   **Error Handling:** Displays user-friendly messages for API errors or network issues.
*   **Styling:** Modern and responsive UI built with Tailwind CSS.
*   **Currency:** Displays prices using the Rupee symbol (₹).

## 5. Project Structure

```
ecommerce_chatbot/
├── backend/
│   ├── app.py             # Main Flask application, API routes, DB logic
│   ├── ecommerce.db       # SQLite database file (created on run)
│   ├── requirements.txt   # Python dependencies
│   └── venv/              # Python virtual environment (if created)
│
├── frontend/
│   ├── app/               # Next.js App Router: pages, layout
│   │   ├── chatbot/
│   │   │   └── page.tsx   # Chatbot interface page
│   │   ├── login/
│   │   │   └── page.tsx   # Login page
│   │   ├── register/
│   │   │   └── page.tsx   # Registration page
│   │   ├── globals.css    # Global styles and Tailwind directives
│   │   └── layout.tsx     # Root layout for Next.js app
│   ├── components/        # Reusable React components
│   │   ├── ProductCard.tsx
│   │   └── TypingIndicator.tsx
│   ├── public/            # Static assets
│   ├── next.config.ts     # Next.js configuration
│   ├── package.json       # Frontend dependencies and scripts
│   ├── postcss.config.mjs # PostCSS configuration
│   ├── tailwind.config.ts # Tailwind CSS configuration
│   └── tsconfig.json      # TypeScript configuration
│
└── README.md              # This file
```

## 6. Setup and Installation

### Prerequisites:
*   **Node.js:** Version 18.x or later (for Next.js).
*   **npm:** (Usually comes with Node.js).
*   **Python:** Version 3.10 or later.
*   **pip:** (Usually comes with Python).

### Backend Setup:
1.  Navigate to the backend directory:
    ```bash
    cd ecommerce_chatbot/backend
    ```
2.  Create a Python virtual environment:
    ```bash
    python -m venv venv
    ```
3.  Activate the virtual environment:
    *   Windows: `.\venv\Scripts\activate`
    *   macOS/Linux: `source venv/bin/activate`
4.  Install Python dependencies:
    ```bash
    pip install -r requirements.txt
    ```

### Frontend Setup:
1.  Navigate to the frontend directory:
    ```bash
    cd ecommerce_chatbot/frontend
    ```
2.  Install JavaScript dependencies:
    ```bash
    npm install
    ```

## 7. Running the Application

You need to run both the backend and frontend servers simultaneously in separate terminal windows.

### Start the Backend Server:
1.  Open a terminal.
2.  Navigate to the `ecommerce_chatbot/backend` directory.
3.  Activate the virtual environment:
    *   Windows: `.\venv\Scripts\activate`
    *   macOS/Linux: `source venv/bin/activate`
4.  Run the Flask application:
    ```bash
    python app.py
    ```
    The backend server will start, typically on `http://localhost:5000`. The `ecommerce.db` file will be created in this directory if it doesn't exist, and products will be populated.

### Start the Frontend Server:
1.  Open a **new** terminal.
2.  Navigate to the `ecommerce_chatbot/frontend` directory.
3.  Run the Next.js development server:
    ```bash
    npm run dev
    ```
    The frontend server will start, typically on `http://localhost:3000`.

### Accessing the Application:
Open your web browser and go to `http://localhost:3000`.

## 8. API Endpoints (Backend)

*   `POST /register`: Creates a new user.
*   `POST /login`: Logs in an existing user.
*   `POST /chat`: Handles chat messages, parses intent, returns product data or conversational response.
*   `GET /products`: Searches/filters products based on query parameters (search, category, price).
*   `POST /chat/history`: Saves a chat message (user or bot) to history.
*   `GET /chat/history`: Retrieves chat history for a user (requires `user_id` query parameter).

## 9. Potential Challenges Faced (and Solutions)

*   **Tailwind CSS Styling Issues:**
    *   **Challenge:** Initially, Tailwind CSS v4 styles were not applying correctly, leading to an unstyled UI and "unknown utility class" errors in the build process. This persisted despite various configuration attempts for `postcss.config.mjs` and `tailwind.config.ts`.
    *   **Solution:** The issue was resolved by downgrading Tailwind CSS from v4 to v3.4.4, along with compatible versions of `postcss` (v8.4.38) and `autoprefixer` (v10.4.19). This involved updating `package.json`, `postcss.config.mjs`, and performing a clean reinstallation of `node_modules` and clearing the `.next` cache. This stabilized the styling pipeline.
*   **Backend Chat Intent Parsing Error:**
    *   **Challenge:** An `AttributeError: 'NoneType' object has no attribute 'lower'` occurred in the `parse_chat_intent` function when users sent messages that didn't map to any product categories (e.g., "what is the weather?").
    *   **Solution:** The keyword extraction logic within `parse_chat_intent` in `backend/app.py` was refactored to more safely handle cases where no category is initially identified, preventing the error.
*   **Currency Symbol Consistency:**
    *   **Challenge:** The frontend initially used `$` as a placeholder currency symbol.
    *   **Solution:** Updated relevant frontend components (`ProductCard.tsx`, `chatbot/page.tsx`) to consistently use the Rupee symbol (`₹`).

## 10. Future Enhancements (Optional)

*   **Full Purchase Process:** Implement a persistent shopping cart and a checkout flow.
*   **Advanced NLP:** Integrate a more sophisticated NLP library (e.g., spaCy, NLTK, or a cloud-based NLP service) for more accurate intent recognition and entity extraction.
*   **Persistent Database for Deployment:** Migrate from SQLite to a managed database service like PostgreSQL or MySQL for production deployments.
*   **User Profile Management:** Allow users to view/edit their profiles.
*   **Admin Panel:** Create an interface for administrators to manage products, view users, and potentially analyze chat logs.
*   **Enhanced Session Management:** Implement more secure server-side session management (e.g., using JWTs or Flask-Login with server-side sessions).
*   **Real-time Chat Features:** Consider WebSockets for a more interactive, real-time chat experience.

## 11. Deployment Considerations (Brief)

*   **Frontend (Next.js):** Platforms like Vercel or Netlify offer excellent free tiers and seamless deployment for Next.js applications directly from a Git repository.
*   **Backend (Flask):** Platforms like Render or Fly.io provide free tiers suitable for Python web services. This would typically involve containerizing the Flask app (using Docker) or using a Procfile with Gunicorn. For data persistence, migrating from SQLite to a managed database service offered by the platform (e.g., Render's free PostgreSQL) would be necessary.

## 12.Author 
Siddharth Katyal
