const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

  try {
    const { email, password } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }
    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required.' });
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password
    });

    if (error) {
      return res.status(401).json({ success: false, message: error.message || 'Invalid email or password.' });
    }

    const user = data.user;
    const session = data.session;
    const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully!',
      data: {
        user: { id: user.id, email: user.email, fullName: displayName },
        token: session.access_token,
        expiresAt: session.expires_at
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error during login.', error: err.message });
  }
};
