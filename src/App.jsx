import { useState, useEffect, useRef, useMemo } from 'react';
import { GoogleGenAI } from '@google/genai';
import './App.css';
import Answer from './components/Answers';
import logo from './assets/smarttalk-logo.png';
import { Toaster, toast } from 'sonner';
const createId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
const loadSavedChats = () => {
  try {
    const savedData = localStorage.getItem('chats');

    if (!savedData) {
      return { chats: [], activeChatId: null };
    }

    const parsedData = JSON.parse(savedData);
    if (parsedData && !Array.isArray(parsedData) && Array.isArray(parsedData.chats)) {
      return {
        chats: parsedData.chats,
        activeChatId: parsedData.activeChatId || null,
      };
    }
    if (Array.isArray(parsedData) && parsedData.length > 0) {
      const migratedChat = {
        id: createId(),
        title: parsedData[0].question?.slice(0, 35) || 'Old Chat',
        messages: parsedData.map((item) => ({
          id: createId(),
          question: item.question,
          answer: item.answer,
          time: item.time,
        })),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      return {
        chats: [migratedChat],
        activeChatId: migratedChat.id,
      };
    }

    return { chats: [], activeChatId: null };

  } catch (error) {
    console.error('Failed to load chats:', error);
    return { chats: [], activeChatId: null };
  }
};

function App() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  const [chatData, setChatData] = useState(loadSavedChats);

  const { chats, activeChatId } = chatData;

  const chatEndRef = useRef(null);
  const ai = useMemo(() => {
    return new GoogleGenAI({
      apiKey: import.meta.env.VITE_GEMINI_API_KEY,
    });
  }, []);
  const activeChat = chats.find(
    (chat) => chat.id === activeChatId
  );

  const messages = activeChat?.messages || [];
  useEffect(() => {
    localStorage.setItem('chats', JSON.stringify(chatData));
  }, [chatData]);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [messages]);
  const startNewChat = () => {
    if (loading) {
      toast.warning('Please wait for the response to finish');
      return;
    }

    const newChat = {
      id: createId(),
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setChatData((prev) => ({
      chats: [newChat, ...prev.chats],
      activeChatId: newChat.id,
    }));

    setQuestion('');
    setShowSidebar(false);

    toast.success('New chat created!');
  };
  const openChat = (chatId) => {
    setChatData((prev) => ({
      ...prev,
      activeChatId: chatId,
    }));

    setQuestion('');
    setShowSidebar(false);
  };
  const renameChat = (chatId) => {
    const currentChat = chats.find(
      (chat) => chat.id === chatId
    );

    if (!currentChat) return;

    const newTitle = window.prompt(
      'Enter new chat name:',
      currentChat.title
    );

    if (!newTitle || !newTitle.trim()) return;

    setChatData((prev) => ({
      ...prev,
      chats: prev.chats.map((chat) =>
        chat.id === chatId
          ? { ...chat, title: newTitle.trim() }
          : chat
      ),
    }));

    toast.success('Chat renamed successfully!');
  };
  const deleteChat = (chatId) => {
    if (loading) {
      toast.warning('Please wait for the response to finish');
      return;
    }

    const confirmDelete = window.confirm(
      'Are you sure you want to delete this chat?'
    );

    if (!confirmDelete) return;

    setChatData((prev) => {
      const remainingChats = prev.chats.filter(
        (chat) => chat.id !== chatId
      );

      return {
        chats: remainingChats,
        activeChatId:
          prev.activeChatId === chatId
            ? remainingChats[0]?.id || null
            : prev.activeChatId,
      };
    });

    toast.success('Chat deleted!');
  };
  const clearChats = () => {
    if (loading) {
      toast.warning('Please wait for the response to finish');
      return;
    }

    if (chats.length === 0) {
      toast.info('No chats to clear');
      return;
    }

    const confirmClear = window.confirm(
      'Are you sure you want to delete all chats?'
    );

    if (!confirmClear) return;

    setChatData({
      chats: [],
      activeChatId: null,
    });

    setQuestion('');

    toast.success('All chats cleared!');
  };
  const askQuestion = async () => {
    if (!question.trim()) {
      toast.warning('Please enter a message');
      return;
    }

    if (loading) return;

    const currentQuestion = question.trim();
    const currentChatId = activeChatId || createId();

    const userMessageId = createId();
    const aiMessageId = createId();

    const newMessage = {
      id: userMessageId,
      question: currentQuestion,
      answer: '',
      time: new Date().toLocaleTimeString(),
    };
    setChatData((prev) => {
      let updatedChats = [...prev.chats];

      let existingChat = updatedChats.find(
        (chat) => chat.id === currentChatId
      );

      if (!existingChat) {
        existingChat = {
          id: currentChatId,
          title: currentQuestion.slice(0, 35),
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        updatedChats.unshift(existingChat);
      }

      updatedChats = updatedChats.map((chat) =>
        chat.id === currentChatId
          ? {
              ...chat,
              title:
                chat.messages.length === 0 && chat.title === 'New Chat'
                  ? currentQuestion.slice(0, 35)
                  : chat.title,
              messages: [
                ...chat.messages,
                newMessage,
                {
                  id: aiMessageId,
                  question: '',
                  answer: 'Thinking...',
                  time: new Date().toLocaleTimeString(),
                },
              ],
              updatedAt: Date.now(),
            }
          : chat
      );

      return {
        chats: updatedChats,
        activeChatId: currentChatId,
      };
    });

    setQuestion('');
    setLoading(true);

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: currentQuestion,
      });

      const fullAnswer =
        response.text || 'No response received from AI.';
      let currentText = '';

      for (let i = 0; i < fullAnswer.length; i++) {
        currentText += fullAnswer[i];

        setChatData((prev) => ({
          ...prev,
          chats: prev.chats.map((chat) =>
            chat.id === currentChatId
              ? {
                  ...chat,
                  messages: chat.messages.map((message) =>
                    message.id === aiMessageId
                      ? { ...message, answer: currentText }
                      : message
                  ),
                }
              : chat
          ),
        }));

        await new Promise((resolve) => setTimeout(resolve, 5));
      }

      toast.success('Response generated successfully!');

    } catch (error) {
      console.error('Gemini API Error:', error);

      setChatData((prev) => ({
        ...prev,
        chats: prev.chats.map((chat) =>
          chat.id === currentChatId
            ? {
                ...chat,
                messages: chat.messages.map((message) =>
                  message.id === aiMessageId
                    ? {
                        ...message,
                        answer: 'Something went wrong. Please try again later.',
                      }
                    : message
                ),
              }
            : chat
        ),
      }));

      toast.error('Failed to generate response');

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-900">

      <Toaster
        position="top-right"
        richColors
        closeButton
        duration={3000}
        theme="dark"
      />
{showSidebar && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}
<aside
        className={`
          fixed md:relative
          top-0 left-0 z-50
          w-72 shrink-0
          bg-zinc-800 text-white
          p-4 h-full
          overflow-y-auto
          transition-transform duration-300
          ${showSidebar
            ? 'translate-x-0'
            : '-translate-x-full md:hidden'
          }
        `}
      >
<div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold">
            SmartTalk Chats
          </h2>

          <button
            onClick={() => setShowSidebar(false)}
            className="text-2xl hover:text-gray-400"
          >
            ✕
          </button>
        </div>
<button
          onClick={startNewChat}
          className="w-full bg-zinc-700 p-3 rounded-lg mb-3 hover:bg-zinc-600 transition"
        >
          + New Chat
        </button>
<button
          onClick={clearChats}
          className="w-full bg-red-500 p-2 rounded-lg hover:bg-red-600 transition"
        >
          Clear All Chats
        </button>
<h3 className="text-lg font-bold mt-6 mb-3 text-zinc-300">
          Recent Chats
        </h3>

        <div className="space-y-2">

          {chats.length === 0 ? (
            <p className="text-sm text-zinc-400">
              No chat history yet.
            </p>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.id}
                className={`
                  p-3 rounded-lg transition
                  ${activeChatId === chat.id
                    ? 'bg-blue-600'
                    : 'bg-zinc-700 hover:bg-zinc-600'
                  }
                `}
              >
                <div className="flex items-center justify-between gap-2">

                  <button
                    onClick={() => openChat(chat.id)}
                    className="flex-1 text-left text-sm truncate"
                    title={chat.title}
                  >
                    💬 {chat.title}
                  </button>

                  <div className="flex gap-2">

                    <button
                      onClick={() => renameChat(chat.id)}
                      className="text-xs hover:text-yellow-300"
                      title="Rename chat"
                    >
                      ✏️
                    </button>

                    <button
                      onClick={() => deleteChat(chat.id)}
                      className="text-xs hover:text-red-300"
                      title="Delete chat"
                    >
                      🗑️
                    </button>

                  </div>
                </div>
              </div>
            ))
          )}

        </div>
      </aside>
<main className="flex-1 min-w-0 overflow-hidden flex flex-col">
<header className="flex items-center gap-3 p-4 text-white bg-zinc-900 shrink-0">

          <button
            className="bg-zinc-800 p-2 rounded-lg hover:bg-zinc-700"
            onClick={() => setShowSidebar(!showSidebar)}
          >
            ☰
          </button>

          <img
            src={logo}
            alt="SmartTalk Logo"
            className="w-10 h-10"
          />

          <h1 className="text-2xl md:text-3xl font-bold">
            SmartTalk
          </h1>

        </header>
<section className="flex-1 overflow-y-auto text-white p-4 pb-28">

          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">

              <img
                src={logo}
                alt="SmartTalk"
                className="w-20 h-20 mb-4"
              />

              <h2 className="text-3xl font-bold mb-2">
                Welcome to SmartTalk!
              </h2>

              <p className="text-zinc-400">
                Your AI assistant is ready. Ask me anything!
              </p>

              <div className="flex flex-wrap justify-center gap-2 mt-6">

                {[
                  'Explain React.js',
                  'Write a JavaScript program',
                  'Give me project ideas',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setQuestion(suggestion)}
                    className="bg-zinc-800 border border-zinc-700 px-4 py-2 rounded-full text-sm hover:bg-zinc-700 transition"
                  >
                    {suggestion}
                  </button>
                ))}

              </div>

            </div>
          ) : (
            messages.map((item) => (
              <Answer
                key={item.id}
                question={item.question}
                answer={item.answer}
                time={item.time}
              />
            ))
          )}

          <div ref={chatEndRef} />

        </section>
<div
          className="
            bg-zinc-800
            w-[90%]
            max-w-3xl
            p-1
            text-white
            rounded-3xl
            border border-zinc-700
            flex h-16
            fixed
            bottom-4 left-1/2
            -translate-x-1/2
            z-30
          "
        >

          <input
            type="text"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                askQuestion();
              }
            }}
            className="w-full h-full p-3 outline-none bg-transparent"
            placeholder="Ask SmartTalk..."
            disabled={loading}
          />

          <button
            onClick={askQuestion}
            disabled={loading || !question.trim()}
            className="px-4 w-24 disabled:opacity-50 hover:text-blue-400 transition"
          >
            {loading ? 'Thinking...' : 'Ask'}
          </button>

        </div>

      </main>
    </div>
  );
}

export default App;
