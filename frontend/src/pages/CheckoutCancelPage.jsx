import { useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft, Home } from 'lucide-react';

function CheckoutCancelPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-orange-100 rounded-full flex items-center justify-center">
            <XCircle className="h-10 w-10 text-orange-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-slate-900 mb-4">
            Payment Cancelled
          </h1>
          
          <p className="text-slate-600 mb-8">
            Your payment has been cancelled. No charges were made to your account.
            You can try again whenever you're ready.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => navigate('/')}
              className="w-full inline-flex items-center justify-center px-6 py-3 text-lg font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg"
            >
              <Home className="mr-2 h-5 w-5" />
              Back to Home
            </button>
            
            <button
              onClick={() => navigate(-1)}
              className="w-full inline-flex items-center justify-center px-6 py-3 text-lg font-bold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all duration-300"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Go Back
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500">
            Questions about pricing?{' '}
            <a href="mailto:seebeauty000@gmail.com" className="text-purple-600 hover:text-purple-700 font-medium">
              Contact Us
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default CheckoutCancelPage;

