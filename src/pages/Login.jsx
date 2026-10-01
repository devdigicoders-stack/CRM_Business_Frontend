import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { loginUser } from '../api/authApi';

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        
        if (!email || !password) {
            toast.error("Please enter email and password");
            return;
        }

        setLoading(true);
        try {
            const data = await loginUser({ email, password });
            
            // Assuming token is returned in data.token
            if (data.token) {
                localStorage.setItem('token', data.token);
                toast.success("Login Successful!");
                navigate('/dashboard'); // Redirect to dashboard
            } else {
                toast.error("Login failed. Please check credentials.");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Something went wrong. Try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen w-full bg-white font-sans flex-row-reverse">
            
            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center px-4 sm:px-8 relative">
                
                <div className="w-full max-w-md bg-white p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-none border border-gray-100">
                    {/* Centered Logo */}
                    <div className="flex justify-center mb-6">
                        <img src="/logo.png" alt="CRM Pro" className="h-28 w-auto object-contain" />
                    </div>

                    <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">Welcome Back</h2>
                    <p className="text-gray-500 mb-8 text-center">Login to your account</p>

                    <form onSubmit={handleLogin} className="space-y-5">
                        
                        {/* Email Input */}
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-gray-400" />
                            </div>
                            <input 
                                type="email" 
                                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm text-gray-900 bg-white" 
                                placeholder="Email Address" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        {/* Password Input */}
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input 
                                type={showPassword ? "text" : "password"} 
                                className="block w-full pl-10 pr-10 py-3 border border-gray-200 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm text-gray-900 bg-white" 
                                placeholder="Password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer" onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" /> : <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />}
                            </div>
                        </div>

                        {/* Remember me & Forgot Password */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input id="remember-me" type="checkbox" className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded" />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 font-medium">
                                    Remember me
                                </label>
                            </div>
                            <div className="text-sm">
                                <a href="#" className="font-semibold text-emerald-600 hover:text-emerald-500">
                                    Forgot password?
                                </a>
                            </div>
                        </div>

                        {/* Sign In Button */}
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-[#0f4d38] hover:bg-[#0b3a2c] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
                        >
                            {loading ? "Signing in..." : "Sign In"}
                        </button>
                    </form>

                    <p className="mt-10 text-center text-sm text-gray-500">
                        Don't have an account? <a href="#" className="font-semibold text-emerald-600 hover:text-emerald-500">Contact Admin</a>
                    </p>
                </div>
            </div>

            {/* Right Side - Image Section */}
            <div className="hidden lg:flex w-1/2 bg-[#f0f9f6] items-center justify-center relative overflow-hidden">
                <div className="w-full h-full p-12 flex flex-col items-center justify-center relative z-10">
                    <img 
                        src="/image.png" 
                        alt="CRM Dashboard Preview" 
                        className="max-w-[80%] max-h-[60vh] object-contain drop-shadow-2xl"
                    />
                    <div className="text-center mt-12 max-w-md">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">Streamline Your Business with CRM</h2>
                        <p className="text-gray-600 text-lg">
                            Manage leads, customers, deals and teams in one powerful platform.
                        </p>
                    </div>
                    
                    {/* Carousel Dots Placeholder */}
                    <div className="flex gap-2 mt-8">
                        <div className="w-2 h-2 rounded-full bg-emerald-600"></div>
                        <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                        <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                    </div>
                </div>
                
                {/* Background decorative shapes */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100 rounded-bl-full opacity-50 z-0"></div>
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-100 rounded-tr-full opacity-50 z-0"></div>
            </div>

        </div>
    );
};

export default Login;
