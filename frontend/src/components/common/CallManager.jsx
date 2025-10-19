import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSocket } from "../../contexts/SocketContext";
import CallInvitationModal from "../mentorship/CallInvitationModal";
import VideoCallModal from "../mentorship/VideoCallModal";
import { axiosInstance } from "../../lib/axios";

const CallManager = () => {
    const [showInvitationModal, setShowInvitationModal] = useState(false);
    const [invitationCallId, setInvitationCallId] = useState(null);
    const [isCaller, setIsCaller] = useState(false);
    const [otherUserForCall, setOtherUserForCall] = useState(null);
    const [showCallModal, setShowCallModal] = useState(false);
    const [callId, setCallId] = useState(null);
    const [otherUserForVideo, setOtherUserForVideo] = useState(null);
    const [showCallEndedModal, setShowCallEndedModal] = useState(false);
    const [endedCallId, setEndedCallId] = useState(null);
    const [endedOtherUser, setEndedOtherUser] = useState(null);
    const { socket } = useSocket();

    const { data: authUser } = useQuery({
        queryKey: ['authUser'],
        queryFn: async () => {
            const res = await axiosInstance.get("/auth/me");
            return res.data;
        },
        staleTime: Infinity,
    });

    const { data: conversations } = useQuery({
        queryKey: ['conversations'],
        queryFn: async () => {
            const res = await axiosInstance.get('/messages/conversations');
            return res.data;
        },
        enabled: !!authUser,
        staleTime: 0,
    });

    useEffect(() => {
        if (!socket || !authUser) return;

        let incomingCallTimeout;
        const handleIncomingCall = ({ callId, callerId, callerName, callerProfilePicture, otherUser }) => {
            // Always close any open invitation or no-response modal before opening a new one
            setShowCallEndedModal(false);
            setShowInvitationModal(false);
            clearTimeout(incomingCallTimeout);
            incomingCallTimeout = setTimeout(() => {
                setEndedCallId(null);
                setEndedOtherUser(null);
                const conversation = conversations?.find(conv =>
                    conv.participants.some(p => p._id === callerId)
                );
                if (conversation || otherUser) {
                    setInvitationCallId(callId);
                    setIsCaller(false);
                    setOtherUserForCall(otherUser || { _id: callerId, name: callerName, profilePicture: callerProfilePicture });
                    setShowInvitationModal(true);
                }
            }, 120);
        };

        const handleStartVideoCall = ({ callId, otherUser }) => {
            setShowInvitationModal(false);
            setCallId(callId);
            // Find the other user from conversations or use provided otherUser
            if (conversations) {
                const conversation = conversations.find(conv =>
                    `conversation-${conv._id}` === callId
                );
                if (conversation) {
                    const otherUserFromConv = conversation.participants.find(p => p._id !== authUser._id);
                    setOtherUserForVideo(otherUserFromConv);
                } else if (otherUser) {
                    setOtherUserForVideo(otherUser);
                }
            } else if (otherUser) {
                setOtherUserForVideo(otherUser);
            }
            setShowCallModal(true);
        };

        const handleCallEnded = ({ callId }) => {
            setShowCallModal(false);
            setCallId(null);
            setOtherUserForVideo(null);
            setShowCallEndedModal(true);
            setEndedCallId(callId);
            // Find the other user from conversations
            if (conversations) {
                const conversation = conversations.find(conv =>
                    `conversation-${conv._id}` === callId
                );
                if (conversation) {
                    const otherUser = conversation.participants.find(p => p._id !== authUser._id);
                    setEndedOtherUser(otherUser);
                }
            }
        };

        socket.on('incoming-call', handleIncomingCall);
        socket.on('start-video-call', handleStartVideoCall);
        socket.on('call-ended', handleCallEnded);

        return () => {
            socket.off('incoming-call', handleIncomingCall);
            socket.off('start-video-call', handleStartVideoCall);
            socket.off('call-ended', handleCallEnded);
        };
    }, [socket, authUser]);

    const handleCallAgain = () => {
        if (endedOtherUser && socket) {
            const callId = `${endedCallId.split('-')[0]}-${Date.now()}`; // Generate new callId with same base
            setShowCallEndedModal(false);
            setEndedCallId(null);
            setEndedOtherUser(null);
            socket.emit('call-invite', {
                callId,
                recipientId: endedOtherUser._id,
                callerId: authUser._id,
                callerName: authUser.name,
                callerProfilePicture: authUser.profilePicture,
                otherUser: endedOtherUser
            });
            // Show outgoing call modal for the caller
            setInvitationCallId(callId);
            setIsCaller(true);
            setOtherUserForCall(endedOtherUser);
            setShowInvitationModal(true);
        }
    };

    const handleCloseEndedModal = () => {
        setShowCallEndedModal(false);
        setEndedCallId(null);
        setEndedOtherUser(null);
    };

    const handleCloseInvitation = () => {
        setShowInvitationModal(false);
        setInvitationCallId(null);
        setIsCaller(false);
        setOtherUserForCall(null);
    };

    const handleAcceptCall = () => {
        setCallId(invitationCallId);
        setOtherUserForVideo(otherUserForCall);
        setShowCallModal(true);
        setShowInvitationModal(false);
        setInvitationCallId(null);
        setIsCaller(false);
        setOtherUserForCall(null);
    };

    const handleCloseCall = () => {
        setShowCallModal(false);
        setCallId(null);
        setOtherUserForVideo(null);
    };

    return (
        <>
            {/* Call invitation modal */}
            <CallInvitationModal
                isOpen={showInvitationModal}
                onClose={handleCloseInvitation}
                callId={invitationCallId}
                authUser={authUser}
                isCaller={isCaller}
                otherUser={otherUserForCall}
                onAccept={handleAcceptCall}
                socket={socket}
            />

            {/* Video call modal */}
            <VideoCallModal
                isOpen={showCallModal}
                onClose={handleCloseCall}
                callId={callId}
                authUser={authUser}
                otherUser={otherUserForVideo}
            />

            {/* Call ended modal */}
            {showCallEndedModal && (
                <div className="fixed inset-0 bg-[#071026] flex items-center justify-center z-50">
                    <div className="text-white text-center rounded-2xl p-8 max-w-md mx-4">
                        <h2 className="text-xl font-semibold mb-2">The call ended</h2>
                        <p className="text-gray-400 mb-6">Would you like to call again?</p>
                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={handleCallAgain}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                            >
                                Call Again
                            </button>
                            <button
                                onClick={handleCloseEndedModal}
                                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default CallManager;