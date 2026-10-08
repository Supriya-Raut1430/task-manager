/**
 * Authentication Controller for Supabase Auth
 * Handles sign up, login, logout, and current user retrieval.
 */

const { supabase } = require('../config/supabase');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/signup
 */
exports.signup = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    // Validation
    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required.'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    if (!supabase) {
      return res.status(500).json({
        success: false,
        message: 'Supabase client is not configured. Check your environment variables.'
      });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const displayName = fullName && fullName.trim() ? fullName.trim() : trimmedEmail.split('@')[0];

    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        data: {
          full_name: displayName,
          name: displayName
        }
      }
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to create account.'
      });
    }

    const user = data.user;
    const session = data.session;

    res.status(201).json({
      success: true,
      message: session
        ? 'Account created successfully!'
        : 'Account created! Please check your email for a confirmation link, or log in.',
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
    res.status(500).json({
      success: false,
      message: 'Server error during sign up.',
      error: err.message
    });
  }
};

/**
 * @desc    Authenticate user & get session
 * @route   POST /api/auth/login
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required.'
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required.'
      });
    }

    if (!supabase) {
      return res.status(500).json({
        success: false,
        message: 'Supabase client is not configured.'
      });
    }

    const trimmedEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password
    });

    if (error) {
      return res.status(401).json({
        success: false,
        message: error.message || 'Invalid email or password.'
      });
    }

    const user = data.user;
    const session = data.session;
    const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

    res.status(200).json({
      success: true,
      message: 'Logged in successfully!',
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: displayName
        },
        token: session.access_token,
        expiresAt: session.expires_at
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error during login.',
      error: err.message
    });
  }
};

/**
 * @desc    Sign out user
 * @route   POST /api/auth/logout
 */
exports.logout = async (req, res) => {
  try {
    if (supabase) {
      await supabase.auth.signOut();
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully.'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error during logout.',
      error: err.message
    });
  }
};

/**
 * @desc    Get current authenticated user info
 * @route   GET /api/auth/me
 */
exports.getMe = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. No token provided.'
      });
    }

    const token = authHeader.split(' ')[1];

    if (!supabase) {
      return res.status(500).json({
        success: false,
        message: 'Supabase client is not configured.'
      });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: error?.message || 'Invalid or expired session token.'
      });
    }

    const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: displayName
        }
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user profile.',
      error: err.message
    });
  }
};
