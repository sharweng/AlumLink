import { useEffect, useState } from "react";
import { X, UserCheck, UserX } from "lucide-react";
import toast from "react-hot-toast";

const CallInvitationModal = ({ isOpen, onClose, callId, authUser, isCaller, otherUser, onAccept, socket }) => {
    const [timeLeft, setTimeLeft] = useState(15);
    const [callStatus, setCallStatus] = useState('calling'); // 'calling', 'declined', 'no-response'

    useEffect(() => {
        if (!isOpen) return;

        setCallStatus('calling'); // Reset status when modal opens
        if (isCaller) {
            setTimeLeft(15); // Reset timer when modal opens
            const timer = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        handleTimeout();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [isOpen, isCaller]);

    useEffect(() => {
        if (!socket || !isOpen) return;

        // For the caller: open video call modal when recipient accepts
        const handleCallAccepted = ({ callId: acceptedCallId }) => {
            if (acceptedCallId === callId) {
                onAccept();
                onClose();
            }
        };

        // For the recipient: emit start-video-call when accepting
        const handleCallDenied = ({ callId: deniedCallId }) => {
            if (deniedCallId === callId) {
                if (isCaller) {
                    setCallStatus('declined');
                } else {
                    onClose(); // Recipient's modal closes when they decline
                }
            }
        };

        const handleCallCancelled = ({ callId: cancelledCallId }) => {
            if (cancelledCallId === callId && !isCaller) {
                toast.info("Call cancelled by caller");
                onClose();
            }
        };

        socket.on('call-accepted', handleCallAccepted);
        socket.on('call-denied', handleCallDenied);
        socket.on('call-cancelled', handleCallCancelled);
        socket.on('call-timeout', ({ callId: timedOutCallId }) => {
            if (timedOutCallId === callId) {
                setCallStatus('no-response');
            }
        });

        return () => {
            socket.off('call-accepted', handleCallAccepted);
            socket.off('call-denied', handleCallDenied);
            socket.off('call-cancelled', handleCallCancelled);
            socket.off('call-timeout');
        };
    }, [socket, isOpen, callId, isCaller, otherUser, onAccept, onClose]);

    const handleTimeout = () => {
        if (isCaller) {
            socket.emit('call-timeout', { callId, recipientId: otherUser?._id });
            setCallStatus('no-response');
        }
    };

    const handleCancel = () => {
        socket.emit('call-cancel', { callId, recipientId: otherUser?._id });
        onClose();
    };

    const handleCallAgain = () => {
        if (isCaller) {
            setCallStatus('calling');
            setTimeLeft(15);
            socket.emit('call-invite', {
                callId,
                recipientId: otherUser?._id,
                callerId: authUser._id,
                callerName: authUser.name,
                callerProfilePicture: authUser.profilePicture
            });
        }
    };

    const handleCloseModal = () => {
        onClose();
    };

    const handleAccept = () => {
        socket.emit('call-accept', { callId, callerId: otherUser?._id });
        // Recipient emits start-video-call so both sides open video modal
        socket.emit('start-video-call', { callId });
        onAccept();
        onClose();
    };

    const handleDeny = () => {
        socket.emit('call-deny', { callId, callerId: otherUser?._id });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-[#071026] flex items-center justify-center z-50">
            <div className="relative w-full h-full flex flex-col">
                {/* Top gradient overlay */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-black/70 to-transparent z-40"></div>
                {/* Bottom gradient overlay */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/70 to-transparent z-40"></div>

                {/* Header Bar */}
                <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/70 to-transparent">
                    <div className="flex items-center justify-between p-4">
                        <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full animate-pulse ${callStatus === 'calling' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                            <span className="text-white font-medium">
                                {callStatus === 'calling' 
                                    ? (isCaller ? `Calling ${otherUser?.name}` : `Call from ${otherUser?.name}`)
                                    : 'Call Result'
                                }
                            </span>
                        </div>
                        {callStatus === 'calling' && isCaller && (
                            <button
                                onClick={handleCancel}
                                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition shadow-lg flex items-center space-x-2"
                                title="Cancel Call"
                            >
                                <X size={20} />
                                <span className="font-medium">Cancel</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Call Invitation Content */}
                <div className="flex-1 flex items-center justify-center pt-16">
                    <div className="text-white text-center rounded-2xl p-8 max-w-md mx-4">
                        <div className="w-36 h-36 rounded-full mx-auto mb-4 overflow-hidden">
                            <img
                                src={otherUser?.profilePicture || '/avatar.png'}
                                alt={otherUser?.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        {callStatus === 'calling' ? (
                            <>
                                <h2 className="text-xl font-semibold mb-2">
                                    {isCaller ? `Calling ${otherUser?.name}` : `Incoming call from ${otherUser?.name}`}
                                </h2>
                                <p className="text-gray-400 mb-6">
                                    {isCaller ? `Waiting for response... (${timeLeft}s)` : 'Would you like to accept this video call?'}
                                </p>

                                {!isCaller && (
                                    <div className="flex gap-4 justify-center">
                                        <button
                                            onClick={handleDeny}
                                            className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                                        >
                                            <UserX size={20} />
                                            Decline
                                        </button>
                                        <button
                                            onClick={handleAccept}
                                            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                                        >
                                            <UserCheck size={20} />
                                            Accept
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <h2 className="text-xl font-semibold mb-2">
                                    {callStatus === 'declined' ? `${otherUser?.name} declined the call` : isCaller ? `${otherUser?.name} didn't respond to your call` : `You didn't respond to ${otherUser?.name}'s call`}
                                </h2>
                                <p className="text-gray-400 mb-6">
                                    Would you like to try calling again?
                                </p>
                                <div className="flex gap-4 justify-center">
                                    <button
                                        onClick={handleCallAgain}
                                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                                    >
                                        Call Again
                                    </button>
                                    <button
                                        onClick={handleCloseModal}
                                        className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
                                    >
                                        Close
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CallInvitationModal;