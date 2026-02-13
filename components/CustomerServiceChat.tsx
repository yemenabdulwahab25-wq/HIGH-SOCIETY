
import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Sparkles, User, Bot, ExternalLink } from 'lucide-react';
import { storage } from '../services/storage';
import { initBudtenderChat } from '../services/gemini';
import { Chat, GenerateContentResponse } from '@google/genai';

interface Source {
    title: string;
    uri: string;
}

interface Message {
  role: 'user' | 'model';
  text: string;
  sources?: Source[];
}

export const CustomerServiceChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Welcome to Billionaire Level. I'm The Concierge. How may I elevate your experience today? 🌿" }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Chat with Inventory Context
  useEffect(() => {
    const products = storage.getProducts();
    chatSessionRef.current = initBudtenderChat(products);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim() || !chatSessionRef.current) return;

    const userMsg = inputValue;
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const result: GenerateContentResponse = await chatSessionRef.current.sendMessage({ 
          message: userMsg 
      });
      
      const responseText = result.text || "I'm having a little trouble connecting to the network right now.";
      
      // Extract Google Search Sources safely
      const chunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const sources: Source[] = chunks
        ?.map(c => c.web)
        .filter((w): w is { uri: string; title: string } => !!(w && w.uri && w.title))
        .map(w => ({ title: w.title, uri: w.uri })) || [];
      
      setMessages(prev => [...prev, { role: 'model', text: responseText, sources }]);
    } catch (error) {
      console.error("Chat Error", error);
      setMessages(prev => [...prev, { role: 'model', text: "Apologies, I briefly lost connection. Could you repeat that?" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 flex items-center justify-center ${
          isOpen ? 'bg-dark-800 text-gray-400 rotate-90' : 'bg-gradient-to-tr from-cannabis-600 to-cannabis-400 text-white'
        }`}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-7 h-7" />}
        {!isOpen && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-gold-500"></span>
            </span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[90vw] md:w-[400px] h-[500px] bg-dark-900/95 backdrop-blur-xl border border-gray-700 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-10">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-dark-950 to-dark-800 p-4 border-b border-gray-700 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cannabis-500/10 flex items-center justify-center border border-cannabis-500/30">
                <Sparkles className="w-5 h-5 text-cannabis-400" />
            </div>
            <div>
                <h3 className="font-bold text-white text-sm">The Concierge</h3>
                <p className="text-xs text-cannabis-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cannabis-500 animate-pulse" />
                    Online • AI Budtender
                </p>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-700">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'model' && (
                    <div className="w-8 h-8 rounded-full bg-dark-800 flex-shrink-0 flex items-center justify-center border border-gray-700 mt-1">
                        <Bot className="w-4 h-4 text-gray-400" />
                    </div>
                )}
                <div 
                    className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${
                        msg.role === 'user' 
                        ? 'bg-cannabis-600 text-white rounded-tr-none' 
                        : 'bg-dark-800 text-gray-200 border border-gray-700 rounded-tl-none'
                    }`}
                >
                    <div>{msg.text}</div>
                    
                    {/* Render Sources if available */}
                    {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-700">
                            <p className="text-[10px] text-gray-500 font-bold uppercase mb-2 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" /> Grounded in Search
                            </p>
                            <div className="space-y-1">
                                {msg.sources.slice(0, 3).map((source, sIdx) => (
                                    <a 
                                        key={sIdx} 
                                        href={source.uri} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-xs text-cannabis-400 hover:text-cannabis-300 truncate group"
                                    >
                                        <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
                                        <span className="truncate underline decoration-cannabis-500/30 underline-offset-2">{source.title}</span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-dark-800 flex-shrink-0 flex items-center justify-center border border-gray-700 mt-1">
                        <User className="w-4 h-4 text-gray-400" />
                    </div>
                )}
              </div>
            ))}
            
            {isLoading && (
               <div className="flex gap-3 justify-start">
                   <div className="w-8 h-8 rounded-full bg-dark-800 flex-shrink-0 flex items-center justify-center border border-gray-700">
                        <Bot className="w-4 h-4 text-gray-400" />
                    </div>
                   <div className="bg-dark-800 p-3 rounded-2xl rounded-tl-none border border-gray-700 flex items-center gap-1">
                       <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                       <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                       <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
                   </div>
               </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-dark-950 border-t border-gray-800">
            <div className="relative">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Ask about flavors, effects, or stock..."
                    className="w-full bg-dark-800 text-white pl-4 pr-12 py-3 rounded-xl border border-gray-700 focus:border-cannabis-500 focus:outline-none placeholder:text-gray-600"
                />
                <button 
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isLoading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-cannabis-600 text-white rounded-lg hover:bg-cannabis-500 disabled:opacity-50 disabled:bg-gray-700 transition-colors"
                >
                    <Send className="w-4 h-4" />
                </button>
            </div>
          </div>

        </div>
      )}
    </>
  );
};
