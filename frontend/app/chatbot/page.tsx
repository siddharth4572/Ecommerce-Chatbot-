"use client"

import React, { useCallback } from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Send, RotateCcw, LogOut, Bot, User, AlertCircle } from "lucide-react"
import ProductCard from "@/components/ProductCard"
import TypingIndicator from "@/components/TypingIndicator"

interface Message {
  id: string
  text: string
  sender: "user" | "bot"
  timestamp: string
  products?: Product[]
}

interface ChatHistoryMessage {
  message: string
  is_user_message: boolean
  timestamp: string
}

interface ChatHistoryResponse {
  status: string
  message: string
  data?: { history: ChatHistoryMessage[] }
}

interface Product {
  id: string
  name: string
  price: number
  category: string
  description: string
  image_url?: string // Optional URL for the product image
}

interface ChatResponse {
  status: string
  message: string
  data?: { products: Product[] }
}

// Use an environment variable for the API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Main component for the chatbot page
export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState("")
  const [username, setUsername] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Fetches the user's chat history from the backend
  const loadChatHistory = useCallback(async () => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) return; // Should not happen if auth check passed, but good for safety

      const response = await fetch(`${API_URL}/chat/history?user_id=${userId}`);

      if (response.ok) {
        const responseData: ChatHistoryResponse = await response.json();
        if (responseData.status === "success" && responseData.data?.history) {
          // Map backend history format to frontend Message interface
          const formattedMessages = responseData.data.history.map((msg) => ({
            id: msg.timestamp + Math.random().toString(36).substring(7), // Create a somewhat unique ID
            text: msg.message,
            sender: msg.is_user_message ? "user" : "bot",
            timestamp: new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            // Note: products are not typically stored with individual history messages from backend
          }));
          if (formattedMessages.length > 0) {
            setMessages(formattedMessages);
          } else {
            // If history is empty, show a default welcome.
            setMessages([{
                id: Date.now().toString(),
                text: "Welcome! How can I assist you with our products today?",
                sender: "bot",
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            }]);
          }
        } else {
          console.warn("Chat history response not as expected or history is empty:", responseData.message);
        }
      } else {
        // Handle HTTP errors (e.g., 404, 500) when fetching history
        console.error("Failed to fetch chat history, status:", response.status);
         setError("Could not load your chat history. Please try again later.");
      }
    } catch (err) {
      // Handle network errors or other issues during fetch
      console.error("Error loading chat history:", err);
      setError("An error occurred while loading chat history.");
    }
  }, []);
  // Effect hook to run on component mount
  useEffect(() => {
    // Retrieve user authentication details from local storage
    const token = localStorage.getItem("userToken");
    const userId = localStorage.getItem("userId");
    const storedUsername = localStorage.getItem("username");

    // If token or userId is missing, user is not authenticated, redirect to login
    if (!token || !userId) {
      router.push("/login");
      return; // Stop further execution in this effect
    }

    // Set the username for display and load chat history
    setUsername(storedUsername || userId); // Fallback to userId if username somehow isn't stored
    loadChatHistory();
  }, [router, loadChatHistory]);

  // Sends a chat message (user or bot) to the backend to be saved in history
  const saveChatHistory = async (messageText: string, senderType: "user" | "bot") => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        console.warn("Cannot save chat history: User ID not found.");
        return;
      }

      await fetch(`${API_URL}/chat/history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: parseInt(userId), // Backend expects an integer
          message: messageText,
          is_user_message: senderType === "user",
          timestamp: new Date().toISOString(), // ISO format for backend
        }),
      });
      // Not handling response here for brevity, but in a real app, you might check for success
    } catch (err) {
      console.error("Error saving chat message to history:", err);
      // Optionally, notify the user or implement a retry mechanism
    }
  };

  // Effect hook to scroll to the bottom of the chat window whenever messages or typing status change
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Scrolls the chat window to the latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Handles the process of sending a user's message to the chatbot backend
  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault(); // Prevent default form submission
    if (!inputMessage.trim() || isLoading) return; // Don't send empty or while already loading

    const userMessageText = inputMessage.trim();
    const currentUserId = localStorage.getItem("userId");

    // Optimistically add user's message to the UI
    const newUserMsg: Message = {
      id: `user-${Date.now()}`, // More descriptive ID
      text: userMessageText,
      sender: "user",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prevMessages) => [...prevMessages, newUserMsg]);
    setInputMessage(""); // Clear the input field
    setIsLoading(true);   // Set loading state for UI feedback
    setIsTyping(true);    // Show bot typing indicator
    setError("");         // Clear previous errors

    // Persist user's message to backend history
    await saveChatHistory(userMessageText, "user");

    try {
      // Send message to the main /chat endpoint
      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessageText,
          user_id: currentUserId ? parseInt(currentUserId) : null, // Backend expects integer
        }),
      });

      const responseData: ChatResponse = await response.json();

      if (!response.ok || responseData.status !== "success") {
        const errorDetail = responseData.message || "Chatbot API request failed";
        throw new Error(errorDetail);
      }

      // Construct bot's response message for UI
      const botResponseMsg: Message = {
        id: `bot-${Date.now()}`, // More descriptive ID
        text: responseData.message || "Thanks for your message!", // Fallback text
        sender: "bot",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        products: responseData.data?.products || [], // Safely access products
      };

      // Simulate bot "thinking" time then display and save response
      setTimeout(() => {
        setIsTyping(false); // Hide typing indicator
        setMessages((prevMessages) => [...prevMessages, botResponseMsg]);
        if (botResponseMsg.text) {
          saveChatHistory(botResponseMsg.text, "bot"); // Persist bot's response
        }
      }, 800); // Adjust delay as needed

    } catch (err) {
      // Handle errors from the /chat API call or other issues
      setIsTyping(false);
      const errorMessageText = err.message || "Sorry, something went wrong. Please try again.";
      setError(errorMessageText); // Display error to user

      // Add an error message from the bot to the chat UI
      const errorUiMsg: Message = {
        id: `error-${Date.now()}`,
        text: "I'm having trouble connecting right now. Please check back later.",
        sender: "bot",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prevMessages) => [...prevMessages, errorUiMsg]);
    } finally {
      setIsLoading(false); // Reset loading state
    }
  };

  // Clears the chat messages from the UI (client-side reset)
  const handleReset = () => {
    setMessages([{ // Reset to initial welcome message
        id: Date.now().toString(),
        text: "Chat reset. How can I help you find something new?",
        sender: "bot",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }]);
    setError(""); // Clear any displayed errors
    // Note: This doesn't clear server-side history.
    // A "Chat Reset" event could be logged to history if desired.
    const userId = localStorage.getItem("userId");
    if (userId) {
      saveChatHistory("User reset the chat.", "user"); // Log reset action
    }
    console.log("Chat UI reset. Server-side history remains.");
  };

  // Handles user logout: clears local storage and redirects to login page
  const handleLogout = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    router.push("/login");
  };

  // Allows sending message by pressing Enter key in the input field
  const handleKeyPress = (event: React.KeyboardEvent) => {
    // Send message if Enter is pressed and Shift is not (to allow multi-line input if textarea was used)
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault(); // Prevent default newline behavior
      handleSendMessage(event);
    }
  }

  return (
    <div className="flex flex-col h-screen bg-slate-100">
      {/* Header */}
      <div className="bg-white shadow-md border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center shadow">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">E-Commerce AI Assistant</h1>
            {username && <p className="text-xs text-gray-500">Online as {username}</p>}
          </div>
        </div>

        <div className="flex items-center space-x-1 sm:space-x-2">
          <button
            onClick={handleReset}
            className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all duration-150 ease-in-out"
            title="Reset Chat"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
          <button
            onClick={handleLogout}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-all duration-150 ease-in-out"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mx-2 sm:mx-4 my-2 rounded-md shadow relative">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {messages.length === 0 && !isTyping && (
          <div className="text-center py-10 flex flex-col items-center justify-center h-full">
            <Bot className="h-20 w-20 text-gray-300 mb-6" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Welcome to your E-Commerce Assistant!</h3>
            <p className="text-gray-500 max-w-lg text-center">
              I can help you find products, compare items, and much more. Try
              asking: <em className="text-indigo-500">&apos;Show me laptops under ₹50000&apos;</em> or <em className="text-indigo-500">&apos;Are there any headphones?&apos;</em>
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className="space-y-3"> {/* Reduced space-y for tighter product card grouping */}
            <div className={`flex items-end gap-2 ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
              {message.sender === "bot" && (
                <div className="h-8 w-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center self-start shadow">
                  <Bot className="h-4 w-4 text-white" />
                </div>
              )}
              <div
                className={`rounded-xl md:rounded-2xl px-4 py-3 max-w-[70%] sm:max-w-[65%] md:max-w-[60%] lg:max-w-[55%] break-words ${
                  message.sender === "user"
                    ? "bg-indigo-600 text-white rounded-br-none shadow-md"
                    : "bg-white text-gray-800 rounded-bl-none shadow-md border border-gray-200"
                }`}
              >
                <p className="text-sm leading-relaxed">{message.text}</p>
                <p className={`text-xs mt-1.5 ${message.sender === "user" ? "text-indigo-200 text-right" : "text-gray-400 text-left"}`}>
                  {message.timestamp}
                </p>
              </div>
               {message.sender === "user" && (
                <div className="h-8 w-8 bg-slate-600 rounded-full flex items-center justify-center self-start shadow">
                  <User className="h-4 w-4 text-white" />
                </div>
              )}
            </div>

            {/* Product Cards - Displayed directly after the bot message that contains them */}
            {message.sender === "bot" && message.products && message.products.length > 0 && (
              <div className="pl-0 sm:pl-10"> {/* Adjust left padding for product cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pt-2">
                  {message.products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="bg-white border-t border-gray-200 p-3 sm:p-4 sticky bottom-0 z-50 shadow-top">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2 sm:space-x-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow duration-150 ease-in-out shadow-sm"
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
            className="p-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150 ease-in-out shadow-md hover:shadow-lg transform hover:scale-105"
            aria-label="Send message"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  )
}
