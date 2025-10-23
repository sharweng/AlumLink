import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";

const SocketContext = createContext();

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within SocketProvider');
    }
    return context;
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState(new Set());
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const queryClient = useQueryClient();
    const authUser = queryClient.getQueryData(['authUser']);

    useEffect(() => {
        console.log('🔄 SocketProvider useEffect triggered');
        console.log('authUser exists?', !!authUser);
        
        if (authUser) {
            console.log('🔵 Attempting to connect to Socket.IO...');
            console.log('Auth User ID:', authUser._id);
            
            // Fetch token from backend (can't read httpOnly cookies in JS)
            const connectSocket = async () => {
                try {
                    let socketUrl = axiosInstance.defaults.baseURL;
                    if (socketUrl.endsWith('/api/v1')) {
                        socketUrl = socketUrl.replace('/api/v1', '');
                    }
                    const response = await axiosInstance.get('/auth/socket-token');
                    const { token } = response.data;
                    console.log('🔑 Socket token received (length:', token.length, ')');

                    const newSocket = io(socketUrl, {
                        auth: { token }
                    });

                    newSocket.on('connect', () => {
                        console.log('✅ Connected to socket server');
                        console.log('Socket ID:', newSocket.id);
                        console.log('User will be registered as:', authUser._id);
                        setSocket(newSocket);
                        setConnectionStatus('connected');
                    });

                    newSocket.on('connect_error', (error) => {
                        console.error('❌ Socket connection error:', error.message);
                        console.error('Error details:', error);
                        setConnectionStatus('error');
                    });

                    newSocket.on('disconnect', (reason) => {
                        console.log('🔴 Disconnected from socket server:', reason);
                        if (reason === 'io server disconnect') {
                            console.log('⚠️ Server disconnected the socket (possibly auth failure)');
                        }
                        setConnectionStatus('disconnected');
                    });

                    newSocket.on('user-online', (userId) => {
                        setOnlineUsers(prev => new Set([...prev, userId]));
                    });

                    newSocket.on('user-offline', (userId) => {
                        setOnlineUsers(prev => {
                            const updated = new Set(prev);
                            updated.delete(userId);
                            return updated;
                        });
                    });

                    newSocket.on('new-message', ({ message, conversationId }) => {
                        console.log('🔔 NEW MESSAGE EVENT RECEIVED!');
                        console.log('Message:', message);
                        console.log('Conversation ID:', conversationId);

                        // Force immediate refetch of queries
                        queryClient.refetchQueries(['conversations']);
                        queryClient.refetchQueries(['messages', conversationId]);
                        queryClient.refetchQueries(['unreadMessages']);

                        console.log('✅ Queries refetched');
                    });

                } catch (error) {
                    console.error('❌ Error connecting to Socket.IO:', error);
                }
            };

            connectSocket();
            
            return () => {
                if (socket) {
                    socket.close();
                }
            };
        } else if (socket) {
            socket.close();
            setSocket(null);
        }
    }, [authUser]);

    const value = {
        socket,
        onlineUsers,
        isUserOnline: (userId) => onlineUsers.has(userId)
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};
