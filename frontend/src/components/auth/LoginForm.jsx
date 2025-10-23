import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { axiosInstance } from "../../lib/axios"
import { toast } from "react-hot-toast"

const LoginForm = () => {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [errors, setErrors] = useState({});
    const queryClient = useQueryClient()

    const { mutate: loginMutation, isLoading } = useMutation({
        mutationFn: (userData) => axiosInstance.post("/auth/login", userData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["authUser"] })
        },
        onError: (error) => {
            toast.error(error.response.data.message || "Failed to login user")
        }
    })

    const handleSubmit = (e) => {
        e.preventDefault();
        const newErrors = {};
        if (!username) newErrors.username = "Username is required";
        if (!password) newErrors.password = "Password is required";
        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;
        loginMutation({ username, password });
    }

  return (
    <form onSubmit={handleSubmit} className='space-y-4 w-full max-w-md'>
        <input
            type='text'
            placeholder='Username'
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className='input input-bordered w-full'
        />
        {errors.username && <span className='text-red-500 text-xs'>{errors.username}</span>}
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
    </form>
  )
}

export default LoginForm