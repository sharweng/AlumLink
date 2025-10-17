import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "../../lib/axios";
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

const VideoCallModal = ({ isOpen, onClose, callId, authUser }) => {
    const [client, setClient] = useState(null);
    const [call, setCall] = useState(null);
    const [isConnecting, setIsConnecting] = useState(true);
    const [showError, setShowError] = useState(false);
    const [hasError, setHasError] = useState(false);

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

                const videoClient = new StreamVideoClient({
                    apiKey: STREAM_API_KEY,
                    user,
                    token: tokenData.token,
                });

                console.log("Video client created, joining call...");

                const callInstance = videoClient.call("default", callId);

                await callInstance.join({ create: true });

                console.log("Joined call successfully");

                setClient(videoClient);
                setCall(callInstance);
                setHasError(false);
                clearTimeout(errorTimer); // Clear error timer on success
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

        // Cleanup function
        return () => {
            clearTimeout(errorTimer);
            if (call) {
                call.leave().catch(console.error);
            }
            if (client) {
                client.disconnectUser().catch(console.error);
            }
        };
    }, [tokenData, authUser, callId, isOpen]);

    const handleClose = async () => {
        try {
            if (call) {
                await call.leave();
            }
            if (client) {
                await client.disconnectUser();
            }
        } catch (error) {
            console.error("Error leaving call:", error);
        } finally {
            setClient(null);
            setCall(null);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center z-50">
            <div className="relative w-full h-full flex flex-col">
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
                        <StreamVideo client={client}>
                            <StreamCall call={call}>
                                <CallContent onLeave={handleClose} authUser={authUser} />
                            </StreamCall>
                        </StreamVideo>
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

const CallContent = ({ onLeave, authUser }) => {
    const { useCallCallingState, useParticipants } = useCallStateHooks();
    const callingState = useCallCallingState();
    const participants = useParticipants();

    useEffect(() => {
        if (callingState === CallingState.LEFT) {
            onLeave();
        }
    }, [callingState, onLeave]);

    return (
        <StreamTheme className="w-full h-full">
            <div className="flex flex-col h-full bg-gray-900">
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
                <div className="bg-gradient-to-t from-black/80 to-transparent pb-6 pt-8">
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
