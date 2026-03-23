import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight, Loader } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

function CheckoutSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const fetchCurrentUser = useAuthStore((state) => state.fetchCurrentUser);

  useEffect(() => {
    // Refresh user info to get the latest credits and subscription status
    const updateUserData = async () => {
      try {
        await fetchCurrentUser();
      } catch (error) {
        console.error('Failed to update user info:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Add a short delay to allow time for webhook processing
    const timer = setTimeout(updateUserData, 2000);
    return () => clearTimeout(timer);
  }, [fetchCurrentUser]);

  const sessionId = searchParams.get('session_id');

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
          {isLoading ? (
            <>
              <div className="w-20 h-20 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
                <Loader className="h-10 w-10 text-blue-600 animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-4">
                Processing Payment...
              </h1>
              <p className="text-slate-600 mb-6">
                Please wait while we confirm your payment.
              </p>
            </>
          ) : (
            <>
              <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              
              <h1 className="text-3xl font-bold text-slate-900 mb-4">
                Payment Successful!
              </h1>
              
              <p className="text-slate-600 mb-8">
                Thank you for your purchase. Your account has been updated and you can now start using your credits or subscription.
              </p>

              {sessionId && (
                <div className="bg-slate-50 rounded-xl p-4 mb-6">
                  <p className="text-sm text-slate-500 mb-1">Session ID</p>
                  <p className="text-xs font-mono text-slate-700 break-all">{sessionId}</p>
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={() => navigate('/rate')}
                  className="w-full inline-flex items-center justify-center px-6 py-3 text-lg font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg"
                >
                  Start Rating
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>
                
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full inline-flex items-center justify-center px-6 py-3 text-lg font-bold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all duration-300"
                >
                  Go to Dashboard
                </button>
              </div>
            </>
          )}
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500">
            Need help?{' '}
            <a href="mailto:seebeauty000@gmail.com" className="text-purple-600 hover:text-purple-700 font-medium">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default CheckoutSuccessPage;
