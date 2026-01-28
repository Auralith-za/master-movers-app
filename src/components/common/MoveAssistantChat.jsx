import React, { useState, useRef, useEffect } from 'react'
import { MessageSquare, X, Send, Bot, Sparkles, User, Loader2, ChevronRight, Truck, Calendar, MapPin, Package, Clock } from 'lucide-react'
import Button from '../ui/Button'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

export default function MoveAssistantChat() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState([
        { type: 'bot', text: 'Hi! I\'m Mike, your AI Moving Assistant. 🤖\n\nI can help you estimate costs, find packing tips, or check on your existing booking.\n\nDo you have a Quote Number I can look up for you?' }
    ])
    const [inputValue, setInputValue] = useState('')
    const [isTyping, setIsTyping] = useState(false)
    const [activeQuote, setActiveQuote] = useState(null)
    const messagesEndRef = useRef(null)
    const navigate = useNavigate()

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, isOpen, isTyping])

    const handleSend = async (text = inputValue) => {
        if (!text.trim()) return

        // Add User Message
        setMessages(prev => [...prev, { type: 'user', text }])
        setInputValue('')
        setIsTyping(true)

        // Process Response
        setTimeout(async () => {
            const response = await generateResponse(text)
            setMessages(prev => [...prev, {
                type: 'bot',
                text: response.text,
                action: response.action,
                quoteData: response.quoteData,
                options: response.options
            }])
            setIsTyping(false)
        }, 1200)
    }

    const lookupQuote = async (searchStr) => {
        try {
            console.log("Searching for:", searchStr)

            // Try to find by UUID prefix (CASTING ID T0 TEXT)
            const { data: quotes, error } = await supabase
                .from('quotes')
                .select('*')
                .textSearch('id', `${searchStr}:*`) // UUID text search? No.
                // Let's try explicit filter with casting
                .filter('id::text', 'ilike', `${searchStr}%`)
                .limit(1)

            if (error || !quotes || quotes.length === 0) return null
            const quote = quotes[0]

            // Fetch Recent Activities
            const { data: activities } = await supabase
                .from('quote_activities')
                .select('*')
                .eq('quote_id', quote.id)
                .order('created_at', { ascending: false })
                .limit(5)

            return { quote, activities: activities || [] }
        } catch (err) {
            console.error(err)
            return null
        }
    }

    const generateResponse = async (input) => {
        const lower = input.toLowerCase()
        // Match hex-like strings of length 4+ (e.g., b16de9) or digits
        const idMatch = input.match(/[a-fA-F0-9-]{4,}/)

        // --- CONTEXT AWARE COMMANDS (If we have an active quote) ---
        if (activeQuote) {
            if (lower.includes('location') || lower.includes('address') || lower.includes('pickup') || lower.includes('destination')) {
                return {
                    text: `Here are the location details for Quote #${activeQuote.id.slice(0, 6)}...:`,
                    quoteData: {
                        type: 'locations',
                        pickup: activeQuote.pickup_address,
                        dropoff: activeQuote.dropoff_address,
                        distance: activeQuote.distance_km
                    },
                    options: ['View Inventory', 'Latest Updates', 'Exit']
                }
            }
            if (lower.includes('inventory') || lower.includes('item') || lower.includes('list')) {
                const items = activeQuote.items_json || []
                const summary = items.length > 0
                    ? `${items.length} total items logged.`
                    : "No inventory items logged yet."

                return {
                    text: `I pulled up the inventory list:\n\n${summary}`,
                    quoteData: {
                        type: 'inventory',
                        items: items.slice(0, 5), // Show first 5
                        totalCount: items.length
                    },
                    options: ['View Locations', 'Latest Updates', 'Exit']
                }
            }
            if (lower.includes('update') || lower.includes('status') || lower.includes('timeline')) {
                // Refresh activities
                const { data: activities } = await supabase
                    .from('quote_activities')
                    .select('*')
                    .eq('quote_id', activeQuote.id)
                    .order('created_at', { ascending: false })
                    .limit(5)

                return {
                    text: "Here is the latest activity on your booking:",
                    quoteData: {
                        type: 'updates',
                        activities: activities || []
                    },
                    options: ['View Locations', 'View Inventory', 'Exit']
                }
            }
            if (lower.includes('exit') || lower.includes('done') || lower.includes('stop') || lower.includes('thanks')) {
                setActiveQuote(null)
                return {
                    text: "Happy to help! Let me know if you need anything else.",
                    options: ["How much is a move?", "Packing Tips"]
                }
            }
        }

        // --- NEW QUOTE LOOKUP ---
        if (idMatch) {
            const quoteId = idMatch[0]
            const result = await lookupQuote(quoteId)

            if (result) {
                const { quote, activities } = result
                setActiveQuote(quote) // SET CONTEXT

                return {
                    text: `I found Quote #${quote.id.slice(0, 6)}...! \n\n**Status:** ${quote.status ? quote.status.toUpperCase() : 'NEW'}\n**Date:** ${quote.move_date || 'TBD'}\n\nWhat would you like to check?`,
                    options: ['View Locations', 'View Inventory', 'Latest Updates', 'Exit']
                }
            } else {
                // User tried an ID but we couldn't find it. 
                // Fall through? Or explicit error? Explicit error is better if it looked like an ID.
                return {
                    text: `I searched for a quote starting with "${quoteId}" but couldn't find it. Please double check the ID (it usually looks like b16de...).`
                }
            }
        }

        // --- STANDARD FAQs ---
        if (lower.includes('price') || lower.includes('cost') || lower.includes('quote')) {
            return {
                text: "I can definitely help with pricing! Moving costs depend on volume and distance. \n\n Would you like to start a quick 2-minute quote to get an exact price?",
                action: { label: "Start Quote", link: "/quote" }
            }
        }
        if (lower.includes('box') || lower.includes('packing')) {
            return {
                text: "We offer full packing services and sell high-quality moving boxes. We recommend roughly 10 boxes per room.",
                action: { label: "View Packing Materials", link: "/packing-materials" }
            }
        }
        if (lower.includes('contact') || lower.includes('phone') || lower.includes('email')) {
            return {
                text: "You can reach our human support team at 0800 123 456 or support@mastermovers.co.za.",
                action: { label: "Go to Contact Page", link: "/contact-us" }
            }
        }

        return {
            text: "I can help you check your quote status (just send me the Quote ID like 'b16...'), start a new quote, or answer questions about packing."
        }
    }

    /* SUGGESTED PROMPTS */
    const suggestions = [
        "Check status for #...",
        "How much does a move cost?",
        "I need packing boxes"
    ]

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-slate-900 text-white rounded-full shadow-2xl hover:scale-110 transition-transform duration-300 ring-4 ring-white/20 animate-in slide-in-from-bottom-10"
            >
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse"></div>
                <Bot size={28} />
            </button>
        )
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 w-[90vw] sm:w-[380px] h-[600px] max-h-[80vh] flex flex-col bg-white rounded-2xl shadow-2xl ring-1 ring-slate-900/5 overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300 font-sans">
            {/* HEADER */}
            <div className="bg-slate-900 p-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white shadow-inner">
                        <Sparkles size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-sm">Mike (AI Assistant)</h3>
                        <div className="flex items-center gap-1.5 opacity-80">
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                            <span className="text-xs text-slate-300">Online</span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                    <X size={20} />
                </button>
            </div>

            {/* MESSAGES */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 scrollbar-thin scrollbar-thumb-slate-200">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex flex-col ${msg.type === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2`}>
                        <div className={`
                            max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm
                            ${msg.type === 'user'
                                ? 'bg-red-600 text-white rounded-br-none'
                                : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none'}
                        `}>
                            {msg.text.split('\n').map((line, i) => (
                                <p key={i} className={i > 0 ? 'mt-2' : ''}>{line}</p>
                            ))}
                        </div>

                        {/* QUOTE DATA DISPLAY */}
                        {msg.quoteData && (
                            <div className="mt-2 w-[85%] bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-xs space-y-3">

                                {/* 1. LOCATIONS VIEW */}
                                {msg.quoteData.type === 'locations' && (
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-2">
                                            <div className="mt-0.5 p-1 bg-green-100 text-green-600 rounded">
                                                <MapPin size={14} />
                                            </div>
                                            <div>
                                                <span className="text-slate-400 text-[10px] uppercase font-bold">Origin</span>
                                                <p className="font-medium text-slate-800">{msg.quoteData.pickup}</p>
                                            </div>
                                        </div>
                                        <div className="flex justify-center">
                                            <Truck size={14} className="text-slate-300 transform rotate-90" />
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <div className="mt-0.5 p-1 bg-red-100 text-red-600 rounded">
                                                <MapPin size={14} />
                                            </div>
                                            <div>
                                                <span className="text-slate-400 text-[10px] uppercase font-bold">Destination</span>
                                                <p className="font-medium text-slate-800">{msg.quoteData.dropoff}</p>
                                            </div>
                                        </div>
                                        <div className="pt-2 border-t border-slate-50 text-right text-slate-400">
                                            Est. Distance: {msg.quoteData.distance}km
                                        </div>
                                    </div>
                                )}

                                {/* 2. INVENTORY VIEW */}
                                {msg.quoteData.type === 'inventory' && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                                            <Package size={14} className="text-red-500" />
                                            <span className="font-bold text-slate-800">Item Summary</span>
                                        </div>
                                        {msg.quoteData.items.map((item, i) => (
                                            <div key={i} className="flex justify-between items-center bg-slate-50 p-2 rounded">
                                                <span className="font-medium text-slate-700">{item.name || item.id}</span>
                                            </div>
                                        ))}
                                        {msg.quoteData.totalCount > 5 && (
                                            <p className="text-center text-slate-400 italic pt-1">
                                                + {msg.quoteData.totalCount - 5} more items...
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* 3. UPDATES VIEW */}
                                {msg.quoteData.type === 'updates' && (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                                            <Clock size={14} className="text-red-500" />
                                            <span className="font-bold text-slate-800">Timeline</span>
                                        </div>
                                        {msg.quoteData.activities.map(act => (
                                            <div key={act.id} className="relative pl-4 border-l-2 border-slate-100 last:border-0 pb-3">
                                                <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-white"></div>
                                                <p className="text-slate-700 leading-tight">{act.content}</p>
                                                <span className="text-[10px] text-slate-400">
                                                    {new Date(act.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* DYNAMIC OPTIONS / CHIPS */}
                        {msg.options && (
                            <div className="mt-2 flex flex-wrap justify-end gap-2 w-[85%]">
                                {msg.options.map((opt, i) => (
                                    <button
                                        key={opt}
                                        onClick={() => handleSend(opt)}
                                        className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-100 transition-colors border border-red-100"
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        )}

                        {msg.action && (
                            <button
                                onClick={() => navigate(msg.action.link)}
                                className="mt-1 flex items-center justify-center gap-2 text-xs font-bold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl transition-colors shadow-sm w-[85%]"
                            >
                                {msg.action.label} <ChevronRight size={14} />
                            </button>
                        )}
                    </div>
                ))}

                {isTyping && (
                    <div className="flex justify-start animate-in fade-in">
                        <div className="bg-white p-4 rounded-2xl rounded-bl-none border border-slate-100 shadow-sm flex gap-1.5 items-center">
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* SUGGESTIONS (Only show if NO active options) */}
            {messages.length === 1 && (
                <div className="px-4 py-2 bg-slate-50 flex gap-2 overflow-x-auto no-scrollbar mask-linear">
                    {suggestions.map(s => (
                        <button
                            key={s}
                            onClick={() => handleSend(s)}
                            className="whitespace-nowrap px-3 py-1.5 bg-white border border-red-100 text-red-600 text-xs font-semibold rounded-full hover:bg-red-50 transition-colors shadow-sm"
                        >
                            {s}
                        </button>
                    ))}
                </div>
            )}

            {/* INPUT */}
            <div className="p-4 bg-white border-t border-slate-100">
                <form
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="flex gap-2 items-end"
                >
                    <textarea
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        placeholder="Ask Mike..."
                        className="flex-1 bg-slate-50 text-slate-900 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500/20 resize-none h-[46px] max-h-[100px]"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleSend()
                            }
                        }}
                    />
                    <button
                        type="submit"
                        disabled={!inputValue.trim() || isTyping}
                        className="p-3 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-red-200"
                    >
                        {isTyping ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                    </button>
                </form>
            </div>
        </div>
    )
}
