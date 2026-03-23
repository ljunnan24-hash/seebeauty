import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Menu, X, Camera, User, LogOut, Home, Grid, Sparkles, Heart } from 'lucide-react';
import { useState } from 'react';

function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50">
      <nav className="bg-white/90 backdrop-blur-lg shadow-xl border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link to="/" className="flex items-center group">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <span className="ml-3 text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">SeeBeauty</span>
              </Link>

              <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
                <Link
                  to="/"
                  className="inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Link>
                {isAuthenticated && (
                  <>
                    <Link
                      to="/dashboard"
                      className="inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200"
                    >
                      <Grid className="h-4 w-4 mr-2" />
                      Dashboard
                    </Link>
                    <Link
                      to="/profile"
                      className="inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </Link>
                    <Link
                      to="/rate"
                      className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Rate Photo
                    </Link>
                  </>
                )}
              </div>
            </div>

            <div className="hidden sm:flex sm:items-center sm:space-x-4">
              {isAuthenticated ? (
                <>
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Sign Up
                  </Link>
                </>
              )}
            </div>

            <div className="flex items-center sm:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-xl text-gray-700 hover:text-purple-600 hover:bg-purple-50 transition-all duration-200"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden bg-white/95 backdrop-blur-lg border-t border-white/20">
            <div className="pt-2 pb-3 space-y-1">
              <Link
                to="/"
                className="flex items-center px-4 py-3 text-base font-semibold text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg mx-2 transition-all duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Home className="h-5 w-5 mr-3" />
                Home
              </Link>
              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    className="flex items-center px-4 py-3 text-base font-semibold text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg mx-2 transition-all duration-200"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Grid className="h-5 w-5 mr-3" />
                    Dashboard
                  </Link>
                  <Link
                    to="/rate"
                    className="flex items-center px-4 py-3 text-base font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg mx-2 shadow-lg transition-all duration-300"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Camera className="h-5 w-5 mr-3" />
                    Rate Photo
                  </Link>
                  <Link
                    to="/profile"
                    className="flex items-center px-4 py-3 text-base font-semibold text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg mx-2 transition-all duration-200"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="h-5 w-5 mr-3" />
                    Profile
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center w-full text-left px-4 py-3 text-base font-semibold text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg mx-2 transition-all duration-200"
                  >
                    <LogOut className="h-5 w-5 mr-3" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="flex items-center px-4 py-3 text-base font-semibold text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg mx-2 transition-all duration-200"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="flex items-center px-4 py-3 text-base font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg mx-2 shadow-lg transition-all duration-300"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Sparkles className="h-5 w-5 mr-3" />
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-white/90 backdrop-blur-lg border-t border-white/20 mt-auto shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
                <Heart className="h-5 w-5 text-white" />
              </div>
              <span className="ml-3 text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">SeeBeauty</span>
            </div>
            <div className="text-center text-sm text-gray-500">
              © 2025 SeeBeauty. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Layout;