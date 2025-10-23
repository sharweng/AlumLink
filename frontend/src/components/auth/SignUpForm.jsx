import { useState } from "react"
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

    const queryClient = useQueryClient()

    const { mutate: signUpMutation, isLoading } = useMutation({
      mutationFn: async(data) => {
        const res = await axiosInstance.post("/auth/signup", data)
        return res.data
      },
      onSuccess:() => {
        toast.success("Account created successfully")
        queryClient.invalidateQueries({ queryKey: ["authUser"] })
      },
      onError:(error) => {
        toast.error(error.response.data.message || "Failed to create an account")
      },
    })

    const validate = () => {
      const newErrors = {};
      if (!name) newErrors.name = "Full name is required";
      if (!username) newErrors.username = "Username is required";
      if (!email) newErrors.email = "Email is required";
      if (!password) newErrors.password = "Password is required";
      if (!confirmPassword) newErrors.confirmPassword = "Confirm password is required";
      if (!tuptId) newErrors.tuptId = "TUPT-ID is required";
      if (password.length < 6) newErrors.password = "Password must be at least 6 characters";
      if (password !== confirmPassword) newErrors.confirmPassword = "Passwords do not match";
      if (tuptId && !/^TUPT-\d{2}-\d{4}$/.test(tuptId)) newErrors.tuptId = "TUPT-ID format must be TUPT-XX-XXXX";
      return newErrors;
    };

    const handleSignUp = (e) => {
      e.preventDefault();
      const newErrors = validate();
      setErrors(newErrors);
      if (Object.keys(newErrors).length > 0) return;
      // Extract batch from TUPT-ID
      const batch = tuptId ? `20${tuptId.slice(5,7)}` : "";
      signUpMutation({ name, username, email, password, confirmPassword, tuptId, batch, course: "BSIT" });
    }
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

export default SignUpForm