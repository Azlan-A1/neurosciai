"use client";

import { useState, useEffect, useRef, FormEvent } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Chat, ChatMessage } from '@/types/chat';
import { storage } from '@/lib/storage';
import Sidebar from '@/components/Sidebar';
import ReactMarkdown from 'react-markdown';
import Image from 'next/image';

const analysisCategories = [
  {
    title: "Analyze movement patterns",
    description: "Track position, velocity, and spatial preferences",
    icon: "📊"
  },
  {
    title: "Social interactions",
    description: "Quantify approach, contact, and social dynamics",
    icon: "🤝"
  },
  {
    title: "Posture classification",
    description: "Identify behaviors from skeletal positions",
    icon: "🦴"
  },
  {
    title: "Task performance",
    description: "Measure success rates and learning curves",
    icon: "📈"
  }
];

export default function Home() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [fileUploadOpen, setFileUploadOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Add refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load chats from storage on mount
  useEffect(() => {
    const savedChats = storage.loadChats();
    setChats(savedChats);
    if (savedChats.length > 0) {
      setCurrentChatId(savedChats[0].id);
    } else {
      createNewChat(); // Create initial chat if none exists
    }
  }, []);

  // Save chats to storage whenever they change
  useEffect(() => {
    storage.saveChats(chats);
  }, [chats]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats]);

  const getCurrentChat = () => {
    return chats.find(chat => chat.id === currentChatId);
  };

  const createNewChat = () => {
    const newChat: Chat = {
      id: uuidv4(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setChats(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
    setInput('');
    setFiles([]);
    setFileUploadOpen(false);
  };

  const updateChatTitle = (chatId: string, firstMessage: string) => {
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        return {
          ...chat,
          title: firstMessage.slice(0, 40) + (firstMessage.length > 40 ? '...' : ''),
          updatedAt: new Date()
        };
      }
      return chat;
    }));
  };

  const deleteChat = (chatId: string) => {
    setChats(prev => prev.filter(chat => chat.id !== chatId));
    if (currentChatId === chatId) {
      const remainingChats = chats.filter(chat => chat.id !== chatId);
      setCurrentChatId(remainingChats.length > 0 ? remainingChats[0].id : null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleFileUploadClick = () => {
    setFileUploadOpen(!fileUploadOpen);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('video/')) return '🎬';
    if (type.startsWith('audio/')) return '🔊';
    if (type.includes('pdf')) return '📄';
    if (type.includes('spreadsheet') || type.includes('excel')) return '📊';
    if (type.includes('document') || type.includes('word')) return '📝';
    return '📁';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if ((!input.trim() && files.length === 0) || isLoading) return;
    
    // Create new chat if none exists
    if (!currentChatId) {
      createNewChat();
    }
    
    // Prepare message
    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim() || 'Sent attachments',
      timestamp: new Date(),
      attachments: files.length > 0 ? files.map(file => ({
        name: file.name,
        type: file.type,
        size: file.size,
        url: URL.createObjectURL(file)
      })) : undefined
    };
    
    // Update chat with user message
    setChats(prev => prev.map(chat => {
      if (chat.id === currentChatId) {
        const updatedMessages = [...chat.messages, userMessage];
        // Update title if this is the first message
        if (chat.messages.length === 0) {
          updateChatTitle(chat.id, input.trim() || 'Attachments');
        }
        return {
          ...chat,
          messages: updatedMessages,
          updatedAt: new Date()
        };
      }
      return chat;
    }));
    
    setInput('');
    setIsLoading(true);
    
    try {
      let response;
      
      if (files.length > 0) {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('message', userMessage.content);
        files.forEach(file => {
          formData.append('files', file);
        });

        // Send files and message
        response = await fetch('/api/chat', {
          method: 'POST',
          body: formData,
        });
      } else {
        // Send just the message
        response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: userMessage.content }),
        });
      }
      
      if (!response.ok) {
        throw new Error('Failed to get response');
      }
      
      const data = await response.json();
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.response || data.message || 'No response from the model',
        timestamp: new Date()
      };
      
      // Update chat with assistant message
      setChats(prev => prev.map(chat => {
        if (chat.id === currentChatId) {
          return {
            ...chat,
            messages: [...chat.messages, assistantMessage],
            updatedAt: new Date()
          };
        }
        return chat;
      }));
    } catch (error) {
      console.error('Error:', error);
      // Add error message to chat
      setChats(prev => prev.map(chat => {
        if (chat.id === currentChatId) {
          return {
            ...chat,
            messages: [...chat.messages, {
              role: 'assistant',
              content: 'Sorry, there was an error processing your request.',
              timestamp: new Date()
            }],
            updatedAt: new Date()
          };
        }
        return chat;
      }));
    } finally {
      setIsLoading(false);
      setFiles([]);
      setFileUploadOpen(false);
    }
  };

  const handleStarChat = (chatId: string) => {
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        return {
          ...chat,
          isStarred: !chat.isStarred,
          updatedAt: new Date()
        };
      }
      return chat;
    }));
  };

  const handleRenameChat = (chatId: string, newTitle: string) => {
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        return {
          ...chat,
          title: newTitle,
          updatedAt: new Date()
        };
      }
      return chat;
    }));
  };

  const currentChat = getCurrentChat();

  return (
    <div className="flex h-screen bg-gradient-to-b from-indigo-900 via-purple-900 to-indigo-950">
      {/* Sidebar */}
      <Sidebar
        chats={chats}
        currentChatId={currentChatId}
        onNewChat={createNewChat}
        onSelectChat={setCurrentChatId}
        onDeleteChat={deleteChat}
        onStarChat={handleStarChat}
        onRenameChat={handleRenameChat}
      />

      {/* Main Content */}
      <main className={`flex-1 flex flex-col ${isSidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'}`}>
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto pb-36">
          <div className="max-w-4xl mx-auto p-4 space-y-6">
            {currentChat?.messages.length === 0 ? (
              <div className="text-center py-10">
                <div className="mb-8">
                  <div className="text-6xl mb-4">🧬</div>
                  <h2 className="text-2xl font-semibold text-purple-300 mb-2">
                    Welcome to Neurosci AI
                  </h2>
                  <p className="text-gray-400 max-w-md mx-auto">
                    Your neural interface for animal behavior analysis. Begin by describing the behavioral paradigm you want to analyze.
                  </p>
                </div>

                <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 px-4">
                  {analysisCategories.map((category, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setInput(category.title);
                      }}
                      className="bg-purple-900/50 hover:bg-purple-800/50 backdrop-blur-sm border border-purple-500/30 rounded-lg p-6 text-left transition-all hover:transform hover:scale-102 hover:shadow-lg"
                    >
                      <div className="text-2xl mb-2">{category.icon}</div>
                      <h3 className="text-xl font-medium text-purple-300 mb-2">
                        {category.title}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {category.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              currentChat?.messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                        : 'bg-black/20 backdrop-blur-sm border border-purple-500/30 text-gray-200'
                    }`}
                  >
                    <div className="text-sm font-medium mb-1 flex items-center">
                      {message.role === 'user' ? (
                        <>
                          <span className="mr-2">👤</span>
                          <span>You</span>
                        </>
                      ) : (
                        <>
                          <span className="mr-2">🧠</span>
                          <span>Neurosci AI</span>
                        </>
                      )}
                    </div>
                    <div className={`prose ${message.role === 'user' ? 'prose-invert' : 'prose-invert'} max-w-none prose-headings:mb-4 prose-p:mb-6 prose-li:mb-2`}>
                      <ReactMarkdown
                        components={{
                          h1: ({node, ...props}) => <h1 {...props} className="text-2xl font-bold mt-8 mb-4" />,
                          h2: ({node, ...props}) => <h2 {...props} className="text-xl font-bold mt-6 mb-3" />,
                          h3: ({node, ...props}) => <h3 {...props} className="text-lg font-semibold mt-4 mb-2" />,
                          p: ({node, ...props}) => <p {...props} className="mb-6" />,
                          ul: ({node, ...props}) => <ul {...props} className="space-y-4 mb-6" />,
                          li: ({node, ...props}) => <li {...props} className="mb-2" />,
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                    
                    {/* File attachments */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <div className="text-xs font-medium text-indigo-300 mb-1">Attached files:</div>
                        <div className="flex flex-wrap gap-2">
                          {message.attachments.map((file, fileIndex) => (
                            <div key={fileIndex} className="bg-black/30 rounded-md p-2 flex items-center text-sm">
                              <span className="mr-2">{getFileIcon(file.type)}</span>
                              <div>
                                <div className="text-white text-xs truncate max-w-[140px]">{file.name}</div>
                                <div className="text-indigo-300 text-xs">{formatFileSize(file.size)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className={`text-xs mt-2 ${
                      message.role === 'user' ? 'text-indigo-300' : 'text-gray-400'
                    }`}>
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="fixed bottom-0 left-0 right-0 bg-black/30 backdrop-blur-sm border-t border-purple-500/30 p-4 lg:pl-64">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleFileUploadClick}
                className={`flex-none flex items-center justify-center w-10 h-10 rounded-lg ${
                  fileUploadOpen || files.length > 0 
                    ? 'bg-purple-500 hover:bg-purple-600' 
                    : 'bg-black/30 border border-purple-500/50 hover:border-purple-400'
                } text-white transition-colors`}
                title="Upload files"
              >
                {files.length > 0 ? (
                  <span className="text-xs font-bold">{files.length}</span>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-5 h-5"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                )}
              </button>
              
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe behavioral analysis query..."
                  className="w-full resize-none rounded-lg border border-purple-500/50 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 p-3 bg-black/20 text-gray-200 placeholder:text-gray-500"
                  rows={1}
                  disabled={isLoading}
                />
              </div>
              
              <button
                type="submit"
                disabled={isLoading || (!input.trim() && files.length === 0)}
                className={`flex-none flex items-center justify-center w-10 h-10 rounded-lg ${
                  isLoading || (!input.trim() && files.length === 0)
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-500 text-white'
                } transition-colors`}
                title="Send message"
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-5 h-5"
                  >
                    <path d="M12 19V5M5 12l7-7 7 7" />
                  </svg>
                )}
              </button>
            </div>

            {/* File upload area */}
            {fileUploadOpen && (
              <div className="mt-3 p-3 bg-black/30 rounded-lg border border-purple-500/50">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-sm text-purple-300 font-medium">Upload Files</div>
                  <button 
                    type="button" 
                    onClick={() => setFileUploadOpen(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-4 h-4"
                    >
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  multiple
                  className="hidden"
                />
                
                <div 
                  onClick={triggerFileInput}
                  className="border-2 border-dashed border-purple-500/30 rounded-lg p-4 text-center cursor-pointer hover:border-purple-500/60 transition-colors"
                >
                  <div className="text-3xl mb-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-8 h-8 mx-auto text-purple-400"
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </div>
                  <div className="text-sm text-gray-300">Click to select files or drag and drop</div>
                  <div className="text-xs text-gray-500 mt-1">Upload videos, keypoint files, or other data</div>
                </div>
                
                {/* File list */}
                {files.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="text-xs font-medium text-purple-300">Selected files:</div>
                    <div className="max-h-32 overflow-y-auto pr-2">
                      {files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-black/20 rounded-md px-3 py-2 mb-2">
                          <div className="flex items-center">
                            <span className="mr-2">{getFileIcon(file.type)}</span>
                            <div>
                              <div className="text-white text-xs truncate max-w-[200px]">{file.name}</div>
                              <div className="text-gray-400 text-xs">{formatFileSize(file.size)}</div>
                            </div>
                          </div>
                          <button 
                            type="button"
                            onClick={() => removeFile(index)} 
                            className="text-gray-400 hover:text-white text-xs"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}
