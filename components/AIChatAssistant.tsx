import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat, Part } from "@google/genai";
import { Send, X, Sparkles, Loader2, Bot, Image as ImageIcon, Key, ExternalLink, RefreshCw, GripHorizontal, Scaling } from 'lucide-react';
import { ChartDataPoint, AdCampaignData, FinancialItem, GlobalUIConfig, FinancialItem as FinancialItemType, ChannelCostData, FinancialAnalysisData, OverviewMetricData } from '../types';
import { AI_TOOLS, AI_SYSTEM_INSTRUCTION } from '../constants';

interface AIChatAssistantProps {
    activeTab: 'overview' | 'tasks' | 'marketing' | 'financial' | 'profile';
    
    // Data Context Props
    overviewMetrics?: OverviewMetricData[];
    chartData?: ChartDataPoint[];
    channelCostData?: ChannelCostData[];
    marketingData?: AdCampaignData[];
    financialItems?: FinancialItem[];
    financialAnalysis?: FinancialAnalysisData;

    // Update Handlers
    onUpdateOverview: (data: ChartDataPoint[]) => void;
    onUpdateChannelCost?: (data: ChannelCostData[]) => void;
    onUpdateMarketing: (data: AdCampaignData[]) => void;
    onUpdateFinancial: (data: FinancialItemType[]) => void;
    onUpdateFinancialAnalysis: (data: FinancialAnalysisData) => void;
    onUpdateUI: (data: Partial<GlobalUIConfig>) => void;
}

interface Message {
    role: 'user' | 'model';
    text: string;
    image?: string;
    isProcessing?: boolean;
}

// Custom Markdown Renderer Component
const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    // Basic parser for Bold, Tables, Lists, and Line Breaks
    const renderContent = () => {
        const lines = content.split('\n');
        const elements: React.ReactNode[] = [];
        let inTable = false;
        let tableHeader: string[] = [];
        let tableRows: string[][] = [];
        let listItems: React.ReactNode[] = [];

        const processText = (text: string) => {
            // Process Bold: **text**
            const parts = text.split(/(\*\*.*?\*\*)/g);
            return parts.map((part, index) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={index} className="text-slate-900 font-bold">{part.slice(2, -2)}</strong>;
                }
                return part;
            });
        };

        const flushList = (keyPrefix: string) => {
            if (listItems.length > 0) {
                elements.push(
                    <ul key={`${keyPrefix}-list`} className="list-disc ml-5 mb-3 space-y-1">
                        {listItems}
                    </ul>
                );
                listItems = [];
            }
        };

        const flushTable = (keyPrefix: string) => {
            if (inTable) {
                elements.push(
                    <div key={`${keyPrefix}-table`} className="overflow-x-auto my-3 rounded-lg border border-slate-200 shadow-sm">
                        <table className="min-w-full text-sm text-left">
                            <thead className="bg-slate-100 text-slate-700 font-bold">
                                <tr>
                                    {tableHeader.map((th, i) => (
                                        <th key={i} className="px-3 py-2 border-b border-slate-200">{processText(th)}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {tableRows.map((row, i) => (
                                    <tr key={i} className="hover:bg-slate-50">
                                        {row.map((td, j) => (
                                            <td key={j} className="px-3 py-2 text-slate-600">{processText(td)}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
                inTable = false;
                tableHeader = [];
                tableRows = [];
            }
        };

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Detect Table
            if (line.startsWith('|')) {
                flushList(`line-${i}`);
                if (!inTable) {
                     // Check if it's a header or separator
                     // Ideally 1st line is header, 2nd is separator
                     // But simpler logic: assume current line is header if we aren't in table
                     inTable = true;
                     tableHeader = line.split('|').filter(c => c.trim() !== '').map(c => c.trim());
                     // Check next line for separator |---| and skip it
                     if (lines[i+1] && lines[i+1].trim().startsWith('|') && lines[i+1].includes('---')) {
                         i++;
                     }
                } else {
                    const row = line.split('|').filter(c => c.trim() !== '').map(c => c.trim());
                    // If row contains '---', it's a separator, ignore
                    if (!line.includes('---')) {
                         tableRows.push(row);
                    }
                }
                continue;
            } else {
                flushTable(`line-${i}`);
            }

            // Detect List
            if (line.startsWith('- ') || line.startsWith('* ')) {
                const listContent = line.substring(2);
                listItems.push(<li key={`li-${i}`}>{processText(listContent)}</li>);
                continue;
            } else {
                flushList(`line-${i}`);
            }

            // Regular paragraph
            if (line.length > 0) {
                 elements.push(<p key={`p-${i}`} className="mb-2 leading-relaxed">{processText(line)}</p>);
            } else {
                 // Preserve spacing logic somewhat?
            }
        }
        
        // Final flush
        flushList('end');
        flushTable('end');

        return elements;
    };

    return <div className="markdown-body text-sm">{renderContent()}</div>;
};


// FIX API KEY: Sử dụng Key trực tiếp nếu biến môi trường không hoạt động
// Đây là key user cung cấp để chạy trên GitHub Pages
const USER_PROVIDED_KEY = 'AIzaSyCe0LMlRYGy6RY9mmeaNmXdbE8yLAaRvoM';

// Ưu tiên theo thứ tự: Vite Env -> User Input (Local Storage) -> Hardcoded Fallback
const getEffectiveKey = () => {
    // Kiểm tra xem Vite có replace process.env.API_KEY không
    // Nếu không replace, dòng dưới có thể gây lỗi reference trong browser strict mode nếu không cẩn thận
    // Tuy nhiên define trong vite.config.ts sẽ xử lý việc này thành chuỗi tĩnh.
    try {
        if (process.env.API_KEY) return process.env.API_KEY;
    } catch (e) {}
    
    try {
        if (process.env.VITE_GEMINI_API_KEY) return process.env.VITE_GEMINI_API_KEY;
    } catch (e) {}

    return USER_PROVIDED_KEY;
};

const AIChatAssistant: React.FC<AIChatAssistantProps> = ({ 
    activeTab, 
    // Data Context
    overviewMetrics,
    chartData,
    channelCostData,
    marketingData,
    financialItems,
    financialAnalysis,
    // Handlers
    onUpdateOverview, 
    onUpdateChannelCost,
    onUpdateMarketing, 
    onUpdateFinancial,
    onUpdateFinancialAnalysis,
    onUpdateUI
}) => {
    const [isOpen, setIsOpen] = useState(false);
    
    // Window State (Draggable & Resizable)
    const [position, setPosition] = useState({ x: window.innerWidth - 420, y: window.innerHeight - 650 }); // Initial bottom-rightish
    const [size, setSize] = useState({ width: 400, height: 600 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    // State quản lý API Key người dùng nhập (nếu muốn override)
    const [userApiKey, setUserApiKey] = useState('');
    const [tempKeyInput, setTempKeyInput] = useState('');
    
    // Key thực tế được sử dụng
    const envKey = getEffectiveKey();
    const effectiveKey = userApiKey || envKey;
    const isKeyReady = !!effectiveKey;

    const [input, setInput] = useState('');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    const chatSessionRef = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // Initial Positioning when opened
    useEffect(() => {
        if (isOpen) {
             // Ensure it's visible
             if (position.x > window.innerWidth - 100) setPosition(p => ({ ...p, x: window.innerWidth - 420 }));
             if (position.y > window.innerHeight - 100) setPosition(p => ({ ...p, y: window.innerHeight - 650 }));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);


    // Load Key từ LocalStorage khi khởi chạy
    useEffect(() => {
        const savedKey = localStorage.getItem('gemini_api_key');
        if (savedKey) {
            setUserApiKey(savedKey);
        }
    }, []);

    // Khởi tạo tin nhắn chào mừng
    useEffect(() => {
        if (messages.length === 0 && isKeyReady) {
            setMessages([{ 
                role: 'model', 
                text: 'Xin chào! Tôi là Trợ lý BizGuard. Tôi đã đọc xong dữ liệu Dashboard. Bạn cần phân tích gì về tài chính hay hiệu quả kinh doanh hôm nay?'
            }]);
        }
    }, [isKeyReady, messages.length]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen, isKeyReady]);

    // -- Window Drag Logic --
    const handleMouseDown = (e: React.MouseEvent) => {
        if (!chatContainerRef.current) return;
        setIsDragging(true);
        const rect = chatContainerRef.current.getBoundingClientRect();
        setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (isDragging) {
            setPosition({
                x: e.clientX - dragOffset.x,
                y: e.clientY - dragOffset.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isDragging]);

    // -- Resize Logic --
    const [isResizing, setIsResizing] = useState(false);
    const handleResizeMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsResizing(true);
    };
    
    const handleResizeMouseMove = (e: MouseEvent) => {
        if (isResizing) {
             setSize({
                 width: Math.max(300, e.clientX - position.x),
                 height: Math.max(400, e.clientY - position.y)
             });
        }
    };
    
    const handleResizeMouseUp = () => {
        setIsResizing(false);
    }
    
    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', handleResizeMouseMove);
            window.addEventListener('mouseup', handleResizeMouseUp);
        }
         return () => {
            window.removeEventListener('mousemove', handleResizeMouseMove);
            window.removeEventListener('mouseup', handleResizeMouseUp);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isResizing]);


    const processFile = (file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => setSelectedImage(reader.result as string);
        reader.readAsDataURL(file);
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                if (blob) processFile(blob);
            }
        }
    };

    // Serialize Context Data for AI
    const getContextDataString = () => {
        const context = {
            currentTab: activeTab,
            overview: {
                metrics: overviewMetrics,
                monthlyChart: chartData,
                channelCosts: channelCostData
            },
            marketing: {
                campaigns: marketingData
            },
            financial: {
                items: financialItems,
                analysis: financialAnalysis
            }
        };
        return JSON.stringify(context);
    };

    const initChat = () => {
        if (!effectiveKey) {
            return null;
        }

        const ai = new GoogleGenAI({ apiKey: effectiveKey });
        return ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: AI_SYSTEM_INSTRUCTION,
                tools: [{ functionDeclarations: AI_TOOLS }]
            }
        });
    };
    
    // Reset chat session khi Key thay đổi hoặc cửa sổ mở lại
    useEffect(() => {
        if (isOpen && !chatSessionRef.current && isKeyReady) {
            chatSessionRef.current = initChat();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, effectiveKey]);

    const executeFunction = async (name: string, args: any) => {
        console.log("AI Calling Function:", name, args);

        try {
            let result = "Đã cập nhật thành công.";
            
            if (name === 'update_overview_data' || name === 'updateOverview') {
                onUpdateOverview(args.data);
                result = `Đã cập nhật dữ liệu Tổng quan cho ${args.data.length} mục.`;
            } else if (name === 'update_channel_cost_data') {
                if (onUpdateChannelCost) {
                    onUpdateChannelCost(args.data);
                    result = `Đã cập nhật dữ liệu Chi phí Kênh Quảng cáo.`;
                } else {
                    result = `Không tìm thấy hàm cập nhật kênh quảng cáo.`;
                }
            } else if (name === 'update_marketing_data' || name === 'updateMarketing') {
                onUpdateMarketing(args.items);
                result = `Đã cập nhật ${args.items.length} chỉ số Marketing.`;
            } else if (name === 'update_financial_data' || name === 'updateFinancial') {
                onUpdateFinancial(args.items);
                result = `Đã cập nhật ${args.items.length} khoản mục Tài chính.`;
            } else if (name === 'update_financial_analysis' || name === 'updateFinancialAnalysis') {
                onUpdateFinancialAnalysis(args);
                result = `Đã cập nhật phân tích tài chính AI.`;
            } else if (name === 'update_ui_titles' || name === 'updateUITitles') {
                onUpdateUI(args);
                result = `Đã thay đổi tiêu đề trang.`;
            } else {
                 return {result: `Hàm không xác định: ${name}`}; 
            }

            return { result }; 
        } catch (e: any) {
            console.error("Exec Error", e);
            return { error: `Lỗi khi cập nhật dữ liệu trên UI: ${e.message}` };
        }
    };

    const handleSend = async () => {
        if ((!input.trim() && !selectedImage) || isLoading || !isKeyReady) return;

        if (!chatSessionRef.current) {
            chatSessionRef.current = initChat();
            if (!chatSessionRef.current) return;
        }

        const userText = input;
        const userImage = selectedImage;
        setInput('');
        setSelectedImage(null);

        setMessages(prev => [...prev, { role: 'user', text: userText, image: userImage || undefined }]);
        setIsLoading(true);

        try {
            const parts: Part[] = [];
            
            const contextString = getContextDataString();
            const fullPrompt = `[CONTEXT_DATA_START]\n${contextString}\n[CONTEXT_DATA_END]\n\nUser Question: ${userText}`;

            if (userImage) {
                const base64Data = userImage.split(',')[1];
                 parts.push({ inlineData: { mimeType: 'image/png', data: base64Data } });
            }
            parts.push({ text: fullPrompt });

            let response = await chatSessionRef.current!.sendMessage({ message: parts });
            
            // Loop to handle function calls
            while (response.functionCalls && response.functionCalls.length > 0) {
                const toolResponses: Part[] = []; 
                
                for (const call of response.functionCalls) {
                    setMessages(prev => [...prev, { role: 'model', text: `🔄 Đang thực hiện: ${call.name}...`, isProcessing: true }]);
                    
                    const functionResponseData = await executeFunction(call.name, call.args); 
                    
                    toolResponses.push({
                        functionResponse: {
                            name: call.name,
                            id: call.id,
                            response: functionResponseData
                        }
                    }); 
                }

                response = await chatSessionRef.current!.sendMessage({ message: toolResponses });
            }

            const modelText = response.text || "Đã xong!";
            setMessages(prev => prev.filter(m => !m.isProcessing).concat({ role: 'model', text: modelText }));

        } catch (error) {
            console.error("Gemini API Error:", error);
            setMessages(prev => [...prev.filter(m => !m.isProcessing), { 
                role: 'model', 
                text: `Xin lỗi, đã có lỗi kết nối với Gemini (AI Studio). \n\n1. Vui lòng kiểm tra lại API Key.\n2. Nếu bạn dùng Key miễn phí, hãy đảm bảo không bị giới hạn Referrer/Domain trong Google Cloud Console.` 
            }]);
            chatSessionRef.current = null;
        } finally {
            setIsLoading(false);
        }
    };

    const saveUserKey = () => {
        if (tempKeyInput.trim().length > 10) {
            const key = tempKeyInput.trim();
            setUserApiKey(key);
            localStorage.setItem('gemini_api_key', key);
        }
    };

    const clearUserKey = () => {
        setUserApiKey('');
        setTempKeyInput('');
        localStorage.removeItem('gemini_api_key');
        setMessages([]);
        chatSessionRef.current = null;
    };

    return (
        <>
            {!isOpen && (
                <button 
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-full shadow-2xl hover:scale-105 transition-transform z-50 flex items-center gap-2 group"
                >
                    <Sparkles className="w-6 h-6 animate-pulse" />
                    <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap font-semibold">
                        Trợ lý AI
                    </span>
                </button>
            )}

            {isOpen && (
                <div 
                    ref={chatContainerRef}
                    style={{ 
                        left: position.x, 
                        top: position.y, 
                        width: size.width, 
                        height: size.height 
                    }}
                    className="fixed bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-slate-200 overflow-hidden font-sans animate-in zoom-in duration-200"
                >
                    
                    {/* Header - Draggable */}
                    <div 
                        onMouseDown={handleMouseDown}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex justify-between items-center text-white shrink-0 cursor-move"
                    >
                        <div className="flex items-center gap-2">
                            <div className="bg-white/20 p-1.5 rounded-lg">
                                <Bot className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm select-none">BizGuard AI</h3>
                                <p className="text-[10px] text-blue-100 opacity-90 select-none">Realtime Data Context</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button 
                                onClick={clearUserKey}
                                onMouseDown={(e) => e.stopPropagation()}
                                className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-colors"
                                title="Reset API Key"
                            >
                                <Key className="w-4 h-4" />
                            </button>
                            <div className="w-px h-4 bg-white/20 mx-1"></div>
                            <button 
                                onMouseDown={(e) => e.stopPropagation()} 
                                onClick={() => setIsOpen(false)} 
                                className="text-white/80 hover:text-white hover:bg-white/10 p-1 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {!isKeyReady ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50 text-center select-none">
                            <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                                <Key className="w-8 h-8 text-blue-500" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-2">Cần API Key</h3>
                            <div className="text-sm text-slate-500 mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
                                <p className="mb-2">Ứng dụng cần <b>Gemini API Key</b> để hoạt động.</p>
                                <p className="text-xs text-slate-400 mb-3">Key sẽ được lưu trong trình duyệt của bạn (Local Storage).</p>
                                
                                <a 
                                    href="https://aistudio.google.com/app/apikey" 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="flex items-center justify-center gap-1 text-blue-600 font-bold hover:underline mb-2"
                                >
                                    <ExternalLink className="w-3 h-3"/> Lấy Key MIỄN PHÍ tại đây
                                </a>
                            </div>
                            
                            <input 
                                type="password"
                                className="w-full border border-slate-300 rounded-lg p-3 text-sm mb-3 focus:ring-2 focus:ring-blue-200 outline-none"
                                placeholder="Dán API Key vào đây..."
                                value={tempKeyInput}
                                onChange={(e) => setTempKeyInput(e.target.value)}
                            />
                            <button 
                                onClick={saveUserKey}
                                className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                Lưu & Bắt đầu Chat
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 scroll-smooth">
                                {messages.map((msg, idx) => (
                                    <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                        <div 
                                            className={`max-w-[95%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                                msg.role === 'user' 
                                                    ? 'bg-blue-600 text-white rounded-br-none shadow-md' 
                                                    : msg.isProcessing 
                                                        ? 'bg-blue-50 text-blue-700 border border-blue-100 italic'
                                                        : 'bg-white text-slate-700 rounded-bl-none border border-slate-100'
                                            }`}
                                        >
                                            {msg.image && (
                                                <img src={msg.image} alt="uploaded" className="mb-2 rounded-lg max-h-40 w-full object-cover border border-white/20" />
                                            )}
                                            {/* Use Markdown Renderer here for Bot */}
                                            {msg.role === 'model' && !msg.isProcessing ? (
                                                <MarkdownRenderer content={msg.text} />
                                            ) : (
                                                <p>{msg.text}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="flex justify-start">
                                         <div className="bg-white p-3 rounded-2xl rounded-bl-none shadow-sm border border-slate-100 flex items-center gap-2">
                                             <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                                             <span className="text-xs text-slate-500">Đang suy nghĩ...</span>
                                         </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {selectedImage && (
                                <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
                                    <div className="flex items-center gap-2">
                                        <img src={selectedImage} alt="Preview" className="w-10 h-10 rounded object-cover border border-slate-300" />
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-slate-700">Ảnh đã chọn</span>
                                            <span className="text-[10px] text-slate-500">Sẵn sàng gửi</span>
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedImage(null)} className="text-slate-400 hover:text-red-500">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}

                            <div className="p-3 bg-white border-t border-slate-100 shrink-0">
                                <div className="flex items-center gap-2 bg-slate-100 rounded-full px-4 py-2 border border-slate-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        className="hidden" 
                                        ref={fileInputRef} 
                                        onChange={handleImageSelect}
                                    />
                                    <button 
                                        className="text-slate-400 hover:text-blue-600 p-1 transition-colors"
                                        title="Gửi hình ảnh"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <ImageIcon className="w-5 h-5" />
                                    </button>
                                    
                                    <input 
                                        className="bg-transparent flex-1 focus:outline-none text-sm text-slate-700"
                                        placeholder="Nhập yêu cầu..."
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                        onPaste={handlePaste}
                                    />
                                    
                                    <button 
                                        onClick={handleSend}
                                        disabled={isLoading || !input} 
                                        className="text-blue-600 hover:text-blue-700 disabled:opacity-50 p-1 transition-colors"
                                    >
                                        <Send className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Resize Handle */}
                    <div 
                        onMouseDown={handleResizeMouseDown}
                        className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize z-50 flex items-center justify-center opacity-50 hover:opacity-100"
                    >
                        <Scaling className="w-3 h-3 text-slate-400" />
                    </div>
                </div>
            )}
        </>
    );
};

export default AIChatAssistant;