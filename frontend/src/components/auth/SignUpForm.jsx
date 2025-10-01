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
    const [batch, setBatch] = useState("")
    const [course, setCourse] = useState("")

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

    const handleSignUp = (e) => {
      e.preventDefault();

      signUpMutation({ name, username, email, password, batch, course })
    }
    return (
      <form onSubmit={handleSignUp} className="flex flex-col gap-4">
          <input 
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input input-bordered w-full"
            required />
          <input 
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input input-bordered w-full"
            required />
          <input 
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input input-bordered w-full"
            required />
          <input 
            type="password"
            placeholder="Password (6+ characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input input-bordered w-full"
            required />
          <input 
            type="number"
            placeholder="Batch Year (e.g., 2023)"
            value={batch}
            onChange={(e) => setBatch(e.target.value)}
            className="input input-bordered w-full"
            min="1900"
            max="2030"
            required />
          <select 
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            className="select select-bordered w-full"
            required>
            <option value="">Select Course *</option>
            <option value="BSIT">BSIT - Bachelor of Science in Information Technology</option>
            <option value="BSCS">BSCS - Bachelor of Science in Computer Science</option>
            <option value="BSCPE">BSCPE - Bachelor of Science in Computer Engineering</option>
            <option value="BSEE">BSEE - Bachelor of Science in Electrical Engineering</option>
            <option value="BSME">BSME - Bachelor of Science in Mechanical Engineering</option>
            <option value="BSCE">BSCE - Bachelor of Science in Civil Engineering</option>
            <option value="BSBA">BSBA - Bachelor of Science in Business Administration</option>
            <option value="BSA">BSA - Bachelor of Science in Accountancy</option>
            <option value="BSED">BSED - Bachelor of Science in Education</option>
            <option value="BSN">BSN - Bachelor of Science in Nursing</option>
            <option value="Other">Other</option>
          </select>
          
          <button type="submit" disabled={isLoading} className="btn btn-primary w-full text-white">
            { isLoading ? <Loader className="size-5 animate-spin" /> : "Agree & Join" }
          </button>
      </form>
    )
}

export default SignUpForm