import { useState, useEffect } from 'react';
import { Gift, Calendar, DollarSign, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function RegistrationPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    wishlist: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const deadline = new Date('2025-11-15T23:59:59');
      const now = new Date();
      const diff = deadline.getTime() - now.getTime();

      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      } else {
        setTimeLeft('Registration closed');
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error: insertError } = await supabase
        .from('participants')
        .insert([
          {
            slack_user_id: formData.email,
            name: formData.name,
            address: formData.address,
            wishlist: formData.wishlist || null,
            status: 'registered',
          },
        ]);

      if (insertError) throw insertError;

      setSuccess(true);
      setFormData({ name: '', email: '', address: '', wishlist: '' });
    } catch (err: any) {
      setError(err.message || 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-green-900 to-red-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Successfully Registered! 🎄
          </h2>
          <p className="text-gray-600 mb-6">
            You're all set for Secret Evil Santa 2025! Watch your email for your Secret Santa assignment after the raffle.
          </p>
          <button
            onClick={() => setSuccess(false)}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
          >
            Register Another Person
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-green-900 to-red-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
            Secret Evil Santa 2025
          </h1>
          <p className="text-xl text-white/90">
            Join our not so-evil gift exchange!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
            <Calendar className="w-8 h-8 text-white mx-auto mb-2" />
            <p className="text-white/80 text-sm">Submission Deadline</p>
            <p className="text-white font-bold text-xs">Nov 15, 2025</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
            <DollarSign className="w-8 h-8 text-white mx-auto mb-2" />
            <p className="text-white/80 text-sm">Budget</p>
            <p className="text-white font-bold">$30</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
            <Gift className="w-8 h-8 text-white mx-auto mb-2" />
            <p className="text-white/80 text-sm">Send Gifts By</p>
            <p className="text-white font-bold text-xs">Dec 1, 2025</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Register for Secret Santa
          </h2>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                placeholder="john@evilmartians.com"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Shipping Address <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all resize-none"
                placeholder="123 Main St, City, State, ZIP"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Wishlist (Optional)
              </label>
              <textarea
                value={formData.wishlist}
                onChange={(e) => setFormData({ ...formData, wishlist: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all resize-none"
                placeholder="Books, coffee, gadgets, etc."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-600 to-green-600 text-white py-4 rounded-lg font-bold text-lg hover:from-red-700 hover:to-green-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
            >
              {loading ? 'Registering...' : '🎁 Register Now'}
            </button>
          </form>
        </div>

        <div className="text-center mt-6">
          <a
            href="/admin"
            className="text-white/80 hover:text-white transition-colors underline"
          >
            Admin Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
