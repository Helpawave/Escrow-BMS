import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCheck } from "lucide-react";

const WHATSAPP_NUMBER = "919328028207";

const QUICK_REPLIES = [
  { id: "billing",   emoji: "💳", label: "Billing & Subscription" },
  { id: "invoice",   emoji: "🧾", label: "Invoice Issues" },
  { id: "login",     emoji: "🔐", label: "Login / Account Access" },
  { id: "staff",     emoji: "👥", label: "Staff & Permissions" },
  { id: "technical", emoji: "🔧", label: "Technical Problem" },
  { id: "other",     emoji: "💬", label: "Other / General Query" },
];

type Message = {
  id: number;
  from: "bot" | "user";
  text: string;
  time: string;
};

function nowTime() {
  return new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export function WhatsAppChatWidget() {
  const [isOpen, setIsOpen]         = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [messages, setMessages]     = useState<Message[]>([]);
  const [step, setStep]             = useState<"greeting" | "topic" | "done">("greeting");
  const [typing, setTyping]         = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  /* Show bubble after 4 s */
  useEffect(() => {
    const t = setTimeout(() => setShowBubble(true), 4000);
    return () => clearTimeout(t);
  }, []);

  /* Scroll on new message */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  /* Initial greeting when opened */
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        setMessages([{
          id: 1,
          from: "bot",
          text: "Hello! 👋 Welcome to *EscrowBill* support.\n\nSelect your topic below and we'll connect you instantly on WhatsApp!",
          time: nowTime(),
        }]);
        setStep("topic");
      }, 1000);
    }
  }, [isOpen]);

  const handleTopicSelect = (topic: typeof QUICK_REPLIES[0]) => {
    /* Show user bubble */
    const userMsg: Message = {
      id: Date.now(),
      from: "user",
      text: `${topic.emoji} ${topic.label}`,
      time: nowTime(),
    };
    setMessages(prev => [...prev, userMsg]);
    setStep("done");

    /* Bot confirms */
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        from: "bot",
        text: "Got it! ✅ Opening WhatsApp now...",
        time: nowTime(),
      }]);

      /* Open WhatsApp after 800 ms */
      setTimeout(() => {
        const waText = encodeURIComponent(
          `Hello EscrowBill Support! 👋\n\n*Topic:* ${topic.emoji} ${topic.label}\n\nPlease assist me.`
        );
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${waText}`, "_blank");
      }, 800);
    }, 900);
  };

  const renderText = (text: string) =>
    text.split(/(\*.*?\*|\n)/g).map((part, i) => {
      if (part.startsWith("*") && part.endsWith("*") && part.length > 2)
        return <strong key={i}>{part.slice(1, -1)}</strong>;
      if (part === "\n") return <br key={i} />;
      return <span key={i}>{part}</span>;
    });

  return (
    <>
      {/* ── Floating Button ── */}
      <div className="fixed bottom-5 sm:bottom-6 right-4 sm:right-6 z-[60] flex flex-col items-end gap-3 pointer-events-auto">

        {/* Hint bubble */}
        <AnimatePresence>
          {showBubble && !isOpen && (
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              onClick={() => { setIsOpen(true); setShowBubble(false); }}
              className="bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 rounded-2xl rounded-br-sm shadow-xl px-4 py-3 max-w-[200px] text-sm font-medium cursor-pointer border border-zinc-100 dark:border-zinc-700 relative"
            >
              <p className="text-xs text-zinc-400 mb-0.5">EscrowBill Support</p>
              Hi there! 👋 Need help?
              <div className="absolute bottom-[-6px] right-4 w-3 h-3 bg-white dark:bg-zinc-800 border-r border-b border-zinc-100 dark:border-zinc-700 rotate-45" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main FAB */}
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { setIsOpen(o => !o); setShowBubble(false); }}
          className="relative w-13 h-13 sm:w-14 sm:h-14 rounded-full shadow-2xl flex items-center justify-center focus:outline-none cursor-pointer"
          style={{ background: "linear-gradient(135deg, #25d366 0%, #128c7e 100%)" }}
          aria-label="WhatsApp Support"
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.18 }}>
                <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </motion.div>
            ) : (
              <motion.div key="wa" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.18 }}>
                <WaIcon />
              </motion.div>
            )}
          </AnimatePresence>
          {!isOpen && (
            <span className="absolute inset-0 rounded-full animate-ping opacity-25" style={{ background: "#25d366" }} />
          )}
        </motion.button>
      </div>

      {/* ── Chat Window ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed bottom-20 sm:bottom-24 right-3 sm:right-6 z-[70] w-[340px] max-w-[calc(100vw-1.5rem)] max-h-[calc(100vh-100px)] rounded-2xl overflow-hidden shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3" style={{ background: "linear-gradient(135deg, #128c7e 0%, #075e54 100%)" }}>
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">EB</div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white" />
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold text-sm leading-none">EscrowBill Support</p>
                <p className="text-green-200 text-xs mt-0.5">Typically replies instantly · WhatsApp</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div
              className="overflow-y-auto px-3 py-3 space-y-2 scrollbar-none"
              style={{ background: "#e5ddd5", minHeight: "260px", maxHeight: "360px" }}
            >
              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-2xl shadow-sm text-sm leading-relaxed ${
                      msg.from === "bot" ? "bg-white text-zinc-800 rounded-tl-sm" : "rounded-tr-sm"
                    }`}
                    style={msg.from === "user" ? { background: "#dcf8c6", color: "#1a1a1a" } : {}}
                  >
                    {renderText(msg.text)}
                    <div className={`flex items-center gap-1 mt-1 ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                      <span className="text-[10px] text-zinc-400">{msg.time}</span>
                      {msg.from === "user" && <CheckCheck className="w-3 h-3 text-blue-500" />}
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Typing */}
              {typing && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex gap-1 items-center">
                    {[0, 1, 2].map(i => (
                      <motion.span key={i} className="w-2 h-2 rounded-full bg-zinc-400"
                        animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }} />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Topic quick-replies */}
              {step === "topic" && !typing && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-1.5 mt-1">
                  {QUICK_REPLIES.map(r => (
                    <button
                      key={r.id}
                      onClick={() => handleTopicSelect(r)}
                      className="flex items-center gap-2 w-full bg-white hover:bg-emerald-50 text-zinc-800 text-sm px-3 py-2.5 rounded-xl shadow-sm border border-zinc-100 hover:border-emerald-300 transition-all font-medium text-left"
                    >
                      <span className="text-base">{r.emoji}</span>
                      <span className="flex-1">{r.label}</span>
                      <span className="text-zinc-300 text-xs">→</span>
                    </button>
                  ))}
                </motion.div>
              )}

              {/* After selection – direct WA button */}
              {step === "done" && !typing && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-3 py-2">
                  <a
                    href={`https://wa.me/${WHATSAPP_NUMBER}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold shadow-lg hover:scale-105 transition-transform"
                    style={{ background: "linear-gradient(135deg, #25d366 0%, #128c7e 100%)" }}
                  >
                    <WaIcon small />
                    Open WhatsApp
                  </a>
                  <button
                    onClick={() => { setMessages([]); setStep("greeting"); }}
                    className="text-xs text-zinc-400 hover:text-zinc-600 underline"
                  >
                    Ask another question
                  </button>
                </motion.div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Footer */}
            <div className="bg-zinc-50 dark:bg-zinc-900 text-center py-1.5 border-t border-zinc-200 dark:border-zinc-700">
              <p className="text-[10px] text-zinc-400">
                Powered by <strong>EscrowBill</strong> · WhatsApp +91 93280 28207
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ── Reusable WhatsApp SVG Icon ── */
function WaIcon({ small = false }: { small?: boolean }) {
  const size = small ? "w-4 h-4" : "w-7 h-7";
  return (
    <svg viewBox="0 0 24 24" fill="white" className={size}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
