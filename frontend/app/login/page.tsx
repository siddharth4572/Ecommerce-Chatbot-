"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, LogIn, AlertCircle } from "lucide-react"

// Use an environment variable for the API URL, with a fallback for local dev
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Login page component
export default function LoginPage() {
  // State for form data (username, password)
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  })
  // State to toggle password visibility
  const [showPassword, setShowPassword] = useState(false);
  // State to indicate loading status during API call
  const [isLoading, setIsLoading] = useState(false);
  // State to store and display any login errors
  const [error, setError] = useState("");
  // Next.js router instance for navigation
  const router = useRouter();

  // Handles changes in form input fields
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ // Update form data state
      ...prev,
      [name]: value,
    }));
    setError(""); // Clear any previous errors when user starts typing
  };

  // Handles form submission for login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default browser form submission
    setIsLoading(true);   // Set loading state
    setError("");         // Clear previous errors

    try {
      // API call to the backend /login endpoint
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData), // Send username and password
      });

      const responseData = await response.json(); // Parse JSON response from backend

      if (response.ok && responseData.status === "success") {
        // Check if the necessary data is present in the response
        if (responseData.data &&
            typeof responseData.data.token === 'string' &&
            typeof responseData.data.user_id !== 'undefined' &&
            typeof responseData.data.username === 'string') {
          
          // Store user token and details in local storage for session persistence
          localStorage.setItem("userToken", responseData.data.token);
          localStorage.setItem("userId", String(responseData.data.user_id)); // Ensure userId is stored as string
          localStorage.setItem("username", responseData.data.username);

          // Redirect to the main chatbot page on successful login
          router.push("/chatbot");
        } else {
          // This case handles if backend response is 200 OK but data is missing/malformed
          setError("Login successful, but received incomplete user data from the server.");
        }
      } else {
        // Handle failed login attempts (e.g., wrong credentials, server error)
        setError(responseData.message || "Login failed. Please check your credentials.");
      }
    } catch (err) {
      // Handle network errors or if the backend server is unreachable
      setError((err as Error).message || "Network error. Please ensure the backend server is running and accessible.");
    } finally {
      setIsLoading(false); // Reset loading state regardless of outcome
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 lg:p-10 border border-gray-200">
          <div className="text-center mb-8">
            <div className="mx-auto h-14 w-14 bg-indigo-600 rounded-full flex items-center justify-center shadow-md">
              <LogIn className="h-7 w-7 text-white" />
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Welcome Back</h2>
            <p className="mt-2 text-sm text-gray-500">Sign in to continue to your dashboard</p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md flex items-center space-x-3 shadow-sm">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="text-red-700 text-sm font-medium">{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-150 ease-in-out"
                  placeholder="your.username"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="block w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-150 ease-in-out"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-150 ease-in-out"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                  <span>Signing In...</span>
                </>
              ) : (
                "Sign In"
              )}
            </button>

            <div className="text-center pt-2">
              <p className="text-sm text-gray-500">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="font-semibold text-indigo-600 hover:text-indigo-500 hover:underline transition-colors duration-150 ease-in-out">
                  Sign up
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
