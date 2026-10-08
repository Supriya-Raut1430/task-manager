/**
 * TaskFlow — Client-side Authentication Script (public/auth.js)
 * Manages form validation, theme switching, password toggles,
 * and communication with /api/auth endpoints (Vercel serverless functions).
 */

document.addEventListener('DOMContentLoaded', () => {
  // ========================================================================
  // 1. Theme Management (Synced with TaskFlow main app)
  // ========================================================================
  const themeToggleBtn = document.getElementById('themeToggleBtn');

  const initTheme = () => {
    const savedTheme = localStorage.getItem('taskflow_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
  };

  const toggleTheme = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('taskflow_theme', newTheme);
  };

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', toggleTheme);
  }
  initTheme();

  // ========================================================================
  // 2. DOM Elements
  // ========================================================================
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const authAlert = document.getElementById('authAlert');
  const btnSubmitAuth = document.getElementById('btnSubmitAuth');
  const btnDemoLogin = document.getElementById('btnDemoLogin');
  const btnForgotPwd = document.getElementById('btnForgotPwd');

  // Input Fields
  const fullNameInput = document.getElementById('fullName');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const togglePwdBtn = document.getElementById('togglePwdBtn');
  const toggleConfirmPwdBtn = document.getElementById('toggleConfirmPwdBtn');

  // Error Message Elements
  const nameError = document.getElementById('nameError');
  const emailError = document.getElementById('emailError');
  const passwordError = document.getElementById('passwordError');
  const confirmPasswordError = document.getElementById('confirmPasswordError');

  // Password Strength Meter Elements (Signup page)
  const pwdMeterWrap = document.getElementById('pwdMeterWrap');
  const pwdMeterFill = document.getElementById('pwdMeterFill');
  const pwdMeterText = document.getElementById('pwdMeterText');

  // ========================================================================
  // 3. Password Visibility Toggles
  // ========================================================================
  const setupPasswordToggle = (button, input) => {
    if (!button || !input) return;
    button.addEventListener('click', () => {
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';

      const showIcon = button.querySelector('.eye-show');
      const hideIcon = button.querySelector('.eye-hide');

      if (showIcon && hideIcon) {
        showIcon.classList.toggle('hidden', isPassword);
        hideIcon.classList.toggle('hidden', !isPassword);
      }
    });
  };

  setupPasswordToggle(togglePwdBtn, passwordInput);
  setupPasswordToggle(toggleConfirmPwdBtn, confirmPasswordInput);

  // ========================================================================
  // 4. Password Strength Calculation
  // ========================================================================
  if (passwordInput && pwdMeterFill && pwdMeterText) {
    passwordInput.addEventListener('input', () => {
      const val = passwordInput.value;
      if (!val) {
        pwdMeterFill.style.width = '0%';
        pwdMeterFill.className = 'pwd-meter-fill';
        pwdMeterText.textContent = 'Password strength';
        return;
      }

      let score = 0;
      if (val.length >= 6) score += 1;
      if (val.length >= 10) score += 1;
      if (/[A-Z]/.test(val) && /[a-z]/.test(val)) score += 1;
      if (/[0-9]/.test(val)) score += 1;
      if (/[^A-Za-z0-9]/.test(val)) score += 1;

      if (score <= 2) {
        pwdMeterFill.style.width = '33%';
        pwdMeterFill.className = 'pwd-meter-fill strength-weak';
        pwdMeterText.textContent = 'Weak password (add numbers or special characters)';
      } else if (score <= 3) {
        pwdMeterFill.style.width = '66%';
        pwdMeterFill.className = 'pwd-meter-fill strength-medium';
        pwdMeterText.textContent = 'Medium strength';
      } else {
        pwdMeterFill.style.width = '100%';
        pwdMeterFill.className = 'pwd-meter-fill strength-strong';
        pwdMeterText.textContent = 'Strong password!';
      }
    });
  }

  // ========================================================================
  // 5. Alert Notifications
  // ========================================================================
  const showAlert = (message, type = 'error') => {
    if (!authAlert) return;
    authAlert.textContent = message;
    authAlert.className = `auth-alert alert-${type}`;
    authAlert.classList.remove('hidden');
    authAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const hideAlert = () => {
    if (!authAlert) return;
    authAlert.classList.add('hidden');
    authAlert.textContent = '';
  };

  const setSubmitting = (isSubmitting, defaultText = 'Submit') => {
    if (!btnSubmitAuth) return;
    btnSubmitAuth.disabled = isSubmitting;
    const btnText = btnSubmitAuth.querySelector('.btn-text');
    const btnSpinner = btnSubmitAuth.querySelector('.btn-spinner');

    if (btnText && btnSpinner) {
      if (isSubmitting) {
        btnText.textContent = 'Processing...';
        btnSpinner.classList.remove('hidden');
      } else {
        btnText.textContent = defaultText;
        btnSpinner.classList.add('hidden');
      }
    }
  };

  // Helper validation
  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // ========================================================================
  // 6. Login Form Submission Handler
  // ========================================================================
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAlert();
      if (emailError) emailError.textContent = '';
      if (passwordError) passwordError.textContent = '';

      const emailVal = emailInput.value.trim();
      const pwdVal = passwordInput.value;

      let hasError = false;

      if (!emailVal) {
        emailError.textContent = 'Please enter your email address.';
        hasError = true;
      } else if (!validateEmail(emailVal)) {
        emailError.textContent = 'Please enter a valid email address.';
        hasError = true;
      }

      if (!pwdVal) {
        passwordError.textContent = 'Please enter your password.';
        hasError = true;
      }

      if (hasError) return;

      setSubmitting(true, 'Sign In');

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailVal, password: pwdVal })
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'Invalid email or password.');
        }

        // Store session in localStorage
        if (result.data) {
          localStorage.setItem('taskflow_user', JSON.stringify(result.data.user));
          if (result.data.token) {
            localStorage.setItem('taskflow_token', result.data.token);
          }
        }

        showAlert('Login successful! Redirecting to dashboard...', 'success');

        setTimeout(() => {
          window.location.href = '/';
        }, 900);
      } catch (err) {
        showAlert(err.message, 'error');
      } finally {
        setSubmitting(false, 'Sign In');
      }
    });
  }

  // ========================================================================
  // 7. Signup Form Submission Handler
  // ========================================================================
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAlert();
      if (nameError) nameError.textContent = '';
      if (emailError) emailError.textContent = '';
      if (passwordError) passwordError.textContent = '';
      if (confirmPasswordError) confirmPasswordError.textContent = '';

      const nameVal = fullNameInput.value.trim();
      const emailVal = emailInput.value.trim();
      const pwdVal = passwordInput.value;
      const confirmPwdVal = confirmPasswordInput.value;

      let hasError = false;

      if (!nameVal) {
        nameError.textContent = 'Please enter your full name.';
        hasError = true;
      } else if (nameVal.length < 2) {
        nameError.textContent = 'Name must be at least 2 characters.';
        hasError = true;
      }

      if (!emailVal) {
        emailError.textContent = 'Please enter your email address.';
        hasError = true;
      } else if (!validateEmail(emailVal)) {
        emailError.textContent = 'Please enter a valid email address.';
        hasError = true;
      }

      if (!pwdVal) {
        passwordError.textContent = 'Please enter a password.';
        hasError = true;
      } else if (pwdVal.length < 6) {
        passwordError.textContent = 'Password must be at least 6 characters.';
        hasError = true;
      }

      if (pwdVal !== confirmPwdVal) {
        confirmPasswordError.textContent = 'Passwords do not match.';
        hasError = true;
      }

      if (hasError) return;

      setSubmitting(true, 'Create Account');

      try {
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: nameVal,
            email: emailVal,
            password: pwdVal
          })
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'Failed to create account.');
        }

        if (result.data && result.data.user) {
          localStorage.setItem('taskflow_user', JSON.stringify(result.data.user));
          if (result.data.token) {
            localStorage.setItem('taskflow_token', result.data.token);
          }
        }

        showAlert(result.message || 'Account created successfully! Redirecting...', 'success');

        setTimeout(() => {
          window.location.href = '/';
        }, 1200);
      } catch (err) {
        showAlert(err.message, 'error');
      } finally {
        setSubmitting(false, 'Create Account');
      }
    });
  }

  // ========================================================================
  // 8. Instant Demo Sign In (1-Click Test Access)
  // ========================================================================
  if (btnDemoLogin) {
    btnDemoLogin.addEventListener('click', () => {
      hideAlert();
      const demoUser = {
        id: 'demo-user-' + Math.random().toString(36).substring(2, 9),
        email: 'alex.demo@taskflow.dev',
        fullName: 'Alex Morgan'
      };

      localStorage.setItem('taskflow_user', JSON.stringify(demoUser));
      localStorage.setItem('taskflow_token', 'demo_token_' + Date.now());

      showAlert('Signed in as Demo User (Alex Morgan)! Redirecting...', 'success');

      setTimeout(() => {
        window.location.href = '/';
      }, 700);
    });
  }

  // ========================================================================
  // 9. Forgot Password Helper
  // ========================================================================
  if (btnForgotPwd) {
    btnForgotPwd.addEventListener('click', () => {
      showAlert('Password reset emails can be triggered via your Supabase dashboard authentication settings.', 'info');
    });
  }
});
