import { useState, useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { axiosInstance } from "../../lib/axios"
import { toast } from "react-hot-toast"
import { Loader } from "lucide-react"

const SignUpForm = () => {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [tuptId, setTuptId] = useState("");
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState("signup");
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(60);
  const [resendLoading, setResendLoading] = useState(false);
    // Resend code handler
    const handleResendCode = async () => {
      setResendLoading(true);
      try {
        await axiosInstance.post("/auth/signup", { name, username, email, password, confirmPassword, tuptId, batch: tuptId ? `20${tuptId.slice(5,7)}` : "", course: "BSIT", resend: true });
        toast.success("Verification code sent again!");
        setResendCooldown(60);
      } catch (err) {
        toast.error("Failed to resend code");
      }
      setResendLoading(false);
    };

    // Cooldown timer effect
    useEffect(() => {
      if (step === "verify" && resendCooldown > 0) {
        const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
        return () => clearTimeout(timer);
      }
    }, [resendCooldown, step]);

    const queryClient = useQueryClient()

    const { mutate: signUpMutation, isLoading } = useMutation({
      mutationFn: async(data) => {
        const res = await axiosInstance.post("/auth/signup", data)
        return res.data
      },
      onSuccess:(data) => {
        if (data.message?.includes("Verification code sent")) {
          setStep("verify");
          toast.success("Verification code sent to your email");
        } else {
          toast.success("Account created successfully");
          queryClient.invalidateQueries({ queryKey: ["authUser"] });
        }
      },
      onError:(error) => {
        toast.error(error.response?.data?.message || "Failed to create an account")
      },
    })

    const { mutate: verifyCodeMutation, isLoading: isVerifying } = useMutation({
      mutationFn: async(data) => {
        const res = await axiosInstance.post("/auth/verify-signup-code", data)
        return res.data
      },
      onSuccess:(data) => {
        toast.success("Account verified and created!");
        setStep("done");
        queryClient.invalidateQueries({ queryKey: ["authUser"] });
      },
      onError:(error) => {
        setCodeError(error.response?.data?.message || "Verification failed");
      },
    })
    const validate = () => {
      const newErrors = {};
      if (!name) newErrors.name = "Full name is required";
      if (!username) newErrors.username = "Username is required";
      if (!email) newErrors.email = "Email is required";
      else if (!/^\S+@\S+\.\S+$/.test(email)) newErrors.email = "Enter a valid email address";
      if (!password) newErrors.password = "Password is required";
      if (!confirmPassword) newErrors.confirmPassword = "Confirm password is required";
      if (!tuptId) newErrors.tuptId = "TUPT-ID is required";
      if (password.length < 6) newErrors.password = "Password must be at least 6 characters";
      if (password !== confirmPassword) newErrors.confirmPassword = "Passwords do not match";
      if (tuptId && !/^TUPT-\d{2}-\d{4}$/.test(tuptId)) newErrors.tuptId = "TUPT-ID format must be TUPT-XX-XXXX";
      return newErrors;
    };

    const handleSignUp = async (e) => {
      e.preventDefault();
      const newErrors = validate();
      setErrors(newErrors);
      if (Object.keys(newErrors).length > 0) return;
      // Extract batch from TUPT-ID
      const batch = tuptId ? `20${tuptId.slice(5,7)}` : "";
      try {
        await signUpMutation({ name, username, email, password, confirmPassword, tuptId, batch, course: "BSIT" });
      } catch (err) {
        if (err?.response?.data?.message?.includes("Email already in use")) {
          setErrors(prev => ({ ...prev, email: "Email already exists" }));
        }
      }
    }
    if (step === "signup") {
      return (
        <form onSubmit={handleSignUp} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <input 
                type="text"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input input-bordered w-full"
              />
              {errors.name && <span className="text-red-500 text-xs mt-1">{errors.name}</span>}
            </div>
            <div className="flex flex-col gap-1">
              <input 
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input input-bordered w-full"
              />
              {errors.username && <span className="text-red-500 text-xs mt-1">{errors.username}</span>}
            </div>
            <div className="flex flex-col gap-1">
              <input 
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input input-bordered w-full"
              />
              {errors.email && <span className="text-red-500 text-xs mt-1">{errors.email}</span>}
            </div>
            <div className="flex flex-col gap-1">
              <input 
                type="password"
                placeholder="Password (6+ characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input input-bordered w-full"
                minLength="6"
              />
              {errors.password && <span className="text-red-500 text-xs mt-1">{errors.password}</span>}
            </div>
            <div className="flex flex-col gap-1">
              <input 
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input input-bordered w-full"
                minLength="6"
              />
              {errors.confirmPassword && <span className="text-red-500 text-xs mt-1">{errors.confirmPassword}</span>}
            </div>
            <div className="flex flex-col gap-1">
              <input 
                type="text"
                placeholder="TUPT-ID (TUPT-XX-XXXX)"
                value={tuptId}
                onChange={(e) => setTuptId(e.target.value)}
                className="input input-bordered w-full"
              />
              {errors.tuptId && <span className="text-red-500 text-xs mt-1">{errors.tuptId}</span>}
            </div>
            <button type="submit" disabled={isLoading} className="btn btn-primary w-full text-white">
              { isLoading ? <Loader className="size-5 animate-spin" /> : "Agree & Join" }
            </button>
        </form>
      )
    }
    if (step === "verify") {
      return (
        <form onSubmit={e => { e.preventDefault(); verifyCodeMutation({ email, code }); }} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="code" className="font-semibold">Enter the verification code sent to your email:</label>
            <input
              type="text"
              id="code"
              value={code}
              onChange={e => { setCode(e.target.value); setCodeError(""); }}
              className="input input-bordered w-full"
              maxLength={6}
              autoFocus
            />
            {codeError && <span className="text-red-500 text-xs mt-1">{codeError}</span>}
          </div>
          <button type="submit" disabled={isVerifying} className="btn btn-primary w-full text-white">
            { isVerifying ? <Loader className="size-5 animate-spin" /> : "Verify & Complete Registration" }
          </button>
          <button
            type="button"
            className={`btn btn-outline w-full mt-2 ${resendCooldown > 0 || resendLoading ? 'btn-disabled' : ''}`}
            onClick={handleResendCode}
            disabled={resendCooldown > 0 || resendLoading}
          >
            {resendLoading
              ? <Loader className="size-4 animate-spin" />
              : resendCooldown > 0
                ? `Send verification code again (${resendCooldown}s)`
                : "Send verification code again"}
          </button>
        </form>
      )
    }
    if (step === "done") {
      return (
        <div className="flex flex-col gap-4 items-center justify-center py-8">
          <h2 className="text-xl font-bold text-green-600">Account created and verified!</h2>
          <p>You can now log in and start using AlumniLink.</p>
        </div>
      )
    }
}

export default SignUpForm