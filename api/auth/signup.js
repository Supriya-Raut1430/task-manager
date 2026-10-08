const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

  try {
    const { fullName, email, password } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    const trimmedEmail = email.trim().toLowerCase();
    const displayName = fullName && fullName.trim() ? fullName.trim() : trimmedEmail.split('@')[0];

    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        data: { full_name: displayName, name: displayName }
      }
    });

    if (error) {
      return res.status(400).json({ success: false, message: error.message || 'Failed to create account.' });
    }

    const user = data.user;
    const session = data.session;

    return res.status(201).json({
      success: true,
      message: session
        ? 'Account created successfully!'
        : 'Account created! Please check your email for a confirmation link.',
      data: {
        user: {
          id: user?.id,
          email: user?.email,
          fullName: user?.user_metadata?.full_name || displayName
        },
        token: session?.access_token || null,
        needsEmailConfirmation: !session
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error during sign up.', error: err.message });
  }
};
