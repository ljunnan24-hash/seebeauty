import { Link, useNavigate } from 'react-router-dom';
import { Camera, Star, Shield, Zap, ChevronRight, Sparkles, Eye, Heart, Palette, Upload, ArrowRight, Check, Play, Flame } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { createCheckoutSession } from '../services/paymentService';
import { useState } from 'react';

function HomePage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handlePurchase = async (type) => {
    if (type === 'free') {
      navigate('/rate');
      return;
    }

    try {
      setIsLoading(true);
      const { url } = await createCheckoutSession(type);
      window.location.href = url; 
    } catch (error) {
      console.error('Failed to create checkout session:', error);
      alert('Failed to create checkout session, please try again later');
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: Camera,
      title: 'Multi-Dimensional Analysis',
      description: 'Get detailed feedback on face, figure, outfit and photography'
    },
    {
      icon: Star,
      title: 'Dual Feedback Modes',
      description: 'Choose Gentle encouragement or Roast style as you like'
    },
    {
      icon: Shield,
      title: 'Diversity Friendly',
      description: 'Inclusive, respectful feedback across cultures and backgrounds'
    },
    {
      icon: Zap,
      title: 'Instant Results',
      description: 'AI analysis delivers a professional report in seconds'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-40" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.08'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>

        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-900/20"></div>

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white/90 text-sm font-medium mb-8">
              <Sparkles className="h-4 w-4 mr-2 text-yellow-400" />
              AI-Powered Beauty Analysis
              <div className="ml-2 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight">
              Discover Your
              <span className="bg-gradient-to-r from-violet-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
                True Beauty
              </span>
            </h1>

            <p className="text-xl sm:text-2xl text-slate-300 mb-12 max-w-4xl mx-auto leading-relaxed">
              Upload a photo to get professional AI scoring and personalized suggestions.<br />
              From gentle encouragement to sharp roasts—choose the feedback vibe you want.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              {isAuthenticated ? (
                <Link
                  to="/rate"
                  className="group inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-slate-900 bg-white rounded-2xl hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-xl"
                >
                  <Camera className="mr-3 h-6 w-6" />
                  Start Rating
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="group inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-slate-900 bg-white rounded-2xl hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-xl"
                  >
                    <Upload className="mr-3 h-6 w-6" />
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl hover:bg-white/20 transition-all duration-300"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-slate-400 text-sm">
              <div className="flex items-center">
                <Check className="h-4 w-4 text-green-400 mr-2" />
                AI Expert Scoring
              </div>
              <div className="flex items-center">
                <Check className="h-4 w-4 text-green-400 mr-2" />
                Dual Mode Feedback
              </div>
              <div className="flex items-center">
                <Check className="h-4 w-4 text-green-400 mr-2" />
                Privacy & Security
              </div>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 opacity-20">
          <div className="w-32 h-32 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full animate-pulse"></div>
        </div>
        <div className="absolute bottom-20 right-10 opacity-20">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full animate-bounce"></div>
        </div>
        <div className="absolute top-1/2 right-1/4 opacity-10">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full animate-ping"></div>
        </div>
      </div>


      {/* Examples Section */}
      <div className="py-20 bg-white relative overflow-hidden">
        {/* Organic background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-64 h-64 bg-gradient-to-br from-pink-100/40 to-purple-100/40 rounded-full blur-2xl"></div>
          <div className="absolute bottom-32 right-16 w-80 h-80 bg-gradient-to-br from-blue-100/30 to-cyan-100/30 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-gradient-to-br from-yellow-100/20 to-orange-100/20 rounded-full blur-xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Evaluation Perspectives Section */}
          <div className="relative mb-20">
            {/* Section Header */}
            <div className="text-center mb-16">
              <h3 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Evaluate your photos from different perspectives</h3>
              <p className="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
                Our AI analyzes multiple dimensions to provide comprehensive feedback on your photos
              </p>
            </div>

            {/* Four Perspective Cards Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Face Card */}
              <div className="group relative bg-white rounded-3xl overflow-hidden shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02]">
                <div className="relative">
                  <div className="aspect-[4/5] bg-gradient-to-br from-blue-50 to-indigo-50">
                    <img
                      src="/examples/face.jpg"
                      alt="Face Analysis Example"
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'flex'; }}
                    />
                    <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-blue-300" style={{ display: 'none' }}>
                      <div className="text-center">
                        <Eye className="h-12 w-12 text-blue-400 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-blue-600">Face Analysis</p>
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-4 left-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-xl flex items-center shadow-lg">
                    <Eye className="h-4 w-4 mr-2" />
                    <span className="font-bold text-sm">Face</span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {/* Evaluation */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-100">
                      <div className="flex items-center mb-3">
                        <Heart className="h-4 w-4 text-green-600 mr-2" />
                        <h5 className="font-bold text-green-800 text-sm">Evaluation</h5>
                      </div>
                      <p className="text-green-700 text-sm leading-relaxed">
                        "Your facial features are well-balanced and your eyes have a beautiful sparkle. Your natural expression radiates genuine charm and gives off a warm, approachable vibe."
                      </p>
                    </div>

                    {/* Recommendations */}
                    <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-4 border border-orange-100">
                      <div className="flex items-center mb-3">
                        <Flame className="h-4 w-4 text-orange-600 mr-2" />
                        <h5 className="font-bold text-orange-800 text-sm">Recommendations</h5>
                      </div>
                      <p className="text-orange-700 text-sm leading-relaxed">
                        "That angle makes you look like you're taking a driver's license photo—loosen up! But seriously, try a different angle and you'll definitely be more camera-ready."
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Figure Card */}
              <div className="group relative bg-white rounded-3xl overflow-hidden shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02]">
                <div className="relative">
                  <div className="aspect-[4/5] bg-gradient-to-br from-purple-50 to-pink-50">
                    <img
                      src="/examples/Figure.jpg"
                      alt="Figure Analysis Example"
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'flex'; }}
                    />
                    <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-purple-300" style={{ display: 'none' }}>
                      <div className="text-center">
                        <Heart className="h-12 w-12 text-purple-400 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-purple-600">Figure Analysis</p>
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-4 left-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-xl flex items-center shadow-lg">
                    <Heart className="h-4 w-4 mr-2" />
                    <span className="font-bold text-sm">Figure</span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {/* Evaluation */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-100">
                      <div className="flex items-center mb-3">
                        <Heart className="h-4 w-4 text-green-600 mr-2" />
                        <h5 className="font-bold text-green-800 text-sm">Evaluation</h5>
                      </div>
                      <p className="text-green-700 text-sm leading-relaxed">
                        "Your body language exudes confidence and your posture is naturally elegant. The energy and self-assurance you project makes you look incredibly charismatic—keep that up!"
                      </p>
                    </div>

                    {/* Recommendations */}
                    <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-4 border border-orange-100">
                      <div className="flex items-center mb-3">
                        <Flame className="h-4 w-4 text-orange-600 mr-2" />
                        <h5 className="font-bold text-orange-800 text-sm">Recommendations</h5>
                      </div>
                      <p className="text-orange-700 text-sm leading-relaxed">
                        "This pose looks like you're practicing in front of a gym mirror. Maybe dial it back a notch—not every photo needs to showcase the muscle definition."
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Outfit Card */}
              <div className="group relative bg-white rounded-3xl overflow-hidden shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02]">
                <div className="relative">
                  <div className="aspect-[4/5] bg-gradient-to-br from-emerald-50 to-green-50">
                    <img
                      src="/examples/outfit.jpg"
                      alt="Outfit Analysis Example"
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'flex'; }}
                    />
                    <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-emerald-300" style={{ display: 'none' }}>
                      <div className="text-center">
                        <Palette className="h-12 w-12 text-emerald-400 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-emerald-600">Outfit Analysis</p>
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-4 left-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white px-4 py-2 rounded-xl flex items-center shadow-lg">
                    <Palette className="h-4 w-4 mr-2" />
                    <span className="font-bold text-sm">Outfit</span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {/* Evaluation */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-100">
                      <div className="flex items-center mb-3">
                        <Heart className="h-4 w-4 text-green-600 mr-2" />
                        <h5 className="font-bold text-green-800 text-sm">Evaluation</h5>
                      </div>
                      <p className="text-green-700 text-sm leading-relaxed">
                        "Your styling is tasteful and the colors coordinate beautifully with your skin tone. The minimalist approach showcases an elegant aesthetic that's perfectly harmonious."
                      </p>
                    </div>

                    {/* Recommendations */}
                    <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-4 border border-orange-100">
                      <div className="flex items-center mb-3">
                        <Flame className="h-4 w-4 text-orange-600 mr-2" />
                        <h5 className="font-bold text-orange-800 text-sm">Recommendations</h5>
                      </div>
                      <p className="text-orange-700 text-sm leading-relaxed">
                        "This outfit looks like it was picked in the dark. Try adding some bright accents so people know you're not heading to a funeral."
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Photography Card */}
              <div className="group relative bg-white rounded-3xl overflow-hidden shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02]">
                <div className="relative">
                  <div className="aspect-[4/5] bg-gradient-to-br from-orange-50 to-amber-50">
                    <img
                      src="/examples/photography.jpg"
                      alt="Photography Analysis Example"
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'flex'; }}
                    />
                    <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-orange-300" style={{ display: 'none' }}>
                      <div className="text-center">
                        <Camera className="h-12 w-12 text-orange-400 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-orange-600">Photography Analysis</p>
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-4 left-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-2 rounded-xl flex items-center shadow-lg">
                    <Camera className="h-4 w-4 mr-2" />
                    <span className="font-bold text-sm">Photography</span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {/* Evaluation */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-100">
                      <div className="flex items-center mb-3">
                        <Heart className="h-4 w-4 text-green-600 mr-2" />
                        <h5 className="font-bold text-green-800 text-sm">Evaluation</h5>
                      </div>
                      <p className="text-green-700 text-sm leading-relaxed">
                        "The composition has great depth and the monochrome tones create a fantastic artistic atmosphere. The lighting is well-executed and demonstrates real photographic skill."
                      </p>
                    </div>

                    {/* Recommendations */}
                    <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-4 border border-orange-100">
                      <div className="flex items-center mb-3">
                        <Flame className="h-4 w-4 text-orange-600 mr-2" />
                        <h5 className="font-bold text-orange-800 text-sm">Recommendations</h5>
                      </div>
                      <p className="text-orange-700 text-sm leading-relaxed">
                        "That lighting is so flat it could pass for a tax form. Try some natural light—people shouldn't think you shot this in a basement office."
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Mode Comparison */}
          <div className="relative">
            {/* Section Header */}
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-slate-900 mb-4">Experience Two AI Styles</h3>
              <p className="text-lg text-slate-600">Choose the feedback mode you prefer</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 mb-16">
              {/* Gentle Mode - Enhanced */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-green-100/30 to-emerald-100/30 rounded-3xl transform rotate-1 group-hover:rotate-0 transition-transform duration-500"></div>
                <div className="relative bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02]">
                  <div className="relative">
                    <div className="aspect-[4/3] bg-gradient-to-br from-green-50 to-emerald-50">
                      <img src="/examples/2.png" alt="Gentle Mode Example" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'flex'; }} />
                      <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-green-300" style={{ display: 'none' }}>
                        <div className="text-center">
                          <Camera className="h-16 w-16 text-green-400 mx-auto mb-4" />
                          <p className="text-lg font-semibold text-green-600">Sample Image Area</p>
                          <p className="text-sm text-green-500 mt-2">2.png - Portrait</p>
                        </div>
                      </div>
                    </div>
                    <div className="absolute top-6 left-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-2xl flex items-center shadow-lg">
                      <Heart className="h-5 w-5 mr-2 animate-pulse" />
                      <span className="font-bold">Gentle Mode</span>
                    </div>
                    <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-2xl border border-green-200 shadow-lg">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-500 mr-1" />
                        <span className="text-green-600 font-black text-lg">8.5</span>
                      </div>
                    </div>
                    <div className="absolute bottom-4 right-4 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity">
                      <Sparkles className="h-6 w-6 text-green-500 animate-spin" style={{ animationDuration: '3s' }} />
                    </div>
                  </div>
                  <div className="p-8">
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                        <h4 className="font-bold text-green-800 mb-3 flex items-center">
                          <div className="w-6 h-6 bg-green-500 rounded-lg flex items-center justify-center mr-2"><span className="text-white text-xs">✓</span></div>
                          Professional Feedback
                        </h4>
                        <p className="text-green-700 leading-relaxed">"Your smile is warm and natural, eyes clear and expressive, overall very pleasant. Styling works well."</p>
                      </div>
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                        <h4 className="font-bold text-blue-800 mb-3 flex items-center">
                          <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center mr-2"><ArrowRight className="h-3 w-3 text-white" /></div>
                          Improvement Tips
                        </h4>
                        <p className="text-blue-700 leading-relaxed">"Try softer lighting for more natural skin tones. Slight angle change could improve balance."</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-gradient-to-br from-green-200 to-emerald-200 rounded-full opacity-40 group-hover:opacity-60 transition-opacity animate-pulse"></div>
              </div>

              {/* Roast Mode - Enhanced */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-100/30 to-red-100/30 rounded-3xl transform -rotate-1 group-hover:rotate-0 transition-transform duration-500"></div>
                <div className="relative bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02]">
                  <div className="relative">
                    <div className="aspect-[4/3] bg-gradient-to-br from-orange-50 to-red-50">
                      <img src="/examples/1.png" alt="Roast Mode Example" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'flex'; }} />
                      <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-orange-300" style={{ display: 'none' }}>
                        <div className="text-center">
                          <Camera className="h-16 w-16 text-orange-400 mx-auto mb-4" />
                          <p className="text-lg font-semibold text-orange-600">Sample Image Area</p>
                          <p className="text-sm text-orange-500 mt-2">1.png - Selfie</p>
                        </div>
                      </div>
                    </div>
                    <div className="absolute top-6 left-6 bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-2xl flex items-center shadow-lg">
                      <Flame className="h-5 w-5 mr-2 animate-pulse" />
                      <span className="font-bold">Roast Mode</span>
                    </div>
                    <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-2xl border border-orange-200 shadow-lg">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-500 mr-1" />
                        <span className="text-orange-600 font-black text-lg">6.8</span>
                      </div>
                    </div>
                    <div className="absolute bottom-4 right-4 w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity">
                      <Sparkles className="h-6 w-6 text-orange-500 animate-bounce" />
                    </div>
                  </div>
                  <div className="p-8">
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-100">
                        <h4 className="font-bold text-orange-800 mb-3 flex items-center">
                          <div className="w-6 h-6 bg-orange-500 rounded-lg flex items-center justify-center mr-2"><span className="text-white text-xs">🔥</span></div>
                          Savage Roast
                        </h4>
                        <p className="text-orange-700 leading-relaxed">"This angle looks like an ID shot. Lighting is flat and your expression is frozen—relax the vibe."</p>
                      </div>
                      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-100">
                        <h4 className="font-bold text-purple-800 mb-3 flex items-center">
                          <div className="w-6 h-6 bg-purple-500 rounded-lg flex items-center justify-center mr-2"><Eye className="h-3 w-3 text-white" /></div>
                          Hidden Advice
                        </h4>
                        <p className="text-purple-700 leading-relaxed">"Seriously: shoot in natural light and relax—there's real potential here."</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-br from-orange-200 to-red-200 rounded-full opacity-40 group-hover:opacity-60 transition-opacity animate-pulse" style={{ animationDelay: '1s' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid - MOVED FROM TOP */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">
              Why Choose SeeBeauty?
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Experience next‑gen photo feedback with professional, accurate, personalized AI analysis.
            </p>
          </div>

          {/* Top Section: Four Feature Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* Multi-Dimensional Analysis */}
            <div className="group relative bg-white rounded-3xl p-6 text-center transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-xl"></div>
              <div className="absolute inset-0.5 bg-white rounded-3xl -z-10"></div>

              <div className="relative inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                <Camera className="h-7 w-7" />
              </div>

              <h3 className="text-lg font-bold text-slate-900 mb-3">
                Multi-Dimensional Analysis
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Get detailed feedback on face, figure, outfit and photography
              </p>
            </div>

            {/* Dual Feedback Modes */}
            <div className="group relative bg-white rounded-3xl p-6 text-center transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-xl"></div>
              <div className="absolute inset-0.5 bg-white rounded-3xl -z-10"></div>

              <div className="relative inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                <Star className="h-7 w-7" />
              </div>

              <h3 className="text-lg font-bold text-slate-900 mb-3">
                Dual Feedback Modes
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Choose Gentle encouragement or Roast style as you like
              </p>
            </div>

            {/* Diversity Friendly */}
            <div className="group relative bg-white rounded-3xl p-6 text-center transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-xl"></div>
              <div className="absolute inset-0.5 bg-white rounded-3xl -z-10"></div>

              <div className="relative inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                <Shield className="h-7 w-7" />
              </div>

              <h3 className="text-lg font-bold text-slate-900 mb-3">
                Diversity Friendly
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Inclusive, respectful feedback across cultures and backgrounds
              </p>
            </div>

            {/* Instant Results */}
            <div className="group relative bg-white rounded-3xl p-6 text-center transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-xl"></div>
              <div className="absolute inset-0.5 bg-white rounded-3xl -z-10"></div>

              <div className="relative inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                <Zap className="h-7 w-7" />
              </div>

              <h3 className="text-lg font-bold text-slate-900 mb-3">
                Instant Results
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                AI analysis delivers a professional report in seconds
              </p>
            </div>
          </div>

          {/* Bottom Section: Two Separate Cards */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left Card: AI Training Description */}
            <div className="relative bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900 rounded-3xl p-6 md:p-8 text-white overflow-hidden" style={{ height: '240px' }}>
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-4 left-4 w-20 h-20 bg-white rounded-full blur-xl"></div>
                <div className="absolute bottom-4 right-4 w-16 h-16 bg-pink-300 rounded-full blur-lg"></div>
              </div>

              <div className="relative z-10 h-full flex flex-col">
                <div className="mb-4">
                  <div className="inline-flex items-center px-3 py-1 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full text-white/90 text-sm font-medium mb-4">
                    <Sparkles className="h-4 w-4 mr-2 text-yellow-400" />
                    Exclusive AI Training
                  </div>
                  <h3 className="text-2xl md:text-3xl font-black mb-4 leading-tight">
                    Our AI is trained on 1M+ US fashion/beauty data points
                  </h3>
                  <p className="text-lg text-white/90 leading-relaxed">
                    No tool has this level of US-focused training—including TikTok trends, campus styles, and influencer looks.
                  </p>
                </div>

                {/* Data Stats */}
                <div className="grid grid-cols-3 gap-3 mt-auto">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20 text-center">
                    <div className="text-lg font-black text-yellow-400 mb-1">1M+</div>
                    <div className="text-xs text-white/80">Data Points</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20 text-center">
                    <div className="text-lg font-black text-pink-400 mb-1">100%</div>
                    <div className="text-xs text-white/80">US Focused</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20 text-center">
                    <div className="text-lg font-black text-blue-400 mb-1">0</div>
                    <div className="text-xs text-white/80">Competitors</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Card: Chart */}
            <div className="relative bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900 rounded-3xl p-6 md:p-8 text-white overflow-hidden" style={{ height: '240px' }}>
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-4 right-4 w-20 h-20 bg-white rounded-full blur-xl"></div>
                <div className="absolute bottom-4 left-4 w-16 h-16 bg-pink-300 rounded-full blur-lg"></div>
              </div>

              <div className="relative z-10 h-full flex flex-col">
                {/* Description Text */}
                <div className="mb-4">
                  <p className="text-sm text-white/90 leading-relaxed">
                    Our AI is trained on 1M+ US fashion/beauty data points—including TikTok trends, campus styles, and influencer looks.
                  </p>
                </div>

                {/* Simulated Line Chart */}
                <div className="relative flex-1 mb-2">
                  <svg viewBox="0 0 400 130" className="w-full h-full">
                    {/* Grid lines */}
                    <defs>
                      <linearGradient id="chartGradient2" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#ec4899" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#ec4899" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Background grid - only horizontal lines */}
                    <g stroke="rgba(255,255,255,0.1)" strokeWidth="1">
                      <line x1="20" y1="20" x2="380" y2="20" />
                      <line x1="20" y1="40" x2="380" y2="40" />
                      <line x1="20" y1="60" x2="380" y2="60" />
                      <line x1="20" y1="80" x2="380" y2="80" />
                    </g>

                    {/* Chart line - flat to steep rise */}
                    <path
                      d="M 30 80 Q 80 78 130 75 Q 180 70 230 60 Q 280 45 330 25 Q 350 20 370 15"
                      stroke="#ec4899"
                      strokeWidth="3"
                      fill="none"
                      className="animate-pulse"
                    />

                    {/* Fill area under curve */}
                    <path
                      d="M 30 80 Q 80 78 130 75 Q 180 70 230 60 Q 280 45 330 25 Q 350 20 370 15 L 370 110 L 30 110 Z"
                      fill="url(#chartGradient2)"
                    />

                    {/* Data points */}
                    <circle cx="80" cy="78" r="2" fill="#fbbf24" className="animate-pulse" />
                    <circle cx="130" cy="75" r="2" fill="#fbbf24" className="animate-pulse" style={{ animationDelay: '0.3s' }} />
                    <circle cx="180" cy="70" r="2" fill="#fbbf24" className="animate-pulse" style={{ animationDelay: '0.6s' }} />
                    <circle cx="230" cy="60" r="3" fill="#fbbf24" className="animate-pulse" style={{ animationDelay: '0.9s' }} />
                    <circle cx="280" cy="45" r="3" fill="#fbbf24" className="animate-pulse" style={{ animationDelay: '1.2s' }} />
                    <circle cx="330" cy="25" r="4" fill="#fbbf24" className="animate-pulse" style={{ animationDelay: '1.5s' }} />
                    <circle cx="370" cy="15" r="4" fill="#fbbf24" className="animate-pulse" style={{ animationDelay: '1.8s' }} />

                    {/* Start and End Labels */}
                    <text x="30" y="105" fill="rgba(255,255,255,0.8)" fontSize="12" textAnchor="middle" fontWeight="bold">0</text>
                    <text x="375" y="10" fill="rgba(255,255,255,0.9)" fontSize="14" textAnchor="start" fontWeight="bold">1M</text>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Back to Examples Section */}
      <div className="py-20 bg-white relative overflow-hidden">

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        </div>
      </div>

      {/* Pricing Section */}
      <div className="py-24 bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-100 to-blue-100 border border-green-200 rounded-full text-green-700 text-sm font-medium mb-6">
              <Zap className="h-4 w-4 mr-2" />
              Flexible Pricing
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">
              Choose Your Plan
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              From free trial to unlimited usage—there’s a plan for every need.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Trial */}
            <div className="group relative bg-white rounded-3xl p-8 shadow-lg border border-gray-200 text-center flex flex-col hover:shadow-2xl transition-all duration-500" style={{ minHeight: '600px' }}>
              {/* Ultra-visible flowing border effect */}
              <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 opacity-90 animate-pulse"></div>
                <div className="absolute inset-[3px] rounded-3xl bg-white"></div>
              </div>

              {/* Secondary flowing animation */}
              <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 overflow-hidden">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-l from-purple-400 via-pink-400 to-cyan-400 opacity-75 animate-bounce"></div>
                <div className="absolute inset-[3px] rounded-3xl bg-white"></div>
              </div>

              {/* Third layer for extra flow effect */}
              <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000 overflow-hidden">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-cyan-300 via-blue-400 to-green-400 opacity-60" style={{ animation: 'spin 3s linear infinite' }}></div>
                <div className="absolute inset-[3px] rounded-3xl bg-white"></div>
              </div>

              <div className="relative z-10 flex flex-col h-full">
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">Free</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-black text-slate-900">$0</span>
                  </div>
                  <p className="text-slate-600">For new users</p>
                </div>

                <ul className="space-y-4 mb-8 text-left flex-grow">
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-slate-700">2 free ratings</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-slate-700">Full analysis report</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-slate-700">Share to social for 1 extra rating</span>
                  </li>
                </ul>

                <div className="mt-auto pt-6">
                  {isAuthenticated ? (
                    <button
                      onClick={() => handlePurchase('free')}
                      disabled={isLoading}
                      className="w-full inline-flex items-center justify-center px-6 py-3 text-lg font-bold text-slate-700 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-all duration-300 disabled:opacity-50"
                    >
                      Start Free
                    </button>
                  ) : (
                    <Link
                      to="/register"
                      className="w-full inline-flex items-center justify-center px-6 py-3 text-lg font-bold text-slate-700 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-all duration-300"
                    >
                      Start Free
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Pay Per Use - Now in the middle */}
            <div className="group relative bg-white rounded-3xl p-8 shadow-lg border border-gray-200 text-center flex flex-col hover:shadow-2xl transition-all duration-500" style={{ minHeight: '600px' }}>
              {/* Ultra-visible flowing border effect */}
              <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 opacity-90 animate-pulse"></div>
                <div className="absolute inset-[3px] rounded-3xl bg-white"></div>
              </div>

              {/* Secondary flowing animation */}
              <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 overflow-hidden">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-l from-red-400 via-pink-400 to-purple-400 opacity-75 animate-bounce"></div>
                <div className="absolute inset-[3px] rounded-3xl bg-white"></div>
              </div>

              {/* Third layer for extra flow effect */}
              <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000 overflow-hidden">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-pink-300 via-purple-400 to-red-400 opacity-60" style={{ animation: 'spin 3s linear infinite' }}></div>
                <div className="absolute inset-[3px] rounded-3xl bg-white"></div>
              </div>

              <div className="relative z-10 flex flex-col h-full">
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">Pay As You Go</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-black text-slate-900">$0.99</span>
                    <span className="text-slate-600 ml-2">/ use</span>
                  </div>
                  <p className="text-slate-600">Pay only when you need it</p>
                </div>

                <ul className="space-y-4 mb-8 text-left flex-grow">
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-purple-500 mr-3 flex-shrink-0" />
                    <span className="text-slate-700">1 rating</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-purple-500 mr-3 flex-shrink-0" />
                    <span className="text-slate-700">Full analysis report</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-purple-500 mr-3 flex-shrink-0" />
                    <span className="text-slate-700">Save to dashboard</span>
                  </li>
                </ul>

                <div className="mt-auto pt-6">
                  {isAuthenticated ? (
                    <button
                      onClick={() => handlePurchase('one_time')}
                      disabled={isLoading}
                      className="w-full inline-flex items-center justify-center px-6 py-3 text-lg font-bold text-purple-700 bg-purple-100 rounded-2xl hover:bg-purple-200 transition-all duration-300 disabled:opacity-50"
                    >
                      {isLoading ? 'Processing...' : 'Purchase Now'}
                    </button>
                  ) : (
                    <Link
                      to="/register"
                      className="w-full inline-flex items-center justify-center px-6 py-3 text-lg font-bold text-purple-700 bg-purple-100 rounded-2xl hover:bg-purple-200 transition-all duration-300"
                    >
                      Purchase Now
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Subscription - Now on the right */}
            <div className="group relative bg-white rounded-3xl p-8 shadow-2xl border border-blue-200 text-center flex flex-col hover:shadow-2xl transition-all duration-500" style={{ minHeight: '600px' }}>
              {/* Popular badge */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-30">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg whitespace-nowrap">
                  Most Popular
                </div>
              </div>

              {/* Enhanced Flowing border effect */}
              <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 opacity-90 animate-pulse"></div>
                <div className="absolute inset-[3px] rounded-3xl bg-white"></div>
              </div>

              {/* Secondary flowing animation */}
              <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 overflow-hidden">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-l from-pink-400 via-violet-400 to-blue-400 opacity-75 animate-bounce"></div>
                <div className="absolute inset-[3px] rounded-3xl bg-white"></div>
              </div>

              {/* Third layer for extra flow effect */}
              <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000 overflow-hidden">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-violet-300 via-purple-400 to-blue-400 opacity-60" style={{ animation: 'spin 3s linear infinite' }}></div>
                <div className="absolute inset-[3px] rounded-3xl bg-white"></div>
              </div>

              <div className="relative z-10 flex flex-col h-full">
                <div className="mb-8 mt-6">
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">Subscription</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-black text-slate-900">$4.99</span>
                    <span className="text-slate-600 ml-2">/ month</span>
                  </div>
                  <p className="text-slate-600">Unlimited access</p>
                </div>

                <ul className="space-y-4 mb-8 text-left flex-grow">
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0" />
                    <span className="text-slate-700">Unlimited ratings</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0" />
                    <span className="text-slate-700">Full analysis reports</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0" />
                    <span className="text-slate-700">Save to dashboard</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0" />
                    <span className="text-slate-700">Monthly trends & improvement guide</span>
                  </li>
                </ul>

                <div className="mt-auto pt-6">
                  {isAuthenticated ? (
                    <button
                      onClick={() => handlePurchase('subscription')}
                      disabled={isLoading}
                      className="w-full inline-flex items-center justify-center px-6 py-3 text-lg font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg disabled:opacity-50"
                    >
                      {isLoading ? 'Processing...' : 'Start Subscription'}
                    </button>
                  ) : (
                    <Link
                      to="/register"
                      className="w-full inline-flex items-center justify-center px-6 py-3 text-lg font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg"
                    >
                      Start Subscription
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom note */}
          <div className="text-center mt-16">
            <p className="text-slate-500 text-sm max-w-2xl mx-auto">
              All plans include privacy and data protection. Cancel anytime. No hidden fees.
            </p>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get professional photo feedback in just three simple steps
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="group text-center">
              <div className="relative mb-8">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-xl group-hover:scale-110 transition-transform duration-300">
                  1
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                  <Camera className="h-4 w-4 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Upload Your Photo
              </h3>
              <p className="text-lg text-gray-600 leading-relaxed">
                Choose any photo you want feedback on - selfie, portrait, or full body shot.
                Our AI works with all types of photos.
              </p>
            </div>
            <div className="group text-center">
              <div className="relative mb-8">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-xl group-hover:scale-110 transition-transform duration-300">
                  2
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                  <Palette className="h-4 w-4 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Select Your Mode
              </h3>
              <p className="text-lg text-gray-600 leading-relaxed">
                Pick Normal for constructive feedback or Roast for entertaining critique.
                Choose what type of feedback suits your mood.
              </p>
            </div>
            <div className="group text-center">
              <div className="relative mb-8">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-xl group-hover:scale-110 transition-transform duration-300">
                  3
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                  <Star className="h-4 w-4 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Get Your Report
              </h3>
              <p className="text-lg text-gray-600 leading-relaxed">
                Receive detailed scores, visual charts, and actionable improvement tips.
                Download and share your results instantly.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive CTA Section - MOVED AFTER HOW IT WORKS */}
      <div className="py-20 bg-white relative overflow-hidden">
        {/* Organic background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-64 h-64 bg-gradient-to-br from-pink-100/40 to-purple-100/40 rounded-full blur-2xl"></div>
          <div className="absolute bottom-32 right-16 w-80 h-80 bg-gradient-to-br from-blue-100/30 to-cyan-100/30 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-gradient-to-br from-yellow-100/20 to-orange-100/20 rounded-full blur-xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative bg-gradient-to-r from-indigo-50 via-white to-purple-50 rounded-3xl p-8 md:p-12">
            {/* Floating decorative elements */}
            <div className="absolute top-8 right-8 w-20 h-20 bg-gradient-to-br from-yellow-200 to-orange-200 rounded-full opacity-50 animate-pulse"></div>
            <div className="absolute bottom-8 left-8 w-16 h-16 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full opacity-60 animate-bounce"></div>
            <div className="absolute top-1/2 left-1/4 w-12 h-12 bg-gradient-to-br from-pink-200 to-red-200 rounded-full opacity-40 animate-ping"></div>

            <div className="relative text-center">
              <div className="mb-8">
                <h3 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 leading-tight">
                  Ready for{' '}
                  <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Authentic Feedback
                  </span>
                  ?
                </h3>
                <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                  Whether you want constructive advice or playful roasts, AI delivers surprising insight.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                {!isAuthenticated ? (
                  <>
                    <Link
                      to="/register"
                      className="group bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-xl flex items-center justify-center"
                    >
                      <Sparkles className="mr-3 h-6 w-6" />
                      Try It Free Now
                      <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link
                      to="/login"
                      className="bg-white text-purple-600 px-8 py-4 rounded-2xl font-bold text-lg border-2 border-purple-200 hover:bg-purple-50 transition-all duration-300 flex items-center justify-center"
                    >
                      Already have an account? Sign In
                    </Link>
                  </>
                ) : (
                  <Link
                    to="/rate"
                    className="group bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-xl flex items-center justify-center"
                  >
                    <Camera className="mr-3 h-6 w-6" />
                    Start Rating
                    <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <div className="relative bg-gradient-to-br from-purple-600 via-pink-600 to-red-500 py-20 overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute bottom-16 right-20 w-24 h-24 bg-yellow-300 rounded-full blur-xl animate-bounce"></div>
          <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-pink-300 rounded-full blur-lg animate-ping"></div>
        </div>

        <div className="relative max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-2 gap-16 text-white mb-16">
            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                <h3 className="text-3xl font-black bg-gradient-to-r from-white via-pink-100 to-white bg-clip-text text-transparent mb-6 tracking-wide">
                  Contact us
                </h3>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-400 rounded-xl flex items-center justify-center shadow-lg">
                      <Heart className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-white/70 text-sm font-medium uppercase tracking-wider mb-1">Email</p>
                      <p className="text-xl font-semibold text-white">seebeauty000@gmail.com</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Brand & Company Info */}
            <div className="space-y-8">
              <div>
                <h3 className="text-3xl font-black bg-gradient-to-r from-white via-pink-100 to-white bg-clip-text text-transparent mb-6 tracking-wide">
                  Brand & Company Info
                </h3>

                {/* Company Name */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 mb-6">
                  <div className="text-center">
                    <h4 className="text-2xl font-bold text-white mb-2 tracking-wide">SEEURBEAUTY LTD</h4>
                    <div className="w-16 h-1 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full mx-auto"></div>
                  </div>
                </div>

                {/* Address */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                  <p className="text-white/70 text-sm font-medium uppercase tracking-wider mb-4">Registered Office Address</p>
                  <div className="space-y-2 text-white/90 leading-relaxed">
                    <p className="font-medium">UNIT 7 WILSONS BUSINESS PARK</p>
                    <p className="font-medium">MANCHESTER</p>
                    <p className="font-medium">UNITED KINGDOM M40 8WN</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Elegant Divider */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
            <div className="mx-6">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Heart className="h-4 w-4 text-white/70" />
              </div>
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
          </div>

          {/* Copyright */}
          <div className="text-center">
            <p className="text-white/80 text-lg font-medium tracking-wide">
              © 2025 <span className="font-bold">SEEURBEAUTY LTD</span>. All Rights Reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;