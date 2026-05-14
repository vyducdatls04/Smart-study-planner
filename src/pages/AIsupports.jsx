import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  Check,
  ChevronDown,
  Copy,
  Loader2,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  User,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import Swal from "sweetalert2";
import api from "../api/axios";

const SUGGESTIONS = [
  "Giải thích khái niệm đệ quy trong lập trình",
  "Cách học tiếng Anh hiệu quả mỗi ngày",
  "Phân biệt TCP và UDP",
  "Phương pháp Pomodoro là gì?",
];

const MessageContent = memo(function MessageContent({ role, content, isDone, markdownComponents }) {
  if (role === "user") {
    return <p className="whitespace-pre-wrap text-[14px] leading-relaxed">{content}</p>;
  }

  return (
    <div className="prose prose-sm max-w-none prose-pre:p-0">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {isDone ? content : `${content} ▍`}
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
    <button
      type="button"
      onClick={handleCopy}
      className="mt-1 flex items-center gap-1 text-[11px] text-gray-400 transition-colors hover:text-indigo-500"
    >
      {copied ? (
        <>
          <Check size={12} className="text-emerald-500" />
          <span className="text-emerald-500">Đã chép</span>
        </>
      ) : (
        <>
          <Copy size={12} />
          <span>Sao chép</span>
        </>
      )}
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
    if (!el) return undefined;

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
        setChat(
          (res.data || []).map((message) => ({
            role: message.role === "assistant" ? "ai" : "user",
            content: message.content,
            isDone: true,
            time: message.created_at,
          }))
        );
      } catch (err) {
        console.error("Lỗi tải lịch sử AI:", err);
      }
    };

    loadHistory();
  }, []);

  const updateLastAIMessage = (content, isDone = false) => {
    setChat((prev) => {
      const updated = [...prev];
      updated[updated.length - 1] = {
        ...updated[updated.length - 1],
        content,
        isDone,
      };
      return updated;
    });
  };

  const executeStream = async (msg) => {
    setIsTyping(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${api.defaults.baseURL}/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: msg }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "AI request failed");
      }

      const contentType = response.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        const data = await response.json();
        updateLastAIMessage(data.reply || data.message || "AI không phản hồi.", true);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Trình duyệt không hỗ trợ stream response");

      const decoder = new TextDecoder();
      let accumulatedText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((line) => line.startsWith("data: "));

        for (const line of lines) {
          const dataStr = line.replace("data: ", "").trim();
          if (!dataStr || dataStr === "[DONE]") continue;

          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.text) {
              accumulatedText += parsed.text;
              updateLastAIMessage(accumulatedText, false);
            }
          } catch (err) {
            console.error("Lỗi đọc AI stream:", err);
          }
        }
      }

      updateLastAIMessage(accumulatedText || "AI không phản hồi.", true);
    } catch (err) {
      console.error("AI request error:", err);
      updateLastAIMessage("Không thể kết nối với AI. Vui lòng kiểm tra server hoặc API key.", true);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = (text) => {
    const msg = (text || input).trim();
    if (!msg || isTyping) return;

    setInput("");
    setLastUserMsg(msg);
    setChat((prev) => [
      ...prev,
      { role: "user", content: msg, isDone: true, time: new Date().toISOString() },
      { role: "ai", content: "", isDone: false, time: new Date().toISOString() },
    ]);
    executeStream(msg);
  };

  const handleRegenerate = () => {
    if (!lastUserMsg || isTyping) return;

    setChat((prev) => [
      ...prev.slice(0, -1),
      { role: "ai", content: "", isDone: false, time: new Date().toISOString() },
    ]);
    executeStream(lastUserMsg);
  };

  const handleClearHistory = async () => {
    const result = await Swal.fire({
      title: "Xóa lịch sử?",
      text: "Hành động này không thể hoàn tác.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#ef4444",
    });

    if (!result.isConfirmed) return;

    await api.delete("/ai/history");
    setChat([]);
  };

  const markdownComponents = useMemo(
    () => ({
      code({ inline, className, children, ...props }) {
        const match = /language-(\w+)/.exec(className || "");
        const codeVal = String(children).replace(/\n$/, "");

        if (!inline && match) {
          return (
            <div className="my-4 overflow-hidden rounded-xl border border-gray-700 shadow-lg">
              <div className="flex items-center justify-between border-b border-gray-700 bg-[#1e1e1e] px-4 py-1.5">
                <span className="font-mono text-[10px] uppercase text-gray-400">{match[1]}</span>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(codeVal)}
                  className="flex items-center gap-1 text-[11px] text-gray-400 transition-colors hover:text-white"
                >
                  <Copy size={12} />
                  <span>Copy</span>
                </button>
              </div>
              <SyntaxHighlighter
                style={vscDarkPlus}
                language={match[1]}
                PreTag="div"
                customStyle={{ margin: 0, padding: "16px", fontSize: "13px" }}
                {...props}
              >
                {codeVal}
              </SyntaxHighlighter>
            </div>
          );
        }

        return (
          <code className="rounded bg-red-50 px-1.5 py-0.5 font-mono text-[13px] text-red-500" {...props}>
            {children}
          </code>
        );
      },
      p: ({ children }) => <p className="mb-2 text-[14px] leading-relaxed last:mb-0">{children}</p>,
      ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5">{children}</ul>,
      ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5">{children}</ol>,
    }),
    []
  );

  return (
    <div className="relative flex h-[calc(100vh-80px)] flex-col overflow-hidden bg-[#F8FAFC]">
      <div className="z-10 flex items-center justify-between border-b bg-white px-5 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-indigo-600 p-2 text-white">
            <Bot size={20} />
          </div>
          <div>
            <h1 className="text-[14px] font-bold text-gray-800">Trợ lý học tập AI</h1>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              <span className="text-[10px] font-semibold uppercase text-gray-400">Trực tuyến</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleClearHistory}
          className="rounded-lg p-2 text-gray-400 transition-colors hover:text-red-500"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div ref={containerRef} className="flex-1 space-y-6 overflow-y-auto px-4 py-6 scroll-smooth lg:px-24">
        {chat.length === 0 && !isTyping && (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <div className="rounded-3xl bg-indigo-50 p-4 text-indigo-500">
              <Sparkles size={32} />
            </div>
            <p className="font-medium text-gray-600">Chào bạn, tôi có thể giúp gì cho việc học hôm nay?</p>
            <div className="grid w-full max-w-md grid-cols-1 gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => handleSend(question)}
                  className="rounded-xl border bg-white p-3 text-left text-[12px] text-gray-600 shadow-sm transition-all hover:border-indigo-400 hover:bg-indigo-50"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {chat.map((message, index) => (
          <div key={`${message.time}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`flex max-w-[85%] gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full shadow-sm ${message.role === "user" ? "bg-indigo-600 text-white" : "border bg-white text-indigo-600"}`}>
                {message.role === "user" ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className="flex flex-col gap-1">
                <div className={`rounded-2xl px-4 py-3 shadow-sm ${message.role === "user" ? "rounded-tr-none bg-indigo-600 text-white" : "rounded-tl-none border bg-white text-gray-800"}`}>
                  <MessageContent
                    role={message.role}
                    content={message.content}
                    isDone={message.isDone}
                    markdownComponents={markdownComponents}
                  />
                </div>
                <div className={`flex items-center gap-3 px-1 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <span className="text-[10px] text-gray-400">
                    {message.time && new Date(message.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  {message.role === "ai" && message.isDone && <CopyButton text={message.content} />}
                  {message.role === "ai" && message.isDone && index === chat.length - 1 && (
                    <button
                      type="button"
                      onClick={handleRegenerate}
                      disabled={isTyping}
                      className="flex items-center gap-1 text-[11px] text-gray-400 transition-colors hover:text-indigo-500"
                    >
                      <RefreshCw size={12} />
                      Tạo lại
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      <div className="z-10 border-t bg-white p-4">
        {showScrollBtn && (
          <button
            type="button"
            onClick={() => scrollToBottom()}
            className="absolute bottom-24 right-8 rounded-full bg-indigo-600 p-2.5 text-white shadow-lg transition-colors hover:bg-indigo-700"
          >
            <ChevronDown size={20} />
          </button>
        )}
        <div className="relative mx-auto flex max-w-4xl gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Nhập câu hỏi tại đây..."
            className="flex-1 rounded-2xl border bg-gray-50 px-5 py-3.5 text-[14px] outline-none transition-all focus:border-indigo-400 focus:bg-white"
          />
          <button
            type="button"
            onClick={() => handleSend()}
            disabled={isTyping || !input.trim()}
            className="flex min-w-[60px] items-center justify-center rounded-2xl bg-indigo-600 px-5 py-3 text-white transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-200"
          >
            {isTyping ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}
