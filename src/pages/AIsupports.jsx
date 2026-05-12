import { useState, useRef, useEffect, useCallback, memo } from "react";
import {
  Bot, User, Send, Trash2, Copy, Loader2,
  Sparkles, RefreshCw, ChevronDown, Check,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import Swal from "sweetalert2";
import api from "../api/axios";

const GOI_Y = [
  "Giải thích khái niệm đệ quy trong lập trình?",
  "Cách học tiếng Anh hiệu quả mỗi ngày?",
  "Phân biệt TCP và UDP?",
  "Phương pháp Pomodoro là gì?",
];

// --- Memoized Component để tránh re-render toàn bộ hội thoại ---
const MessageContent = memo(({ role, content, isDone, markdownComponents }) => {
  if (role === "user") {
    return <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{content}</p>;
  }

  return (
    <div className="prose prose-sm max-w-none prose-pre:p-0">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {isDone ? content : content + " ▍"}
      </ReactMarkdown>
    </div>
  );
});

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-indigo-500 transition-colors mt-1">
      {copied ? <><Check size={12} className="text-emerald-500" /> <span className="text-emerald-500">Đã chép</span></> : <><Copy size={12} /> <span>Sao chép</span></>}
    </button>
  );
}

export default function AIsupports() {
  const [input, setInput] = useState("");
  const [chat, setChat] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [lastUserMsg, setLastUserMsg] = useState("");

  const scrollRef = useRef(null);
  const containerRef = useRef(null);

  const scrollToBottom = useCallback((behavior = "smooth") => {
    scrollRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    if (!showScrollBtn && isTyping) scrollToBottom("auto");
  }, [chat, isTyping, showScrollBtn, scrollToBottom]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 150;
      setShowScrollBtn(!isNearBottom);
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await api.get("/ai/history");
        if (res.data) {
          setChat(res.data.map(m => ({
            role: m.role === "assistant" ? "ai" : "user",
            content: m.content,
            isDone: true,
            time: m.created_at
          })));
        }
      } catch (err) { console.error("Lỗi tải lịch sử:", err); }
    };
    loadHistory();
  }, []);

  const executeStream = async (msg) => {
    setIsTyping(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${import.meta.env.VITE_API_URL}/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ message: msg }),
      });

      if (!response.ok) throw new Error();

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter(l => l.startsWith("data: "));

        for (const line of lines) {
          const dataStr = line.replace("data: ", "").trim();
          if (dataStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.text) {
              accumulatedText += parsed.text;
              setChat(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { ...updated[updated.length - 1], content: accumulatedText };
                return updated;
              });
            }
          } catch { 
            // FIXED: Bỏ biến 'e' không dùng để hết lỗi ESLint no-unused-vars
          }
        }
      }
      setChat(prev => {
        const updated = [...prev];
        updated[updated.length - 1].isDone = true;
        return updated;
      });
    } catch {
      setChat(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { 
          role: "ai", 
          content: "❌ Không thể kết nối với AI. Vui lòng kiểm tra server!", 
          isDone: true, 
          time: new Date().toISOString() 
        };
        return updated;
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = (text) => {
    const msg = (text || input).trim();
    if (!msg || isTyping) return;
    setInput("");
    setLastUserMsg(msg);
    setChat(prev => [
      ...prev,
      { role: "user", content: msg, isDone: true, time: new Date().toISOString() },
      { role: "ai", content: "", isDone: false, time: new Date().toISOString() }
    ]);
    executeStream(msg);
  };

  const handleRegenerate = () => {
    if (!lastUserMsg || isTyping) return;
    setChat(prev => {
      const filtered = prev.slice(0, -1);
      return [...filtered, { role: "ai", content: "", isDone: false, time: new Date().toISOString() }];
    });
    executeStream(lastUserMsg);
  };

  const markdownComponents = {
    code({ inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || "");
      const codeVal = String(children).replace(/\n$/, "");
      if (!inline && match) {
        return (
          <div className="my-4 rounded-xl overflow-hidden border border-gray-700 shadow-lg">
            <div className="px-4 py-1.5 flex justify-between items-center bg-[#1e1e1e] border-b border-gray-700">
              <span className="text-[10px] text-gray-400 font-mono uppercase">{match[1]}</span>
              <button onClick={() => navigator.clipboard.writeText(codeVal)} className="text-gray-400 hover:text-white transition-colors text-[11px] flex items-center gap-1">
                <Copy size={12} /> <span>Copy</span>
              </button>
            </div>
            <SyntaxHighlighter style={vscDarkPlus} language={match[1]} PreTag="div" customStyle={{ margin: 0, padding: "16px", fontSize: "13px" }} {...props}>
              {codeVal}
            </SyntaxHighlighter>
          </div>
        );
      }
      return <code className="bg-red-50 text-red-500 px-1.5 py-0.5 rounded font-mono text-[13px]" {...props}>{children}</code>;
    },
    p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed text-[14px]">{children}</p>,
    ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>,
  };

  return (
    <div className="flex flex-col bg-[#F8FAFC] h-[calc(100vh-80px)] overflow-hidden relative">
      {/* Header */}
      <div className="bg-white px-5 py-3 border-b flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-xl text-white"><Bot size={20} /></div>
          <div>
            <h1 className="font-bold text-gray-800 text-[14px]">Trợ lý học tập AI</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] text-gray-400 font-semibold uppercase">Trực tuyến</span>
            </div>
          </div>
        </div>
        <button onClick={() => {
            Swal.fire({ title: 'Xóa lịch sử?', text: 'Hành động này không thể hoàn tác.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Xóa sạch', confirmButtonColor: '#ef4444' })
            .then(res => res.isConfirmed && api.delete("/ai/history").then(() => setChat([])))
        }} className="p-2 text-gray-400 hover:text-red-500 rounded-lg transition-colors"><Trash2 size={18} /></button>
      </div>

      {/* Chat Box */}
      <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-6 lg:px-24 space-y-6 scroll-smooth">
        {chat.length === 0 && !isTyping && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4">
            <div className="bg-indigo-50 p-4 rounded-3xl text-indigo-500"><Sparkles size={32} /></div>
            <p className="text-gray-600 font-medium">Chào bạn! Tôi có thể giúp gì cho học tập hôm nay?</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
              {GOI_Y.map((q, i) => (
                <button key={i} onClick={() => handleSend(q)} className="text-left text-[12px] bg-white border p-3 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition-all text-gray-600 shadow-sm">{q}</button>
              ))}
            </div>
          </div>
        )}

        {chat.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm flex-shrink-0 ${m.role === "user" ? "bg-indigo-600 text-white" : "bg-white border text-indigo-600"}`}>
                {m.role === "user" ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className="flex flex-col gap-1">
                <div className={`px-4 py-3 rounded-2xl shadow-sm ${m.role === "user" ? "bg-indigo-600 text-white rounded-tr-none" : "bg-white border text-gray-800 rounded-tl-none"}`}>
                  <MessageContent 
                    role={m.role} 
                    content={m.content} 
                    isDone={m.isDone} 
                    markdownComponents={markdownComponents} 
                  />
                </div>
                <div className={`flex items-center gap-3 px-1 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <span className="text-[10px] text-gray-400">
                    {m.time && new Date(m.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                  {m.role === "ai" && m.isDone && <CopyButton text={m.content} />}
                  {m.role === "ai" && m.isDone && i === chat.length - 1 && (
                    <button onClick={handleRegenerate} disabled={isTyping} className="text-[11px] text-gray-400 hover:text-indigo-500 flex items-center gap-1 transition-colors"><RefreshCw size={12} /> Tạo lại</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t z-10">
        {showScrollBtn && (
          <button onClick={() => scrollToBottom()} className="absolute bottom-24 right-8 bg-indigo-600 text-white p-2.5 rounded-full shadow-lg animate-bounce hover:bg-indigo-700 transition-colors">
            <ChevronDown size={20} />
          </button>
        )}
        <div className="flex gap-2 max-w-4xl mx-auto relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Nhập câu hỏi tại đây..."
            className="flex-1 bg-gray-50 border rounded-2xl px-5 py-3.5 outline-none focus:border-indigo-400 focus:bg-white transition-all text-[14px]"
          />
          <button onClick={() => handleSend()} disabled={isTyping || !input.trim()} className="bg-indigo-600 text-white px-5 py-3 rounded-2xl hover:bg-indigo-700 disabled:bg-gray-200 disabled:cursor-not-allowed transition-all flex items-center justify-center min-w-[60px]">
            {isTyping ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}