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

        const initCall = async () => {
            if (!tokenData?.token || !authUser || !callId) {
                console.log("Missing required data:", {
                    hasToken: !!tokenData?.token,
                    hasAuthUser: !!authUser,
                    hasCallId: !!callId
                });
                setIsConnecting(false);
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
            } catch (error) {
                console.error("Error joining call:", error);
                console.error("Error message:", error.message);
                console.error("Error stack:", error.stack);
                toast.error(`Could not join the call: ${error.message}`);
            } finally {
                setIsConnecting(false);
            }
        };

        initCall();

        // Cleanup function
        return () => {
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
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
            <div className="relative w-full h-full flex flex-col">
                {/* Header */}
                <div className="absolute top-4 right-4 z-50">
                    <button
                        onClick={handleClose}
                        className="bg-red-600 text-white p-3 rounded-full hover:bg-red-700 transition shadow-lg"
                        title="Leave Call"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Video Call Content */}
                <div className="flex-1 flex items-center justify-center">
                    {tokenLoading || isConnecting ? (
                        <div className="text-white text-center">
                            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
                            <p className="text-lg">Connecting to video call...</p>
                        </div>
                    ) : client && call ? (
                        <StreamVideo client={client}>
                            <StreamCall call={call}>
                                <CallContent onLeave={handleClose} />
                            </StreamCall>
                        </StreamVideo>
                    ) : (
                        <div className="text-white text-center">
                            <p className="text-xl mb-4">Could not initialize call</p>
                            <button
                                onClick={handleClose}
                                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
                            >
                                Close
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const CallContent = ({ onLeave }) => {
    const { useCallCallingState } = useCallStateHooks();
    const callingState = useCallCallingState();

    useEffect(() => {
        if (callingState === CallingState.LEFT) {
            onLeave();
        }
    }, [callingState, onLeave]);

    return (
        <StreamTheme className="w-full h-full">
            <div className="flex flex-col h-full">
                <div className="flex-1">
                    <SpeakerLayout />
                </div>
                <div className="pb-4">
                    <CallControls />
                </div>
            </div>
        </StreamTheme>
    );
};

export default VideoCallModal;
