import { useEffect, useState, useRef } from "react";
import { X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "../../lib/axios";
import { useSocket } from "../../contexts/SocketContext";
import toast from "react-hot-toast";
import {
    StreamVideo,
    StreamVideoClient,
    StreamCall,
    CallControls,
    SpeakerLayout,
    StreamTheme,
    CallingState,
    useCallStateHooks,
} from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

console.log("VideoCallModal loaded with API Key:", STREAM_API_KEY ? "Configured" : "MISSING!");

const VideoCallModal = ({ isOpen, onClose, callId, authUser, otherUser }) => {
    const [client, setClient] = useState(null);
    const clientRef = useRef(null);
    const [call, setCall] = useState(null);
    const callRef = useRef(null);
    const [isConnecting, setIsConnecting] = useState(true);
    const [showError, setShowError] = useState(false);
    const [hasError, setHasError] = useState(false);
    const { socket } = useSocket();

    // Fetch Stream token
    const { data: tokenData, isLoading: tokenLoading } = useQuery({
        queryKey: ["streamToken"],
        queryFn: async () => {
            const res = await axiosInstance.get("/stream/token");
            return res.data;
        },
        enabled: isOpen && !!authUser,
        staleTime: 1000 * 60 * 30, // Token valid for 30 minutes
    });

    useEffect(() => {
        if (!isOpen) return;

        console.log('VideoCallModal effect starting for callId:', callId, 'isOpen:', isOpen, 'authUser present:', !!authUser);

        // Set a timer to allow showing errors after 15 seconds
        const errorTimer = setTimeout(() => {
            setShowError(true);
        }, 15000);

        const initCall = async () => {
            if (!tokenData?.token || !authUser || !callId) {
                console.log("Missing required data:", {
                    hasToken: !!tokenData?.token,
                    hasAuthUser: !!authUser,
                    hasCallId: !!callId
                });
                setIsConnecting(false);
                setHasError(true);
                return;
            }

            try {
                console.log("Initializing Stream video client...");
                console.log("API Key:", STREAM_API_KEY ? "Present" : "Missing");
                console.log("Token:", tokenData.token ? "Present" : "Missing");
                console.log("Call ID:", callId);

                if (!STREAM_API_KEY) {
                    throw new Error("Stream API Key is not configured. Check your .env file.");
                }

                const user = {
                    id: authUser._id,
                    name: authUser.name,
                    image: authUser.profilePic || undefined,
                };

                console.log("Creating video client with user:", user);

                const videoClient = StreamVideoClient.getOrCreateInstance({
                    apiKey: STREAM_API_KEY,
                    user,
                    token: tokenData.token,
                });

                console.log("Video client created, joining call...");

                const callInstance = videoClient.call("default", callId);

                let callState;
                try {
                    callState = await callInstance.get();
                } catch (error) {
                    // Call doesn't exist yet, will create it
                    console.log("Call does not exist, will create");
                }

                if (callState) {
                    const participants = callState.participants || [];
                    console.log("Existing call participants:", participants.length);

                    // Check if user is already in the call
                    const isUserAlreadyIn = participants.some(p => p.user_id === authUser._id);
                        if (isUserAlreadyIn) {
                            console.log("User already in call, skipping join");
                            setClient(videoClient);
                            clientRef.current = videoClient;
                            setCall(callInstance);
                            callRef.current = callInstance;
                        setHasError(false);
                        clearTimeout(errorTimer);
                        return;
                    }

                    // Check if call is full (should only be 2 for mentorship)
                    if (participants.length >= 2) {
                        throw new Error("This mentorship call is already full (2 participants maximum)");
                    }

                    // Join existing call
                    await callInstance.join();
                } else {
                    // Create new call
                    await callInstance.join({ create: true });
                    
                    // Set max participants to 2 for mentorship calls
                    try {
                        await callInstance.update({ 
                            settings: { 
                                limits: { max_participants: 2 } 
                            } 
                        });
                        console.log("Set max participants to 2 for new call");
                    } catch (updateError) {
                        console.warn("Could not set max participants limit:", updateError);
                        // Continue anyway, as the call was created successfully
                    }
                }

                console.log("Joined call successfully");

                setClient(videoClient);
                clientRef.current = videoClient;
                setCall(callInstance);
                callRef.current = callInstance;
                setHasError(false);
                clearTimeout(errorTimer);
            } catch (error) {
                console.error("Error joining call:", error);
                console.error("Error message:", error.message);
                console.error("Error stack:", error.stack);
                
                setHasError(true);
                
                // Only show error toast if 15 seconds have passed
                if (showError) {
                    toast.error(`Could not join the call: ${error.message}`);
                }
            } finally {
                setIsConnecting(false);
            }
        };

        initCall();

        // Listen for remote end-call events so we can force the local client to leave too
        const handleRemoteCallEnded = async ({ callId: endedCallId }) => {
            if (!endedCallId) return;
            // Only react if the ended call matches the current callId
            if (endedCallId !== callId) return;
            console.log("Remote call-ended received for this call, forcing leave and cleanup");

            try {
                // Primary attempt: use the local call instance
                const activeCall = callRef.current;
                if (activeCall) {
                    try {
                        await activeCall.leave();
                    } catch (err) {
                        console.warn("Error leaving call on remote end (call.leave):", err);
                    }
                }

                // Fallback: if call wasn't available, try to create a call handle and leave that
                if (!activeCall && clientRef.current) {
                    try {
                        const fallbackCall = clientRef.current.call("default", endedCallId);
                        await fallbackCall.leave();
                    } catch (err) {
                        console.warn("Error leaving call via fallback client.call:", err);
                    }
                }

                // Finally, ensure the client is disconnected (this should stop local media)
                if (clientRef.current) {
                    try {
                        await clientRef.current.disconnectUser();
                    } catch (err) {
                        console.warn("Error disconnecting client on remote end:", err);
                    }
                }

                // Final fallback: stop any local media tracks if they are still active
                try {
                    const fallbackStream = callRef.current?.state?.mediaStream || clientRef.current?.state?.mediaStream || null;
                    if (fallbackStream && typeof fallbackStream.getTracks === 'function') {
                        fallbackStream.getTracks().forEach((t) => {
                            try { t.stop(); } catch (e) { /* ignore */ }
                        });
                        console.log('Stopped local media tracks via fallback after remote end');
                    }
                } catch (err) {
                    console.warn('Error stopping local media tracks on remote end fallback:', err);
                }

                // Close modal and clear local state
                try {
                    onClose();
                    // clear local references so subsequent joins create fresh state
                    setCall(null);
                    callRef.current = null;
                    setClient(null);
                    clientRef.current = null;
                } catch (err) {
                    console.warn("Error closing modal after remote end:", err);
                }
            } catch (err) {
                console.error("Error handling remote call-ended:", err);
            }
        };

        if (socket) {
            console.log('VideoCallModal: registering socket listener for call-ended');
            socket.on('call-ended', handleRemoteCallEnded);
        }

        // Cleanup function
        return () => {
            clearTimeout(errorTimer);
            if (socket) {
                console.log('VideoCallModal: removing socket listener for call-ended');
                socket.off('call-ended', handleRemoteCallEnded);
            }
            const activeCall = callRef.current;
            if (activeCall) {
                activeCall.leave().catch((err) => console.warn('Error leaving call during cleanup:', err));
                callRef.current = null;
            }
            // Note: Don't disconnect client here as it's shared via getOrCreateInstance
        };
    }, [tokenData, authUser, callId, isOpen]);

    const handleClose = async () => {
        console.log('VideoCallModal: handleClose invoked for callId:', callId);
        if (otherUser && socket) {
            socket.emit('end-call', { recipientId: otherUser._id, callId });
        }
        try {
            // Try to leave the call if possible. call.end() is not part of the client SDK
            const activeCall = callRef.current;
            if (activeCall) {
                try {
                    await activeCall.leave();
                } catch (leaveErr) {
                    // If the call was already left or cannot be left, just log and continue
                    console.warn("Error leaving call during handleClose:", leaveErr);
                }
            }

            // Ensure we disconnect the client to stop any local media
            if (clientRef.current) {
                try {
                    await clientRef.current.disconnectUser();
                } catch (discErr) {
                    console.warn("Error disconnecting client during handleClose:", discErr);
                }
            }

            // Final fallback: stop any local media tracks if they are still active
            try {
                const fallbackStream = callRef.current?.state?.mediaStream || clientRef.current?.state?.mediaStream || null;
                if (fallbackStream && typeof fallbackStream.getTracks === 'function') {
                    fallbackStream.getTracks().forEach((t) => {
                        try { t.stop(); } catch (e) { /* ignore */ }
                    });
                    console.log('Stopped local media tracks via fallback during handleClose');
                }
            } catch (err) {
                console.warn('Error stopping local media tracks on handleClose fallback:', err);
            }
        } catch (error) {
            console.error("Error leaving call:", error);
        } finally {
            setClient(null);
            clientRef.current = null;
            setCall(null);
            callRef.current = null;
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        // Use a solid dark background for the modal body and add dedicated top/bottom gradient overlays
        <div className="fixed inset-0 bg-[#071026] flex items-center justify-center z-50">
            <div className="relative w-full h-full flex flex-col">
                {/* Top gradient overlay (keeps header readable) */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-black/70 to-transparent z-40"></div>
                {/* Bottom gradient overlay (soft fade near controls) */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/70 to-transparent z-40"></div>
                {/* Header Bar */}
                <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/70 to-transparent">
                    <div className="flex items-center justify-between p-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-white font-medium">AlumLink Video Call</span>
                        </div>
                        <button
                            onClick={handleClose}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition shadow-lg flex items-center space-x-2"
                            title="Leave Call"
                        >
                            <X size={20} />
                            <span className="font-medium">Leave</span>
                        </button>
                    </div>
                </div>

                {/* Video Call Content */}
                <div className="flex-1 flex items-center justify-center pt-16">
                    {tokenLoading || isConnecting ? (
                        <div className="text-white text-center">
                            <div className="relative mb-6">
                                <div className="animate-spin rounded-full h-20 w-20 border-4 border-t-primary border-r-primary border-b-transparent border-l-transparent mx-auto"></div>
                                <div className="absolute inset-0 rounded-full h-20 w-20 border-4 border-primary/20 mx-auto"></div>
                            </div>
                            <p className="text-xl font-semibold mb-2">Connecting to video call...</p>
                            <p className="text-gray-400">Please wait while we set up your connection</p>
                        </div>
                    ) : client && call ? (
                        <div className="w-full flex justify-center px-4">
                            <div className="w-full" style={{ maxWidth: '937px' }}>
                                <StreamVideo client={client}>
                                    <StreamCall call={call}>
                                            <CallContent onLeave={handleClose} />
                                        </StreamCall>
                                </StreamVideo>
                            </div>
                        </div>
                    ) : hasError && showError ? (
                        <div className="text-white text-center bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 max-w-md mx-4">
                            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <X size={32} className="text-red-500" />
                            </div>
                            <p className="text-xl font-semibold mb-2">Could not initialize call</p>
                            <p className="text-gray-400 mb-6">There was an issue connecting to the video service</p>
                            <button
                                onClick={handleClose}
                                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-medium"
                            >
                                Close
                            </button>
                        </div>
                    ) : (
                        <div className="text-white text-center">
                            <div className="relative mb-6">
                                <div className="animate-spin rounded-full h-20 w-20 border-4 border-t-primary border-r-primary border-b-transparent border-l-transparent mx-auto"></div>
                                <div className="absolute inset-0 rounded-full h-20 w-20 border-4 border-primary/20 mx-auto"></div>
                            </div>
                            <p className="text-xl font-semibold mb-2">Setting up video call...</p>
                            <p className="text-gray-400">This may take a moment</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const CallContent = ({ onLeave }) => {
    const { useCallCallingState, useParticipants } = useCallStateHooks();
    const callingState = useCallCallingState();
    const participants = useParticipants();

    useEffect(() => {
        if (callingState === CallingState.LEFT) {
            onLeave();
        }
    }, [callingState, onLeave]);

    return (
        // Ensure text inside the call (user names, labels) is white by default
        <StreamTheme className="w-full h-full text-white">
            <div className="flex flex-col h-full bg-transparent">
                {/* Participant Info Bar */}
                <div className="absolute top-20 left-0 right-0 z-40 px-4">
                    <div className="flex justify-center">
                        <div className="bg-black/60 backdrop-blur-md rounded-full px-6 py-3 shadow-xl border border-gray-700">
                            <div className="flex items-center space-x-2 text-white">
                                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                <span className="text-sm font-medium">
                                    {participants.length} {participants.length === 1 ? 'Participant' : 'Participants'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Video Layout */}
                <div className="flex-1 relative">
                    <SpeakerLayout />
                </div>

                {/* Control Bar */}
                <div className="pb-6 pt-8 bg-transparent">
                    <div className="flex justify-center">
                        <div className="bg-gray-800/90 backdrop-blur-md rounded-full px-4 py-3 shadow-2xl border border-gray-700">
                            <CallControls />
                        </div>
                    </div>
                </div>
            </div>
        </StreamTheme>
    );
};

export default VideoCallModal;
