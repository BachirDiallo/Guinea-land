import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { 
  Robot, 
  PaperPlaneTilt, 
  X, 
  Trash,
  ArrowRight,
  MapTrifold,
  House,
  ChartLine,
  Sparkle
} from '@phosphor-icons/react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Generate a unique session ID
const generateSessionId = () => {
  const stored = localStorage.getItem('ai_session_id');
  if (stored) return stored;
  const newId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem('ai_session_id', newId);
  return newId;
};

// Quick action suggestions
const getQuickActions = (t, language) => {
  if (language === 'en') {
    return [
      { text: "Find land in Conakry", icon: MapTrifold },
      { text: "Average prices?", icon: ChartLine },
      { text: "How to sell?", icon: House },
    ];
  }
  return [
    { text: "Chercher terrain à Conakry", icon: MapTrifold },
    { text: "Prix moyens?", icon: ChartLine },
    { text: "Comment vendre?", icon: House },
  ];
};

export const AIAssistant = () => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(generateSessionId);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const currentLanguage = i18n.language || 'fr';
  const quickActions = getQuickActions(t, currentLanguage);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Load chat history on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await fetch(`${API}/ai/history/${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.messages && data.messages.length > 0) {
            setMessages(data.messages.map(m => ({
              role: m.role,
              content: m.content
            })));
          }
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
      }
    };
    loadHistory();
  }, [sessionId]);

  const sendMessage = async (text) => {
    if (!text.trim() || isLoading) return;

    const userMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch(`${API}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          session_id: sessionId,
          language: currentLanguage
        })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      } else {
        throw new Error('Chat request failed');
      }
    } catch (error) {
      console.error('AI Chat error:', error);
      const errorMsg = currentLanguage === 'en' 
        ? "Sorry, I couldn't process your request. Please try again."
        : "Désolé, je n'ai pas pu traiter votre demande. Veuillez réessayer.";
      setMessages(prev => [...prev, { role: 'assistant', content: errorMsg }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const clearChat = async () => {
    try {
      await fetch(`${API}/ai/history/${sessionId}`, { method: 'DELETE' });
      setMessages([]);
    } catch (error) {
      console.error('Failed to clear chat:', error);
    }
  };

  const welcomeMessage = currentLanguage === 'en'
    ? "Hello! I'm your AI Land Assistant. How can I help you find the perfect land in Guinea today?"
    : "Bonjour! Je suis votre Assistant Terrain IA. Comment puis-je vous aider à trouver le terrain idéal en Guinée aujourd'hui?";

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-brutal-md transition-all duration-300 ${
          isOpen 
            ? 'bg-destructive hover:bg-destructive/90' 
            : 'bg-primary hover:bg-primary/90 animate-pulse hover:animate-none'
        }`}
        data-testid="ai-assistant-toggle"
        aria-label={isOpen ? "Close AI Assistant" : "Open AI Assistant"}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" weight="bold" />
        ) : (
          <Robot className="w-7 h-7 text-white" weight="fill" />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div 
          className="fixed bottom-24 left-6 z-50 w-[360px] max-w-[calc(100vw-48px)] bg-card border-2 border-primary shadow-brutal-lg rounded-none animate-in slide-in-from-bottom-4 duration-300"
          data-testid="ai-assistant-panel"
        >
          {/* Header */}
          <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center">
                <Robot className="w-6 h-6 text-white" weight="fill" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Assistant Terrain IA</h3>
                <p className="text-xs text-primary-foreground/70 flex items-center gap-1">
                  <Sparkle className="w-3 h-3" weight="fill" />
                  {currentLanguage === 'en' ? 'Powered by AI' : 'Propulsé par IA'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearChat}
              className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 h-8 w-8 p-0"
              title={currentLanguage === 'en' ? 'Clear chat' : 'Effacer le chat'}
            >
              <Trash className="w-4 h-4" />
            </Button>
          </div>

          {/* Messages Area */}
          <ScrollArea className="h-[320px] p-4">
            {/* Welcome Message */}
            {messages.length === 0 && (
              <div className="space-y-4">
                <div className="bg-muted p-3 rounded-lg text-sm">
                  <p>{welcomeMessage}</p>
                </div>
                
                {/* Quick Actions */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">
                    {currentLanguage === 'en' ? 'Quick questions:' : 'Questions rapides:'}
                  </p>
                  {quickActions.map((action, idx) => (
                    <button
                      key={idx}
                      onClick={() => sendMessage(action.text)}
                      className="w-full flex items-center gap-2 p-2 text-left text-sm bg-secondary/50 hover:bg-secondary rounded transition-colors group"
                    >
                      <action.icon className="w-4 h-4 text-accent" />
                      <span className="flex-1">{action.text}</span>
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Messages */}
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`mb-3 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-lg text-sm ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex justify-start mb-3">
                <div className="bg-muted p-3 rounded-lg">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </ScrollArea>

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="border-t-2 border-border p-3">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={currentLanguage === 'en' ? "Ask about lands..." : "Posez une question..."}
                className="flex-1 text-sm"
                disabled={isLoading}
                data-testid="ai-chat-input"
              />
              <Button
                type="submit"
                size="sm"
                disabled={!input.trim() || isLoading}
                className="bg-accent hover:bg-accent/90 px-3"
                data-testid="ai-chat-send"
              >
                <PaperPlaneTilt className="w-4 h-4" weight="fill" />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 text-center">
              {currentLanguage === 'en' 
                ? 'AI may make mistakes. Verify important info.' 
                : "L'IA peut se tromper. Vérifiez les infos importantes."}
            </p>
          </form>
        </div>
      )}
    </>
  );
};

export default AIAssistant;
