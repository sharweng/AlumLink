import { useState, useEffect } from "react"
// Removed Headless UI Dialog, using plain modal markup
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { axiosInstance } from "../../lib/axios"
import { toast } from "react-hot-toast"
import { Loader } from "lucide-react"

const SignUpForm = () => {
  // Remove Full Name field, auto-generate from email
  const [name, setName] = useState("");
  const [showNameModal, setShowNameModal] = useState(false);
  const [editableName, setEditableName] = useState("");
  const [email, setEmail] = useState("")
  const [showTuptIdError, setShowTuptIdError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [reportMessage, setReportMessage] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [tuptId, setTuptId] = useState("");
  const [course, setCourse] = useState("");
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
        const msg = error.response?.data?.message || "Failed to create an account";
        if (msg.includes("TUPT-ID already in use")) {
          setShowTuptIdError(true);
          setErrors(prev => ({ ...prev, tuptId: "TUPT-ID already exists" }));
        } else if (msg.includes("Email already in use")) {
          setErrors(prev => ({ ...prev, email: "Email already exists" }));
        } else {
          toast.error(msg);
        }
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
      // Name is now auto-generated and required after modal
      if (!username) newErrors.username = "Username is required";
      else if (/\s/.test(username)) newErrors.username = "Username cannot contain spaces";
  if (!email) newErrors.email = "Email is required";
  if (!course) newErrors.course = "Course is required";
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

      // Check for existing email, username, tuptId before showing name modal
      try {
        const checkRes = await axiosInstance.post("/auth/signup", {
          name: "_dummy_", // dummy, will not be used
          username,
          email,
          password,
          confirmPassword,
          tuptId,
          batch: tuptId ? `20${tuptId.slice(5,7)}` : "",
          course,
          resend: true // so backend doesn't actually create/send code
        });
        // If we get here, no error, so proceed to name modal
      } catch (err) {
        const msg = err.response?.data?.message || "Failed to create an account";
        if (msg.includes("TUPT-ID already in use")) {
          setShowTuptIdError(true);
          setErrors(prev => ({ ...prev, tuptId: "TUPT-ID already exists" }));
        } else if (msg.includes("Email already in use")) {
          setErrors(prev => ({ ...prev, email: "Email already exists" }));
        } else if (msg.includes("Username already in use")) {
          setErrors(prev => ({ ...prev, username: "Username already exists" }));
        } else {
          toast.error(msg);
        }
        return;
      }
      // If TUP email, auto-generate name and show space-edit modal. Otherwise, show free-form name modal.
      let autoName = "";
      if (/^[^@]+@tup\.edu\.ph$/.test(email)) {
        const emailName = email.replace(/@tup\.edu\.ph$/, "");
        autoName = emailName.replace(/\./g, " ");
        autoName = autoName.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
        setEditableName(autoName);
        setShowNameModal("tup");
      } else {
        setEditableName("");
        setShowNameModal("personal");
      }
    };

    // Only allow user to add/delete spaces in the TUP modal, allow any edit in personal modal
    const handleNameEdit = (e) => {
      if (showNameModal === "tup") {
        const oldVal = editableName;
        const newVal = e.target.value;
        // Only allow changes that are adding/removing spaces
        if (newVal.replace(/ /g,"") !== oldVal.replace(/ /g,"")) return;
        setEditableName(newVal);
      } else {
        setEditableName(e.target.value);
      }
    };

    const handleNameModalDone = async () => {
      let finalName = editableName;
      if (showNameModal === "tup") {
        // Capitalize each word, remove extra spaces
        finalName = editableName.split(" ").filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      } else {
        // For personal, trim and collapse spaces, capitalize each word
        finalName = editableName.trim().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      }
      setName(finalName);
      setShowNameModal(false);
      // Continue signup with generated/edited name
      const batch = tuptId ? `20${tuptId.slice(5,7)}` : "";
      try {
        await signUpMutation({ name: finalName, username, email, password, confirmPassword, tuptId, batch, course });
      } catch (err) {
        if (err?.response?.data?.message?.includes("TUPT-ID already in use")) {
          setShowTuptIdError(true);
        }
        if (err?.response?.data?.message?.includes("Email already in use")) {
          setErrors(prev => ({ ...prev, email: "Email already exists" }));
        }
      }
    };
    if (step === "signup") {
      return (
        <>
          {showTuptIdError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 flex flex-col items-start">
              <span className="font-bold">TUPT-ID already exists</span>
              <span>If you think this is wrong, contact the admin.</span>
              <button className="mt-2 btn btn-sm btn-outline btn-error" onClick={() => setModalOpen(true)}>Contact Admin</button>
            </div>
          )}
          <form onSubmit={handleSignUp} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <input 
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => {
                  // Prevent spaces in username
                  const val = e.target.value;
                  if (/\s/.test(val)) return;
                  setUsername(val);
                }}
                className="input input-bordered w-full"
                autoComplete="off"
              />
              {errors.username && <span className="text-red-500 text-xs mt-1">{errors.username}</span>}
            </div>
            <div className="flex flex-col gap-1">
              <input 
                type="email"
                id="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors(prev => ({ ...prev, email: undefined }));
                }}
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
                placeholder="Course (e.g. BSIT)"
                value={course}
                onChange={e => setCourse(e.target.value)}
                className="input input-bordered w-full"
              />
              {errors.course && <span className="text-red-500 text-xs mt-1">{errors.course}</span>}
            </div>
            <div className="flex flex-col gap-1">
              <input 
                type="text"
                placeholder="TUPT-ID (TUPT-XX-XXXX)"
                value={tuptId}
                onChange={(e) => {
                  setTuptId(e.target.value);
                  setErrors(prev => ({ ...prev, tuptId: undefined }));
                }}
                className="input input-bordered w-full"
              />
              {errors.tuptId && <span className="text-red-500 text-xs mt-1">{errors.tuptId}</span>}
            </div>
            <button type="submit" disabled={isLoading} className="btn btn-primary w-full text-white">
              { isLoading ? <Loader className="size-5 animate-spin" /> : "Agree & Join" }
            </button>
          </form>
          {modalOpen && (
            <div className="fixed z-10 inset-0 flex items-center justify-center min-h-screen px-4">
              <div className="fixed inset-0 bg-black opacity-30" onClick={() => setModalOpen(false)} />
              <div className="bg-white rounded-lg max-w-md mx-auto p-6 z-20 relative shadow-lg">
                <div className="text-lg font-bold mb-2">Report TUPT-ID Issue</div>
                <div className="mb-4">Describe your issue and the admin will review it.</div>
                <textarea
                  className="textarea textarea-bordered w-full mb-4"
                  rows={4}
                  placeholder="Describe the problem..."
                  value={reportMessage}
                  onChange={e => setReportMessage(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                  <button className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
                  <button
                    className="btn btn-primary"
                    disabled={reportLoading || !reportMessage.trim()}
                    onClick={async () => {
                      setReportLoading(true);
                      try {
                        await axiosInstance.post("/reports", {
                          type: "TUPT-ID",
                          tuptId,
                          email,
                          message: reportMessage
                        });
                        toast.success("Report sent to admin");
                        setModalOpen(false);
                        setReportMessage("");
                      } catch (err) {
                        toast.error("Failed to send report");
                      }
                      setReportLoading(false);
                    }}
                  >Send Report</button>
                </div>
              </div>
            </div>
          )}
          {/* Name modal: TUP = space edit, personal = free-form */}
          {showNameModal === "tup" && (
            <div className="fixed z-10 inset-0 flex items-center justify-center min-h-screen px-4">
              <div className="fixed inset-0 bg-black opacity-30" />
              <div className="bg-white rounded-lg max-w-md mx-auto p-6 z-20 relative shadow-lg">
                <div className="text-lg font-bold mb-2">Is your name correct?</div>
                <div className="mb-4">If your name is joined, add spaces to separate. Only spaces are allowed to be added or removed.</div>
                <input
                  className="input input-bordered w-full mb-4 text-center text-lg"
                  value={editableName}
                  onChange={handleNameEdit}
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <button
                    className="btn btn-primary"
                    onClick={handleNameModalDone}
                  >Done</button>
                </div>
              </div>
            </div>
          )}
          {showNameModal === "personal" && (
            <div className="fixed z-10 inset-0 flex items-center justify-center min-h-screen px-4">
              <div className="fixed inset-0 bg-black opacity-30" />
              <div className="bg-white rounded-lg max-w-md mx-auto p-6 z-20 relative shadow-lg">
                <div className="text-lg font-bold mb-2">What is your name?</div>
                <div className="mb-4">Please enter your full name as you want it to appear on your profile.</div>
                <input
                  className="input input-bordered w-full mb-4 text-center text-lg"
                  value={editableName}
                  onChange={handleNameEdit}
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <button
                    className="btn btn-primary"
                    onClick={handleNameModalDone}
                  >Continue</button>
                </div>
              </div>
            </div>
          )}
        </>
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