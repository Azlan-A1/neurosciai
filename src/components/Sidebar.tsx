import React, { useState } from 'react';
import { Chat, ChatMessage } from '@/types/chat';

interface SidebarProps {
  chats: Chat[];
  currentChatId: string | null;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onStarChat: (id: string) => void;
  onRenameChat: (id: string, newTitle: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  chats,
  currentChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onStarChat,
  onRenameChat,
}) => {
  const [renamingChatId, setRenamingChatId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number; chatId: string } | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleContextMenu = (e: React.MouseEvent, chatId: string) => {
    e.preventDefault();
    setContextMenuPosition({
      x: e.clientX,
      y: e.clientY,
      chatId,
    });
  };

  const handleRenameSubmit = (chatId: string) => {
    if (newTitle.trim()) {
      onRenameChat(chatId, newTitle.trim());
      setRenamingChatId(null);
      setNewTitle('');
    }
  };

  const closeContextMenu = () => {
    setContextMenuPosition(null);
  };

  // Add click event listener to close context menu when clicking outside
  React.useEffect(() => {
    const handleClick = () => closeContextMenu();
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <>
      {/* Mobile backdrop - only show when sidebar is expanded */}
      {!isSidebarCollapsed && (
        <div className="fixed inset-0 bg-black/80 lg:hidden z-20" />
      )}

      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 bg-black/30 backdrop-blur-sm border-r border-purple-500/30 z-30 transition-all duration-300 ${
          isSidebarCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header with Logo/Home Button and Toggle */}
          <div className="p-4 border-b border-purple-500/30 flex items-center justify-between">
            <button
              onClick={onNewChat}
              className={`flex items-center space-x-3 text-white hover:text-purple-300 transition-colors ${
                isSidebarCollapsed ? 'justify-center w-full' : ''
              }`}
            >
              <span className="text-2xl">🧠</span>
              {!isSidebarCollapsed && (
                <span className="font-semibold text-lg">Neurosci AI</span>
              )}
            </button>
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="text-gray-400 hover:text-white transition-colors"
              title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`w-5 h-5 transition-transform duration-300 ${
                  isSidebarCollapsed ? 'rotate-180' : ''
                }`}
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          </div>

          {/* Only show these sections when sidebar is expanded */}
          {!isSidebarCollapsed && (
            <>
              {/* New Chat Button */}
              <div className="p-4">
                <button
                  onClick={onNewChat}
                  className="w-full flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg px-4 py-2 transition-colors"
                >
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
                  <span>New Chat</span>
                </button>
              </div>

              {/* Chat List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {chats.map((chat) => (
                  <div
                    key={chat.id}
                    className={`group flex items-center space-x-3 rounded-lg px-3 py-2 cursor-pointer transition-colors ${
                      chat.id === currentChatId
                        ? 'bg-purple-600 text-white'
                        : 'hover:bg-purple-500/20 text-gray-300'
                    }`}
                    onClick={() => onSelectChat(chat.id)}
                    onContextMenu={(e) => handleContextMenu(e, chat.id)}
                  >
                    <span className="text-lg">{chat.isStarred ? '⭐' : '💭'}</span>
                    {renamingChatId === chat.id ? (
                      <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        onBlur={() => handleRenameSubmit(chat.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleRenameSubmit(chat.id);
                          } else if (e.key === 'Escape') {
                            setRenamingChatId(null);
                            setNewTitle('');
                          }
                        }}
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className="flex-1 truncate text-sm">{chat.title}</span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleContextMenu(e, chat.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white transition-opacity"
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
                        <circle cx="12" cy="12" r="1" />
                        <circle cx="12" cy="5" r="1" />
                        <circle cx="12" cy="19" r="1" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>

              {/* User Section */}
              <div className="p-4 border-t border-purple-500/30">
                <div className="flex items-center space-x-3 text-gray-300">
                  <span className="text-xl">👤</span>
                  <span className="text-sm">User</span>
                </div>
              </div>
            </>
          )}

          {/* Show only icons when collapsed */}
          {isSidebarCollapsed && (
            <div className="flex-1 py-4">
              <button
                onClick={onNewChat}
                className="w-full flex justify-center p-2 text-white hover:text-purple-300 transition-colors"
                title="New Chat"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-6 h-6"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenuPosition && (
        <div
          className="fixed bg-gray-900 border border-gray-700 rounded-lg shadow-lg py-1 z-50"
          style={{
            top: contextMenuPosition.y,
            left: contextMenuPosition.x,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-800"
            onClick={() => {
              onStarChat(contextMenuPosition.chatId);
              closeContextMenu();
            }}
          >
            {chats.find(c => c.id === contextMenuPosition.chatId)?.isStarred ? 'Unstar' : 'Star'}
          </button>
          <button
            className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-800"
            onClick={() => {
              setRenamingChatId(contextMenuPosition.chatId);
              setNewTitle(chats.find(c => c.id === contextMenuPosition.chatId)?.title || '');
              closeContextMenu();
            }}
          >
            Rename
          </button>
          <button
            className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-800"
            onClick={() => {
              onDeleteChat(contextMenuPosition.chatId);
              closeContextMenu();
            }}
          >
            Delete
          </button>
        </div>
      )}
    </>
  );
};

export default Sidebar; 