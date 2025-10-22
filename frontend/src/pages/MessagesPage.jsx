import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../lib/axios';
import { useSocket } from '../contexts/SocketContext';
import Sidebar from '../components/Sidebar';
import { useSearchParams } from 'react-router-dom';
import { 
    MessageCircle, Send, Video, MoreVertical, 
    ArrowLeft, Smile, Paperclip, Search, Check, CheckCheck, Loader
} from 'lucide-react';
import VideoCallModal from '../components/mentorship/VideoCallModal';
import CallInvitationModal from '../components/mentorship/CallInvitationModal';
import ReportModal from '../components/common/ReportModal';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const MessagesPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messageInput, setMessageInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [showInvitationModal, setShowInvitationModal] = useState(false);
    const [invitationCallId, setInvitationCallId] = useState(null);
    const [isCaller, setIsCaller] = useState(false);
    const [otherUserForCall, setOtherUserForCall] = useState(null);
    const [showReportModal, setShowReportModal] = useState(false);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [activeTab, setActiveTab] = useState('chats'); // 'chats' or 'links'
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const queryClient = useQueryClient();
    const authUser = queryClient.getQueryData(['authUser']);
    const { socket, isUserOnline } = useSocket();
    const userIdFromParams = searchParams.get('user');

    // Fetch user links for 'Links' tab
    const { data: links, isLoading: loadingLinks } = useQuery({
        queryKey: ['links'],
        queryFn: async () => {
            const res = await axiosInstance.get('/links');
            return res.data;
        },
        refetchOnWindowFocus: true,
        staleTime: 0
    });

    // Fetch conversations with auto-refetch
    const { data: conversations, isLoading: loadingConversations } = useQuery({
        queryKey: ['conversations'],
        queryFn: async () => {
            const res = await axiosInstance.get('/messages/conversations');
            return res.data;
        },
        refetchOnWindowFocus: true,
        staleTime: 0 // Always consider data stale for real-time updates
    });

    // Fetch messages for selected conversation
    const { data: messages, isLoading: loadingMessages } = useQuery({
        queryKey: ['messages', selectedConversation?._id],
        queryFn: async () => {
            if (!selectedConversation) return [];
            const res = await axiosInstance.get(`/messages/conversations/${selectedConversation._id}/messages`);
            return res.data;
        },
        enabled: !!selectedConversation
    });

    // Send message mutation with optimistic updates
    const { mutate: sendMessage } = useMutation({
        mutationFn: async (content) => {
            const res = await axiosInstance.post(
                `/messages/conversations/${selectedConversation._id}/messages`,
                { content }
            );
            return res.data;
        },
        onMutate: async (content) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries(['messages', selectedConversation._id]);
            
            // Snapshot previous value
            const previousMessages = queryClient.getQueryData(['messages', selectedConversation._id]);
            
            // Optimistically update to show message immediately
            const optimisticMessage = {
                _id: 'temp-' + Date.now(),
                content,
                sender: authUser,
                createdAt: new Date().toISOString(),
                readBy: [authUser._id],
                isOptimistic: true
            };
            
            queryClient.setQueryData(['messages', selectedConversation._id], (old) => 
                old ? [...old, optimisticMessage] : [optimisticMessage]
            );
            
            return { previousMessages };
        },
        onSuccess: () => {
            setMessageInput('');
            queryClient.invalidateQueries(['messages', selectedConversation._id]);
            queryClient.invalidateQueries(['conversations']);
        },
        onError: (error, content, context) => {
            // Rollback on error
            queryClient.setQueryData(['messages', selectedConversation._id], context.previousMessages);
            toast.error(error.response?.data?.message || 'Failed to send message');
        }
    });

    // Scroll to bottom on new messages (only messages container)
    useEffect(() => {
        const container = document.getElementById('messages-scroll-area');
        if (container && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }, [messages]);

    // Socket listeners
    useEffect(() => {
        if (!socket) return;

        // Handle typing indicator
        socket.on("typing", ({ conversationId, recipientId }) => {
            const recipientSocketId = userSocketMap.get(recipientId);
            if (recipientSocketId) {
                io.to(recipientSocketId).emit("user-typing", {
                    conversationId,
                    userId: socket.userId
                });
            }
        });

        socket.on("stop-typing", ({ conversationId, recipientId }) => {
            const recipientSocketId = userSocketMap.get(recipientId);
            if (recipientSocketId) {
                io.to(recipientSocketId).emit("user-stop-typing", {
                    conversationId,
                    userId: socket.userId
                });
            }
        });

        return () => {
            socket.off('user-typing');
            socket.off('user-stop-typing');
        };
    }, [socket, selectedConversation, authUser, conversations]);

    // Handle user parameter from URL (when coming from profile)
    useEffect(() => {
        if (userIdFromParams && conversations) {
            // Try to find existing conversation with this user
            const existingConv = conversations.find(conv => 
                conv.participants.some(p => p._id === userIdFromParams)
            );

            if (existingConv) {
                setSelectedConversation(existingConv);
            } else {
                // Create new conversation/get or create
                axiosInstance.get(`/messages/conversations/${userIdFromParams}`)
                    .then(res => {
                        setSelectedConversation(res.data);
                        queryClient.invalidateQueries(['conversations']);
                    })
                    .catch(err => {
                        toast.error(err.response?.data?.message || 'Cannot message this user');
                    });
            }
            // Clear the URL parameter
            setSearchParams({});
        }
    }, [userIdFromParams, conversations]);

    const handleTyping = () => {
        if (!socket || !selectedConversation) return;

        const otherUser = selectedConversation.participants.find(p => p._id !== authUser._id);
        socket.emit('typing', {
            conversationId: selectedConversation._id,
            recipientId: otherUser._id
        });

        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('stop-typing', {
                conversationId: selectedConversation._id,
                recipientId: otherUser._id
            });
        }, 1000);
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!messageInput.trim()) return;
        sendMessage(messageInput);
    };

    const filteredConversations = conversations?.filter(conv => {
        const otherUser = conv.participants.find(p => p._id !== authUser._id);
        return otherUser.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
               otherUser.username.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const getOtherUser = (conversation) => {
        return conversation.participants.find(p => p._id !== authUser._id);
    };

    const formatShortDistance = (date) => {
        if (!date) return '';
        const diffMs = Date.now() - new Date(date).getTime();
        const minutes = Math.floor(diffMs / 60000);
        if (minutes < 1) return 'now';
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h`;
        const days = Math.floor(hours / 24);
        return `${days}d`;
    };

    return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="hidden lg:block">
            <Sidebar user={authUser} />
        </div>

        {/* Messages Container */}
        <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col" style={{ height: '85vh' }}>
                <div className="grid grid-cols-1 md:grid-cols-3 h-full min-h-0">
                    {/* Conversations/Links List */}
                    <div className={`md:col-span-1 border-r border-gray-200 flex flex-col h-full ${selectedConversation ? 'hidden md:flex' : 'flex'}`}> 
                        {/* Header */}
                        <div className="p-4 border-b border-gray-200">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <MessageCircle className="text-primary" />
                                Messages
                            </h2>
                            {/* Tabs */}
                            <div className="mt-3 flex gap-2">
                                <button
                                    className={`px-3 py-1 rounded-t-lg font-semibold border-b-2 transition-colors ${activeTab === 'chats' ? 'border-primary text-primary bg-gray-50' : 'border-transparent text-gray-500 bg-transparent'}`}
                                    onClick={() => setActiveTab('chats')}
                                >
                                    Chats
                                </button>
                                <button
                                    className={`px-3 py-1 rounded-t-lg font-semibold border-b-2 transition-colors ${activeTab === 'links' ? 'border-primary text-primary bg-gray-50' : 'border-transparent text-gray-500 bg-transparent'}`}
                                    onClick={() => setActiveTab('links')}
                                >
                                    Links
                                </button>
                            </div>
                            {/* Search for both tabs */}
                            <div className="mt-3 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder={activeTab === 'chats' ? "Search conversations..." : "Search links..."}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                        </div>

                        {/* Chats or Links List */}
                        <div className="flex-1 overflow-y-auto">
                            {activeTab === 'chats' ? (
                                loadingConversations ? (
                                    <div className="flex justify-center items-center h-full">
                                        <Loader className="animate-spin text-primary" size={32} />
                                    </div>
                                ) : filteredConversations?.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
                                        <MessageCircle size={48} className="mb-2 text-gray-400" />
                                        <p className="text-center">No conversations yet</p>
                                        <p className="text-sm text-center mt-1">Message your connections or mentorship partners</p>
                                    </div>
                                ) : (
                                    filteredConversations?.map((conversation) => {
                                        const otherUser = getOtherUser(conversation);
                                        const unread = conversation.unreadCount?.get?.(authUser._id) || 0;
                                        const isOnline = isUserOnline(otherUser._id);
                                        return (
                                            <div
                                                key={conversation._id}
                                                onClick={() => setSelectedConversation(conversation)}
                                                className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition ${
                                                    selectedConversation?._id === conversation._id ? 'bg-blue-50' : ''
                                                }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="relative">
                                                        <img
                                                            src={otherUser.profilePicture || '/avatar.png'}
                                                            alt={otherUser.name}
                                                            className="w-12 h-12 rounded-full object-cover"
                                                        />
                                                        {isOnline && (
                                                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between">
                                                            <p className="font-semibold text-gray-900 truncate" title={otherUser.name}>{otherUser.name}</p>
                                                        </div>
                                                        <p className="text-sm text-gray-600 truncate">{otherUser.headline || otherUser.username}</p>
                                                        {conversation.lastMessage && (
                                                            <div className="flex items-center justify-between mt-1">
                                                                <p className="text-sm text-gray-500 truncate mr-3">
                                                                    {conversation.lastMessage.sender._id === authUser._id && 'You: '}
                                                                    {conversation.lastMessage.content}
                                                                </p>
                                                                <span className="text-xs text-gray-400 flex-shrink-0">{formatShortDistance(conversation.lastMessageAt || conversation.lastMessage?.createdAt)}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {unread > 0 && (
                                                        <div className="bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                                            {unread}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )
                            ) : (
                                loadingLinks ? (
                                    <div className="flex justify-center items-center h-full">
                                        <Loader className="animate-spin text-primary" size={32} />
                                    </div>
                                ) : links?.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
                                        <MessageCircle size={48} className="mb-2 text-gray-400" />
                                        <p className="text-center">No links yet</p>
                                        <p className="text-sm text-center mt-1">Link with users to start messaging</p>
                                    </div>
                                ) : (
                                    links?.filter(user =>
                                        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        user.username.toLowerCase().includes(searchQuery.toLowerCase())
                                    ).map((user) => (
                                        <div
                                            key={user._id}
                                            onClick={async () => {
                                                // Find or create conversation with this user
                                                let conv = conversations?.find(c => c.participants.some(p => p._id === user._id));
                                                if (conv) {
                                                    setSelectedConversation(conv);
                                                    setActiveTab('chats');
                                                } else {
                                                    try {
                                                        const res = await axiosInstance.get(`/messages/conversations/${user._id}`);
                                                        setSelectedConversation(res.data);
                                                        setActiveTab('chats');
                                                        queryClient.invalidateQueries(['conversations']);
                                                    } catch (err) {
                                                        toast.error(err.response?.data?.message || 'Cannot message this user');
                                                    }
                                                }
                                            }}
                                            className="p-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition flex items-center gap-3"
                                        >
                                            <img
                                                src={user.profilePicture || '/avatar.png'}
                                                alt={user.name}
                                                className="w-10 h-10 rounded-full object-cover"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-gray-900 truncate" title={user.name}>{user.name}</p>
                                                <p className="text-sm text-gray-600 truncate">{user.headline || user.username}</p>
                                            </div>
                                            <span className="text-xs text-gray-400">{user.links?.length || 0} links</span>
                                        </div>
                                    ))
                                )
                            )}
                        </div>
                    </div>

                        {/* Chat Area */}
                        <div className={`md:col-span-2 flex flex-col h-full overflow-hidden ${selectedConversation ? 'flex' : 'hidden md:flex'}`}>
                            {selectedConversation ? (
                                <>
                                    {/* Chat Header - Sticky at top of chat area */}
                                    <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white flex-shrink-0 z-0 sticky top-0">
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => setSelectedConversation(null)}
                                                className="md:hidden"
                                            >
                                                <ArrowLeft />
                                            </button>
                                            <a href={`/profile/${getOtherUser(selectedConversation).username}`} className="relative group" tabIndex={-1}>
                                                <img
                                                    src={getOtherUser(selectedConversation).profilePicture || '/avatar.png'}
                                                    alt={getOtherUser(selectedConversation).name}
                                                    className="w-10 h-10 rounded-full object-cover cursor-pointer group-hover:ring-2 group-hover:ring-primary"
                                                />
                                                {isUserOnline(getOtherUser(selectedConversation)._id) && (
                                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                                                )}
                                            </a>
                                            <div>
                                                <a href={`/profile/${getOtherUser(selectedConversation).username}`} className="font-semibold hover:underline cursor-pointer truncate">
                                                    {getOtherUser(selectedConversation).name}
                                                </a>
                                                <p className="text-xs text-gray-500">
                                                    {isUserOnline(getOtherUser(selectedConversation)._id) ? 'Online' : 'Offline'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                className="p-2 hover:bg-gray-100 rounded-full transition"
                                                disabled={showInvitationModal}
                                                onClick={() => {
                                                    const cid = `conversation-${selectedConversation._id}`;
                                                    const otherUser = getOtherUser(selectedConversation);
                                                    setInvitationCallId(cid);
                                                    setIsCaller(true);
                                                    setOtherUserForCall(otherUser);
                                                    setShowInvitationModal(true);
                                                    socket.emit('call-invite', {
                                                        callId: cid,
                                                        recipientId: otherUser._id,
                                                        callerId: authUser._id,
                                                        callerName: authUser.name,
                                                        callerProfilePicture: authUser.profilePicture
                                                    });
                                                }}
                                            >
                                                <Video size={20} className="text-gray-600" />
                                            </button>
                                            <div className="relative">
                                                <button className="p-2 hover:bg-gray-100 rounded-full transition" onClick={() => setShowMoreMenu(v => !v)}>
                                                    <MoreVertical size={20} className="text-gray-600" />
                                                </button>
                                                {showMoreMenu && (
                                                    <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow-md z-20">
                                                        <button
                                                            className="w-full text-left px-3 py-2 hover:bg-gray-50"
                                                            onClick={() => {
                                                                setShowMoreMenu(false);
                                                                setShowReportModal(true);
                                                            }}
                                                        >
                                                            Report user
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Messages - Scrollable area */}
                                    <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 bg-gray-50" id="messages-scroll-area">
                                        {loadingMessages ? (
                                            <div className="flex justify-center items-center h-full">
                                                <Loader className="animate-spin text-primary" size={32} />
                                            </div>
                                        ) : (
                                            <>
                                                {messages?.map((message) => {
                                                    const isOwn = message.sender._id === authUser._id;
                                                    return (
                                                        <div
                                                            key={message._id}
                                                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                                                        >
                                                            <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                                                                <div
                                                                    className={`rounded-lg px-4 py-2 ${
                                                                        isOwn
                                                                            ? 'bg-primary text-white'
                                                                            : 'bg-gray-100 text-gray-900'
                                                                    }`}
                                                                >
                                                                    <p className="break-words">{message.content}</p>
                                                                </div>
                                                                <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                                                    <span className="text-xs text-gray-500">
                                                                        {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                                                                    </span>
                                                                    {isOwn && (
                                                                        message.readBy.length > 1 ? (
                                                                            <CheckCheck size={14} className="text-blue-500" />
                                                                        ) : (
                                                                            <Check size={14} className="text-gray-500" />
                                                                        )
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                <div ref={messagesEndRef} />
                                            </>
                                        )}
                                    </div>

                                    {/* Report Modal for reporting the other user in the conversation */}
                                    {showReportModal && selectedConversation && (
                                        <ReportModal
                                            isOpen={showReportModal}
                                            onClose={() => setShowReportModal(false)}
                                            defaultType={'other'}
                                            targetId={getOtherUser(selectedConversation)?.username}
                                        />
                                    )}

                                    {/* Message Input or Banned Notice */}
                                    {getOtherUser(selectedConversation)?.banned ? (
                                        <div className="p-4 border-t border-gray-200 bg-red-50 text-center text-red-600 font-semibold">
                                            You cannot message this user because they are banned.
                                        </div>
                                    ) : (
                                        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white flex-shrink-0">
                                            <div className="flex items-center gap-2">
                                            
                                                <input
                                                    type="text"
                                                    value={messageInput}
                                                    onChange={(e) => {
                                                        setMessageInput(e.target.value);
                                                        handleTyping();
                                                    }}
                                                    placeholder="Type a message..."
                                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
                                                />
                                                <button
                                                    type="submit"
                                                    disabled={!messageInput.trim()}
                                                    className="p-2 bg-primary text-white rounded-full hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <Send size={20} />
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                    <MessageCircle size={64} className="mb-4 text-gray-400" />
                                    <p className="text-xl font-semibold">Select a conversation</p>
                                    <p className="text-sm mt-2">Choose a conversation to start messaging</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        
            {/* Call invitation modal */}
            <CallInvitationModal
                isOpen={showInvitationModal}
                onClose={() => { 
                    setShowInvitationModal(false); 
                    setInvitationCallId(null); 
                    setIsCaller(false); 
                    setOtherUserForCall(null); 
                }}
                callId={invitationCallId}
                authUser={authUser}
                isCaller={isCaller}
                otherUser={otherUserForCall}
                onAccept={() => {
                    socket.emit('start-video-call', { callId: invitationCallId });
                }}
                socket={socket}
            />
        </div>
    );
};

export default MessagesPage;
