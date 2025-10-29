import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import { axiosInstance } from "../../lib/axios"
import { toast } from "react-hot-toast"
import { Loader } from "lucide-react"
import { useNavigate } from "react-router-dom"


const LoginForm = () => {
    const [identifier, setIdentifier] = useState(""); // can be username or email
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState({});
    const [showForgot, setShowForgot] = useState(false);
    const [forgotStep, setForgotStep] = useState("none"); // none | email | code | reset | done
    const [forgotEmail, setForgotEmail] = useState("");
    const [forgotError, setForgotError] = useState("");
    const [forgotLoading, setForgotLoading] = useState(false);
    const [resetCode, setResetCode] = useState("");
    const [resetCodeError, setResetCodeError] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");
    const [resetPasswordError, setResetPasswordError] = useState("");
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const { mutate: loginMutation, isLoading } = useMutation({
        mutationFn: (userData) => axiosInstance.post("/auth/login", userData),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["authUser"] });
            // After login, fetch the user and redirect if admin/superAdmin
            const res = await axiosInstance.get("/auth/me");
            const user = res.data;
            if (user?.permission === 'admin' || user?.permission === 'superAdmin') {
                navigate('/admin/dashboard', { replace: true });
            } else {
                navigate('/', { replace: true });
            }
        },
        onError: (error) => {
            const msg = error.response?.data?.message || "Failed to login user";
            toast.error(msg);
            if (msg.toLowerCase().includes("invalid credentials")) {
                setShowForgot(true);
            }
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        const newErrors = {};
        if (!identifier) newErrors.identifier = "Email or Username is required";
        if (!password) newErrors.password = "Password is required";
        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;
        loginMutation({ identifier, password });
    };

    // Forgot password flow
    const handleForgotPassword = () => {
        setForgotStep("email");
        setForgotEmail("");
        setForgotError("");
    };

    const handleForgotEmailSubmit = async (e) => {
        e.preventDefault();
        setForgotError("");
        setForgotLoading(true);
        try {
            // Check if email exists and send reset code
            await axiosInstance.post("/auth/request-password-reset", { email: forgotEmail });
            setForgotStep("code");
        } catch (err) {
            setForgotError(err.response?.data?.message || "Failed to send reset code");
        }
        setForgotLoading(false);
    };

    const handleVerifyCode = async (e) => {
        e.preventDefault();
        setResetCodeError("");
        setForgotLoading(true);
        try {
            await axiosInstance.post("/auth/verify-reset-code", { email: forgotEmail, code: resetCode });
            setForgotStep("reset");
        } catch (err) {
            setResetCodeError(err.response?.data?.message || "Invalid or expired code");
        }
        setForgotLoading(false);
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setResetPasswordError("");
        if (!newPassword || !confirmNewPassword) {
            setResetPasswordError("Both fields are required");
            return;
        }
        if (newPassword.length < 6) {
            setResetPasswordError("Password must be at least 6 characters");
            return;
        }
        if (newPassword !== confirmNewPassword) {
            setResetPasswordError("Passwords do not match");
            return;
        }
        setForgotLoading(true);
        try {
            await axiosInstance.post("/auth/reset-password", { email: forgotEmail, code: resetCode, newPassword });
            setForgotStep("done");
        } catch (err) {
            setResetPasswordError(err.response?.data?.message || "Failed to reset password");
        }
        setForgotLoading(false);
    };


    // Main login form
    return (
        <div className="w-full max-w-md">
            <form onSubmit={handleSubmit} className='space-y-4'>
                <input
                    type='text'
                    placeholder='Email or Username'
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className='input input-bordered w-full'
                />
                {errors.identifier && <span className='text-red-500 text-xs'>{errors.identifier}</span>}
                <input
                    type='password'
                    placeholder='Password'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className='input input-bordered w-full'
                />
                {errors.password && <span className='text-red-500 text-xs'>{errors.password}</span>}

                <button type='submit' className='btn btn-primary w-full'>
                    {isLoading ? <Loader className='size-5 animate-spin' /> : "Login"}
                </button>
                {showForgot && (
                    <button
                        type="button"
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-red-600 bg-white hover:bg-gray-50 mt-2"
                        onClick={handleForgotPassword}
                    >
                        Forgot Password?
                    </button>
                )}
            </form>

            {/* Forgot password modal */}
            {forgotStep !== "none" && (
                <div className="fixed z-[100] inset-0 flex items-center justify-center min-h-screen px-4">
                    <div className="fixed inset-0 bg-black opacity-40" style={{zIndex:101}} onClick={() => setForgotStep("none")}/>
                    <div className="bg-white rounded-lg max-w-md mx-auto p-6 z-[102] relative shadow-lg w-full">
                        {forgotStep === "email" && (
                            <form onSubmit={handleForgotEmailSubmit} className="space-y-4">
                                <div className="font-bold text-lg mb-2">Forgot Password</div>
                                <input
                                    type="email"
                                    placeholder="Enter your TUP email"
                                    value={forgotEmail}
                                    onChange={e => setForgotEmail(e.target.value)}
                                    className="input input-bordered w-full"
                                    required
                                />
                                {forgotError && <span className="text-red-500 text-xs">{forgotError}</span>}
                                <button type="submit" className="btn btn-primary w-full" disabled={forgotLoading}>
                                    {forgotLoading ? <Loader className="size-5 animate-spin" /> : "Send Verification Code"}
                                </button>
                                <button
                                    type="button"
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-red-600 bg-white hover:bg-gray-50 mt-2"
                                    onClick={() => setForgotStep("none")}
                                >
                                    Back to Login
                                </button>
                            </form>
                        )}
                        {forgotStep === "code" && (
                            <form onSubmit={handleVerifyCode} className="space-y-4">
                                <div className="font-bold text-lg mb-2">Enter Verification Code</div>
                                <input
                                    type="text"
                                    placeholder="6-digit code"
                                    value={resetCode}
                                    onChange={e => setResetCode(e.target.value)}
                                    className="input input-bordered w-full text-center"
                                    maxLength={6}
                                    required
                                />
                                {resetCodeError && <span className="text-red-500 text-xs">{resetCodeError}</span>}
                                <button type="submit" className="btn btn-primary w-full" disabled={forgotLoading}>
                                    {forgotLoading ? <Loader className="size-5 animate-spin" /> : "Verify Code"}
                                </button>
                                <button
                                    type="button"
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-red-600 bg-white hover:bg-gray-50 mt-2"
                                    onClick={() => setForgotStep("email")}
                                >
                                    Back
                                </button>
                            </form>
                        )}
                        {forgotStep === "reset" && (
                            <form onSubmit={handleResetPassword} className="space-y-4">
                                <div className="font-bold text-lg mb-2">Set New Password</div>
                                <input
                                    type="password"
                                    placeholder="New Password"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    className="input input-bordered w-full"
                                    minLength={6}
                                    required
                                />
                                <input
                                    type="password"
                                    placeholder="Confirm New Password"
                                    value={confirmNewPassword}
                                    onChange={e => setConfirmNewPassword(e.target.value)}
                                    className="input input-bordered w-full"
                                    minLength={6}
                                    required
                                />
                                {resetPasswordError && <span className="text-red-500 text-xs">{resetPasswordError}</span>}
                                <button type="submit" className="btn btn-primary w-full" disabled={forgotLoading}>
                                    {forgotLoading ? <Loader className="size-5 animate-spin" /> : "Change Password"}
                                </button>
                            </form>
                        )}
                        {forgotStep === "done" && (
                            <div className="space-y-4 flex flex-col items-center">
                                <div className="font-bold text-lg mb-2 text-black">Password changed successfully!</div>
                                <button
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-red-600 bg-white hover:bg-gray-50 mt-2"
                                    onClick={() => {
                                        setForgotStep("none");
                                        setShowForgot(false);
                                        setIdentifier("");
                                        setPassword("");
                                    }}
                                >
                                    Back to Login
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LoginForm