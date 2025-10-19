import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

let io;
const userSocketMap = new Map(); // userId -> socketId

export const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || "http://localhost:5173",
            credentials: true
        }
    });

    // Authentication middleware for socket connections
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            
            console.log('🔐 Socket authentication attempt...');
            console.log('Token received:', token ? 'YES (length: ' + token.length + ')' : 'NO');
            
            if (!token) {
                console.error('❌ No token provided in socket handshake');
                return next(new Error("Authentication error: No token"));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('✅ Token decoded, userId:', decoded.userId);
            
            const user = await User.findById(decoded.userId).select("-password");
            
            if (!user) {
                console.error('❌ User not found for id:', decoded.userId);
                return next(new Error("User not found"));
            }

            socket.userId = user._id.toString();
            socket.user = user;
            console.log('✅ Socket authenticated for user:', socket.userId);
            next();
        } catch (error) {
            console.error('❌ Socket authentication error:', error.message);
            next(new Error("Authentication error: " + error.message));
        }
    });

    io.on("connection", (socket) => {
        console.log(`🟢 User connected: ${socket.userId}, Socket ID: ${socket.id}`);
        
        // Store socket connection
        userSocketMap.set(socket.userId, socket.id);
        console.log(`📝 Stored in socket map. Total connected users: ${userSocketMap.size}`);
        console.log(`👥 All connected user IDs:`, Array.from(userSocketMap.keys()));
        
        // Emit online status to all connections
        socket.broadcast.emit("user-online", socket.userId);

        // Join personal room for receiving messages
        socket.join(socket.userId);

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

        // Handle call invitation
        socket.on("call-invite", ({ callId, recipientId, callerId, callerName, callerProfilePicture, otherUser }) => {
            const recipientSocketId = userSocketMap.get(recipientId);
            if (recipientSocketId) {
                io.to(recipientSocketId).emit("incoming-call", {
                    callId,
                    callerId,
                    callerName,
                    callerProfilePicture,
                    otherUser
                });
            }
        });

        // Handle call accept
        socket.on("call-accept", async ({ callId, callerId }) => {
            const callerSocketId = userSocketMap.get(callerId);
            const recipientSocketId = userSocketMap.get(socket.userId);
            
            // Get user data
            const recipientUser = socket.user;
            const callerUser = await User.findById(callerId).select("-password");
            
            // Notify caller that call was accepted
            if (callerSocketId) {
                io.to(callerSocketId).emit("call-accepted", { callId });
                // Also instruct caller to start the video call
                io.to(callerSocketId).emit("start-video-call", { callId, otherUser: recipientUser });
            }
            // Ensure recipient also starts the video call
            if (recipientSocketId) {
                io.to(recipientSocketId).emit("start-video-call", { callId, otherUser: callerUser });
            }
        });

        // Handle call deny
        socket.on("call-deny", ({ callId, callerId }) => {
            const callerSocketId = userSocketMap.get(callerId);
            if (callerSocketId) {
                io.to(callerSocketId).emit("call-denied", {
                    callId
                });
            }
        });

        // Handle call cancel
        socket.on("call-cancel", ({ callId, recipientId }) => {
            const recipientSocketId = userSocketMap.get(recipientId);
            if (recipientSocketId) {
                io.to(recipientSocketId).emit("call-cancelled", {
                    callId
                });
            }
        });

        // Handle call timeout
        socket.on("call-timeout", ({ callId, recipientId }) => {
            const recipientSocketId = userSocketMap.get(recipientId);
            if (recipientSocketId) {
                io.to(recipientSocketId).emit("call-timeout", {
                    callId
                });
            }
        });

        // Handle start video call
        socket.on("start-video-call", ({ callId }) => {
            socket.emit("start-video-call", { callId });
        });

        // Handle end call
        socket.on("end-call", ({ recipientId, callId }) => {
            const recipientSocketId = userSocketMap.get(recipientId);
            const senderSocketId = userSocketMap.get(socket.userId);
            
            // Notify the recipient that the call has ended
            if (recipientSocketId) {
                io.to(recipientSocketId).emit("call-ended", {
                    callId
                });
            }
            
            // Also notify the sender (the person who hung up) to show the ended modal
            if (senderSocketId) {
                io.to(senderSocketId).emit("call-ended", {
                    callId
                });
            }
        });

        // Handle disconnect
        socket.on("disconnect", () => {
            console.log(`User disconnected: ${socket.userId}`);
            userSocketMap.delete(socket.userId);
            socket.broadcast.emit("user-offline", socket.userId);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};

export const getRecipientSocketId = (userId) => {
    return userSocketMap.get(userId);
};

export const isUserOnline = (userId) => {
    return userSocketMap.has(userId);
};

export const emitToUser = (userId, event, data) => {
    const socketId = userSocketMap.get(userId);
    console.log(`Attempting to emit '${event}' to user ${userId}, socketId: ${socketId}`);
    console.log(`Currently connected users:`, Array.from(userSocketMap.keys()));
    if (socketId) {
        io.to(socketId).emit(event, data);
        console.log(`Successfully emitted '${event}' to ${userId}`);
        return true;
    }
    console.log(`User ${userId} not found in socket map`);
    return false;
};
