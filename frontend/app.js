document.addEventListener('DOMContentLoaded', () => {
    const apiUrl = 'http://localhost:5000'; // Backend API URL

    // Page elements
    const authPage = document.getElementById('auth-page');
    const chatPage = document.getElementById('chat-page');

    // Auth form elements
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');
    const authMessage = document.getElementById('auth-message');

    // Chat elements
    const chatUsername = document.getElementById('chat-username');
    const logoutButton = document.getElementById('logout-button');
    const chatWindow = document.getElementById('chat-window');
    const productDisplayArea = document.getElementById('product-display-area');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    const resetButton = document.getElementById('reset-button');
    const chatErrorMessage = document.getElementById('chat-error-message');

    let currentUserId = null;
    let currentUsername = null;
    let sessionToken = null;

    // --- Helper Functions ---
    function displayAuthMessage(message, isError = true) {
        authMessage.textContent = message;
        authMessage.className = isError ? 'message error-message' : 'message success-message';
    }

    function displayChatMessage(message, isError = true) {
        chatErrorMessage.textContent = message;
        chatErrorMessage.className = isError ? 'message error-message' : 'message';
        if (!isError) {
            setTimeout(() => chatErrorMessage.textContent = '', 3000);
        }
    }

    function switchToChatPage(userData) {
        currentUserId = userData.user_id;
        currentUsername = userData.username;
        sessionToken = userData.token; // Assuming token is returned on login

        localStorage.setItem('chatbot_user_id', currentUserId);
        localStorage.setItem('chatbot_username', currentUsername);
        localStorage.setItem('chatbot_session_token', sessionToken);

        chatUsername.textContent = currentUsername;
        authPage.classList.remove('active');
        chatPage.classList.add('active');
        loadChatHistory();
    }

    function switchToAuthPage() {
        currentUserId = null;
        currentUsername = null;
        sessionToken = null;

        localStorage.removeItem('chatbot_user_id');
        localStorage.removeItem('chatbot_username');
        localStorage.removeItem('chatbot_session_token');

        chatPage.classList.remove('active');
        authPage.classList.add('active');
        chatWindow.innerHTML = `<div class="message bot-message"><p>Hello! How can I help you find the perfect product today?</p><span class="timestamp">Just now</span></div>`; // Reset chat window
        productDisplayArea.innerHTML = ''; // Clear products
        loginForm.reset();
        registerForm.reset();
    }

    function addMessageToChat(message, sender, timestamp) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender === 'user' ? 'user-message' : 'bot-message');

        const p = document.createElement('p');
        p.textContent = message;
        messageDiv.appendChild(p);

        const span = document.createElement('span');
        span.classList.add('timestamp');
        span.textContent = timestamp ? new Date(timestamp).toLocaleTimeString() : new Date().toLocaleTimeString();
        messageDiv.appendChild(span);

        chatWindow.appendChild(messageDiv);
        chatWindow.scrollTop = chatWindow.scrollHeight; // Scroll to bottom
    }

    function displayProducts(products) {
        productDisplayArea.innerHTML = ''; // Clear previous products
        if (!products || products.length === 0) {
            // Optionally, display a message if no products are found in this area
            // productDisplayArea.innerHTML = '<p>No products to display for this query.</p>';
            return;
        }

        products.forEach(product => {
            const card = document.createElement('div');
            card.classList.add('product-card');
            card.innerHTML = `
                <h4>${product.name}</h4>
                <p>Category: ${product.category}</p>
                <p class="price">Price: $${product.price.toFixed(2)}</p>
                <p>Stock: ${product.stock > 0 ? product.stock : 'Out of stock'}</p>
                <p>${product.description.substring(0, 100)}${product.description.length > 100 ? '...' : ''}</p>
            `;
            productDisplayArea.appendChild(card);
        });
    }

    async function saveChatMessage(userId, messageText, isUserMessage, timestamp) {
        try {
            const response = await fetch(`${apiUrl}/chat/history`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    message: messageText,
                    is_user_message: isUserMessage,
                    timestamp: timestamp || new Date().toISOString()
                })
            });
            if (!response.ok) {
                const errorData = await response.json();
                console.error('Failed to save chat message:', errorData.message);
            }
        } catch (error) {
            console.error('Error saving chat message:', error);
        }
    }

    // --- Event Listeners ---

    // Toggle between Login and Register forms
    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        authMessage.textContent = '';
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
        authMessage.textContent = '';
    });

    // Registration
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('register-username').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;

        if (password !== confirmPassword) {
            displayAuthMessage('Passwords do not match.');
            return;
        }

        try {
            const response = await fetch(`${apiUrl}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (response.ok && data.status === 'success') {
                displayAuthMessage('Registration successful! Please login.', false);
                registerForm.reset();
                showLoginLink.click(); // Switch to login form
            } else {
                displayAuthMessage(data.message || 'Registration failed.');
            }
        } catch (error) {
            displayAuthMessage('Error connecting to server.');
            console.error('Registration error:', error);
        }
    });

    // Login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        try {
            const response = await fetch(`${apiUrl}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (response.ok && data.status === 'success') {
                switchToChatPage(data.data);
            } else {
                displayAuthMessage(data.message || 'Login failed.');
            }
        } catch (error) {
            displayAuthMessage('Error connecting to server.');
            console.error('Login error:', error);
        }
    });

    // Logout
    logoutButton.addEventListener('click', () => {
        addMessageToChat('You have been logged out.', 'bot', new Date().toISOString());
        // Optionally, call a /logout endpoint on the backend if it exists to invalidate server-side session/token
        switchToAuthPage();
    });

    // Send Chat Message
    async function handleSendMessage() {
        const messageText = chatInput.value.trim();
        if (!messageText) return;

        const userTimestamp = new Date().toISOString();
        addMessageToChat(messageText, 'user', userTimestamp);
        saveChatMessage(currentUserId, messageText, true, userTimestamp);
        chatInput.value = '';
        productDisplayArea.innerHTML = ''; // Clear previous products

        try {
            const response = await fetch(`${apiUrl}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // Send token if backend requires authentication for this route
                // 'Authorization': `Bearer ${sessionToken}` 
                body: JSON.stringify({ user_id: currentUserId, message: messageText })
            });
            const data = await response.json();
            const botTimestamp = new Date().toISOString();

            if (response.ok && data.status === 'success') {
                addMessageToChat(data.message, 'bot', botTimestamp);
                saveChatMessage(currentUserId, data.message, false, botTimestamp);
                if (data.data && data.data.products) {
                    displayProducts(data.data.products);
                }
            } else {
                const errorMessage = data.message || 'Error processing your request.';
                addMessageToChat(errorMessage, 'bot', botTimestamp);
                saveChatMessage(currentUserId, errorMessage, false, botTimestamp);
                displayChatMessage(errorMessage);
            }
        } catch (error) {
            const errorTimestamp = new Date().toISOString();
            const netError = 'Network error or server unavailable.';
            addMessageToChat(netError, 'bot', errorTimestamp);
            saveChatMessage(currentUserId, netError, false, errorTimestamp);
            displayChatMessage(netError);
            console.error('Chat send error:', error);
        }
    }

    sendButton.addEventListener('click', handleSendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    });

    // Reset Chat
    resetButton.addEventListener('click', () => {
        chatWindow.innerHTML = `<div class="message bot-message"><p>Chat reset. How can I help you?</p><span class="timestamp">${new Date().toLocaleTimeString()}</span></div>`;
        productDisplayArea.innerHTML = '';
        chatErrorMessage.textContent = '';
        // Optionally, clear history on server or just client-side for this session
        // For now, this is a client-side visual reset.
        // We could also save a "Chat Reset" message to history.
        const resetMsg = "Chat was reset by user.";
        const timestamp = new Date().toISOString();
        addMessageToChat(resetMsg, 'bot', timestamp); // Add to UI
        saveChatMessage(currentUserId, resetMsg, false, timestamp); // Save to history
    });

    // Load Chat History
    async function loadChatHistory() {
        if (!currentUserId) return;
        try {
            const response = await fetch(`${apiUrl}/chat/history?user_id=${currentUserId}`);
            // Add token if backend requires: headers: {'Authorization': `Bearer ${sessionToken}`}
            const data = await response.json();

            if (response.ok && data.status === 'success' && data.data.history) {
                chatWindow.innerHTML = ''; // Clear default message
                if (data.data.history.length === 0) {
                     addMessageToChat("Welcome! Ask me about our products.", 'bot', new Date().toISOString());
                } else {
                    data.data.history.forEach(item => {
                        addMessageToChat(item.message, item.is_user_message ? 'user' : 'bot', item.timestamp);
                    });
                }
                addMessageToChat("Your previous session was restored.", 'bot', new Date().toISOString());

            } else {
                 addMessageToChat("Could not load previous chat. Starting fresh!", 'bot', new Date().toISOString());
                console.warn('Failed to load chat history:', data.message);
            }
        } catch (error) {
            addMessageToChat("Error loading chat history. Starting fresh!", 'bot', new Date().toISOString());
            console.error('Error loading chat history:', error);
        }
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }


    // --- Initial Setup ---
    function checkLoggedInUser() {
        const storedUserId = localStorage.getItem('chatbot_user_id');
        const storedUsername = localStorage.getItem('chatbot_username');
        const storedToken = localStorage.getItem('chatbot_session_token');

        if (storedUserId && storedUsername && storedToken) {
            switchToChatPage({ user_id: storedUserId, username: storedUsername, token: storedToken });
        } else {
            switchToAuthPage();
        }
    }

    checkLoggedInUser(); // Check on page load
});