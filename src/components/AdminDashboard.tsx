import { useState, useEffect } from 'react';
import { Users, RefreshCw, Download, Shuffle, Lock, LogOut, Sparkles } from 'lucide-react';
import { supabase, Participant } from '../lib/supabase';

export default function AdminDashboard() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRaffleModal, setShowRaffleModal] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
  supabase.auth.getSession().then(({ data }) => {
    if (data.session) setAuthenticated(true);
  });

  const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
    setAuthenticated(!!session);
  });

  return () => listener.subscription.unsubscribe();
}, []);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const user = data?.user;
      if (!user) throw new Error('No user returned');

      setAuthenticated(true);
      await fetchParticipants();
    } catch (err: any) {
      setError(err.message || 'Failed to log in');
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipants = async () => {
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('participants')
        .select('*')
        .order('registered_at', { ascending: false });

      if (fetchError) throw fetchError;
      setParticipants(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch participants');
    } finally {
      setLoading(false);
    }
  };

  const runRaffle = async () => {
    setLoading(true);
    setError('');

    try {
      const eligibleParticipants = participants.filter(p => p.status === 'registered');

      if (eligibleParticipants.length < 2) {
        throw new Error('Need at least 2 participants to run raffle');
      }

      const shuffled = [...eligibleParticipants];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      const updates = shuffled.map((participant, index) => {
        const nextIndex = (index + 1) % shuffled.length;
        const giftRecipient = shuffled[nextIndex];
        const prevIndex = (index - 1 + shuffled.length) % shuffled.length;
        const secretSanta = shuffled[prevIndex];

        return {
          id: participant.id,
          gift_recipient_id: giftRecipient.id,
          secret_santa_id: secretSanta.id,
          status: 'assigned',
        };
      });

      for (const update of updates) {
        const { error: updateError } = await supabase
          .from('participants')
          .update({
            gift_recipient_id: update.gift_recipient_id,
            secret_santa_id: update.secret_santa_id,
            status: update.status,
          })
          .eq('id', update.id);

        if (updateError) throw updateError;
      }

      setShowRaffleModal(true);
      setConfetti(true);
      setTimeout(() => setConfetti(false), 5000);
      await fetchParticipants();
    } catch (err: any) {
      setError(err.message || 'Failed to run raffle');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Address', 'Wishlist', 'Status', 'Giving To', 'Secret Santa'];
    const rows = participants.map(p => {
      const recipient = participants.find(x => x.id === p.gift_recipient_id);
      const santa = participants.find(x => x.id === p.secret_santa_id);
      return [
        p.name,
        p.slack_user_id || '',
        p.address,
        p.wishlist || '',
        p.status,
        recipient?.name || '',
        santa?.name || '',
      ];
    });

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `secret-santa-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      registered: 'bg-blue-100 text-blue-800',
      assigned: 'bg-green-100 text-green-800',
      'gift_prepared': 'bg-yellow-100 text-yellow-800',
      delivered: 'bg-purple-100 text-purple-800',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-green-900 to-red-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <Lock className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-800">Admin Access</h2>
            <p className="text-gray-600 mt-2">Enter password to continue</p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4"
              placeholder="Admin email"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4"
              placeholder="Admin password"
            />
            <button type="submit" className="w-full bg-red-600 text-white py-3 rounded-lg">
              Unlock Dashboard
            </button>
          </form>

          <div className="text-center mt-6">
            <a href="/" className="text-gray-600 hover:text-gray-800 transition-colors underline">
              Back to Registration
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-green-900 to-red-900 p-4">
      {confetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {Array.from({ length: 100 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-fall"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-20px',
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
              }}
            >
              {['🎉', '🎊', '🎁', '⭐', '❄️'][Math.floor(Math.random() * 5)]}
            </div>
          ))}
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                🎅 Admin Dashboard
              </h1>
              <p className="text-gray-600">
                Manage Secret Santa participants and run the raffle
              </p>
            </div>
            <button
              onClick={() => setAuthenticated(false)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <Users className="w-8 h-8 text-blue-600 mb-2" />
            <p className="text-gray-600 text-sm">Total Participants</p>
            <p className="text-3xl font-bold text-gray-800">{participants.length}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <Sparkles className="w-8 h-8 text-green-600 mb-2" />
            <p className="text-gray-600 text-sm">Registered</p>
            <p className="text-3xl font-bold text-gray-800">
              {participants.filter(p => p.status === 'registered').length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <Shuffle className="w-8 h-8 text-purple-600 mb-2" />
            <p className="text-gray-600 text-sm">Assigned</p>
            <p className="text-3xl font-bold text-gray-800">
              {participants.filter(p => p.status === 'assigned').length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg flex flex-col gap-2">
            <button
              onClick={fetchParticipants}
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <button
              onClick={runRaffle}
              disabled={loading || participants.filter(p => p.status === 'registered').length < 2}
              className="flex-1 bg-gradient-to-r from-red-600 to-green-600 text-white px-6 py-4 rounded-lg hover:from-red-700 hover:to-green-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-bold text-lg shadow-lg flex items-center justify-center gap-2"
            >
              <Shuffle className="w-6 h-6" />
              Run Raffle
            </button>
            <button
              onClick={exportToCSV}
              disabled={participants.length === 0}
              className="flex-1 bg-gray-700 text-white px-6 py-4 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg shadow-lg flex items-center justify-center gap-2"
            >
              <Download className="w-6 h-6" />
              Export CSV
            </button>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 text-gray-700 font-semibold">Name</th>
                  <th className="text-left py-3 px-4 text-gray-700 font-semibold">Email</th>
                  <th className="text-left py-3 px-4 text-gray-700 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 text-gray-700 font-semibold">Giving To</th>
                  <th className="text-left py-3 px-4 text-gray-700 font-semibold">Secret Santa</th>
                  <th className="text-left py-3 px-4 text-gray-700 font-semibold">Wishlist</th>
                </tr>
              </thead>
              <tbody>
                {participants.map((participant) => {
                  const recipient = participants.find(p => p.id === participant.gift_recipient_id);
                  const santa = participants.find(p => p.id === participant.secret_santa_id);

                  return (
                    <tr key={participant.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{participant.name}</td>
                      <td className="py-3 px-4 text-gray-600">{participant.slack_user_id}</td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(participant.status)}`}>
                          {participant.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{recipient?.name || '-'}</td>
                      <td className="py-3 px-4 text-gray-600">{santa?.name || '-'}</td>
                      <td className="py-3 px-4 text-gray-600 max-w-xs truncate">
                        {participant.wishlist || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {participants.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No participants yet. Waiting for registrations...
              </div>
            )}
          </div>
        </div>

        <div className="text-center">
          <a href="/" className="text-white/80 hover:text-white transition-colors underline">
            Back to Registration
          </a>
        </div>
      </div>

      {showRaffleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-40">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Raffle Complete!
            </h2>
            <p className="text-gray-600 mb-6">
              All participants have been assigned their Secret Santa matches. The magic of giving begins!
            </p>
            <button
              onClick={() => setShowRaffleModal(false)}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-semibold"
            >
              Awesome!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
