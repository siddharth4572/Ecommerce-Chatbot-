import { Bot } from "lucide-react"

// TypingIndicator component: Displays a visual cue that the bot is "typing".
export default function TypingIndicator() {
  return (
    // Aligns the indicator similarly to a bot message
    <div className="flex items-end gap-2 justify-start">
      {/* Bot Avatar */}
      <div className="h-8 w-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center self-start shadow">
        <Bot className="h-4 w-4 text-white" />
      </div>
      {/* Bubble containing the animated dots */}
      <div className="bg-white text-gray-800 rounded-xl md:rounded-2xl rounded-bl-none shadow-md border border-gray-200 px-4 py-3">
        {/* Animated dots */}
        <div className="flex space-x-1.5 items-center">
          <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDuration: '1.2s', animationDelay: "0s" }}></div>
          <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDuration: '1.2s', animationDelay: "0.15s" }}></div>
          <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDuration: '1.2s', animationDelay: "0.3s" }}></div>
        </div>
      </div>
    </div>
  )
}
