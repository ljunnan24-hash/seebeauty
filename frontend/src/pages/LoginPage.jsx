import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useAuthStore } from '../stores/authStore';
import { Eye, EyeOff, Mail, Lock, Sparkles, Heart, Star } from 'lucide-react';

function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm();

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const result = await login(data.email, data.password);
      if (result.success) {
        toast.success('Login successful!');
        navigate('/dashboard');
      } else {
        toast.error(result.error || 'Login failed');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-10 right-10 w-72 h-72 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full shadow-xl">
                <Heart className="h-12 w-12 text-white" />
              </div>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              Welcome Back
            </h2>
            <p className="text-xl text-gray-600">
              Sign in to continue your beauty journey
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-lg shadow-2xl rounded-2xl p-8 border border-white/20">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-purple-500" />
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                  <input
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    type="email"
                    className="pl-12 w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                    placeholder="you@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-2 text-sm text-red-500 flex items-center">
                    <Star className="h-3 w-3 mr-1" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <Lock className="h-4 w-4 mr-2 text-purple-500" />
                  Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                  <input
                    {...register('password', {
                      required: 'Password is required'
                    })}
                    type={showPassword ? 'text' : 'password'}
                    className="pl-12 pr-12 w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-purple-500 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-2 text-sm text-red-500 flex items-center">
                    <Star className="h-3 w-3 mr-1" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember"
                    type="checkbox"
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>

                <Link
                  to="/forgot-password"
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-xl shadow-lg text-lg font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Signing in...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Sign In
                  </>
                )}
              </button>
            </form>

            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white/80 text-gray-500 font-medium">Or continue with</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <button className="w-full inline-flex justify-center items-center py-3 px-4 border-2 border-gray-200 rounded-xl shadow-sm bg-white/50 backdrop-blur-sm text-sm font-semibold text-gray-700 hover:bg-white hover:border-gray-300 transition-all duration-200 transform hover:scale-105">
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </button>
                <button className="w-full inline-flex justify-center items-center py-3 px-4 border-2 border-gray-200 rounded-xl shadow-sm bg-white/50 backdrop-blur-sm text-sm font-semibold text-gray-700 hover:bg-white hover:border-gray-300 transition-all duration-200 transform hover:scale-105">
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 1024 1024">
                    <path d="M732.885333 369.621333a399.445333 399.445333 0 0 0 233.642667 75.093334V276.394667c-16.512 0-32.938667-1.706667-49.066667-5.162667v132.437333a399.488 399.488 0 0 1-233.685333-75.050666v343.381333c0 171.776-138.752 310.997333-309.888 310.997333a307.626667 307.626667 0 0 1-172.501333-52.608A308.394667 308.394667 0 0 0 422.954667 1024c171.136 0 309.930667-139.221333 309.930666-311.04V369.664z m60.501334-169.728a234.88 234.88 0 0 1-60.501334-137.301333V40.96h-46.506666a235.562667 235.562667 0 0 0 107.008 158.933333zM309.632 798.634667a141.994667 141.994667 0 0 1-28.928-86.144 141.994667 141.994667 0 0 1 184.746667-135.594667V404.906667a311.509333 311.509333 0 0 0-49.024-2.858667v133.888a141.994667 141.994667 0 0 0-184.746667 135.594667c0 55.552 31.701333 103.68 77.952 127.104z" fill="#FF004F"/>
                    <path d="M683.776 328.661333a399.530667 399.530667 0 0 0 233.685333 75.050667V271.274667a234.368 234.368 0 0 1-124.074666-71.381334A235.605333 235.605333 0 0 1 686.378667 40.96h-122.154667v672a142.037333 142.037333 0 0 1-141.738667 141.824 141.397333 141.397333 0 0 1-112.853333-56.149333 142.293333 142.293333 0 0 1-77.994667-127.104 141.994667 141.994667 0 0 1 184.746667-135.594667V402.048c-168.106667 3.498667-303.36 141.354667-303.36 310.954667 0 84.650667 33.706667 161.365333 88.362667 217.429333a307.626667 307.626667 0 0 0 172.501333 52.608c171.178667 0 309.888-139.264 309.888-311.04V328.704z" fill="#000000"/>
                    <path d="M917.461333 271.274667v-35.84a232.96 232.96 0 0 1-124.074666-35.541334 234.112 234.112 0 0 0 124.074666 71.381334zM686.378667 40.96a239.402667 239.402667 0 0 1-2.56-19.328V0h-168.661334v672a141.994667 141.994667 0 0 1-141.738666 141.824 140.757333 140.757333 0 0 1-63.786667-15.189333 141.397333 141.397333 0 0 0 112.853333 56.149333 142.037333 142.037333 0 0 0 141.738667-141.781333V40.96h122.154667zM416.426667 402.048V363.946667a311.808 311.808 0 0 0-42.496-2.901334c-171.178667 0-309.930667 139.221333-309.930667 310.997334a310.997333 310.997333 0 0 0 137.386667 258.389333 310.528 310.528 0 0 1-88.32-217.429333c0-169.557333 135.253333-307.456 303.36-310.954667z" fill="#00F2EA"/>
                  </svg>
                  TikTok
                </button>
              </div>
            </div>

            <p className="mt-8 text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-bold text-purple-600 hover:text-purple-700 transition-colors"
              >
                Sign up for free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;