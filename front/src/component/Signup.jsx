import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

const Signup = () => {
  const [isSignInView, setIsSignInView] = useState(true);
  const [isSwapping, setIsSwapping] = useState(false);
  const [signUpStep, setSignUpStep] = useState(1);
  const cardWrapperRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!document.querySelector('link[href*="fonts.googleapis.com"]')) {
      const googleFontLink = document.createElement('link');
      googleFontLink.href =
        'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap';
      googleFontLink.rel = 'stylesheet';
      document.head.appendChild(googleFontLink);
    }
    if (!document.querySelector('link[href*="font-awesome"]')) {
      const fontAwesomeLink = document.createElement('link');
      fontAwesomeLink.href =
        'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css';
      fontAwesomeLink.rel = 'stylesheet';
      document.head.appendChild(fontAwesomeLink);
    }
  }, []);

  const [signInData, setSignInData] = useState({ username: '', password: '' });
  const [signInErrors, setSignInErrors] = useState({});

  const [signUpData, setSignUpData] = useState({
    username: '',
    password: '',
    securityQuestion1: '',
    securityAnswer1: '',
    securityQuestion2: '',
    securityAnswer2: ''
  });
  const [signUpErrors, setSignUpErrors] = useState({});

  const [toast, setToast] = useState({ show: false, message: '', isError: false });
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotData, setForgotData] = useState({
    username: '',
    securityQuestion1: '',
    securityAnswer1: '',
    securityQuestion2: '',
    securityAnswer2: '',
    newPassword: ''
  });
  const [forgotErrors, setForgotErrors] = useState({});

  const showToast = (message, isError = false) => {
    setToast({ show: true, message, isError });
    setTimeout(() => setToast({ show: false, message: '', isError: false }), 3500);
  };

  const clearErrors = () => {
    setSignInErrors({});
    setSignUpErrors({});
  };

  const swapToSignUp = () => {
    if (!isSignInView || isSwapping) return;
    setIsSwapping(true);
    if (cardWrapperRef.current) cardWrapperRef.current.classList.add('swap-active');
    setTimeout(() => {
      setIsSignInView(false);
      setSignUpStep(1);
      setIsSwapping(false);
      clearErrors();
    }, 400);
  };

  const swapToSignIn = () => {
    if (isSignInView || isSwapping) return;
    setIsSwapping(true);
    if (cardWrapperRef.current) cardWrapperRef.current.classList.remove('swap-active');
    setTimeout(() => {
      setIsSignInView(true);
      setSignUpStep(1);
      setIsSwapping(false);
      clearErrors();
    }, 400);
  };

  const validateStep1 = () => {
    const errors = {};
    const { username, password } = signUpData;
    if (!username) errors.username = 'Username required';
    else if (username.length < 3) errors.username = 'Min 3 characters';
    else if (!/^[a-zA-Z0-9_]+$/.test(username)) errors.username = 'Only letters, numbers & underscores';
    if (!password) errors.password = 'Password required';
    else if (password.length < 5) errors.password = 'Min 5 characters';
    return errors;
  };

  const handleAdvanceToSecurity = () => {
    const errors = validateStep1();
    if (Object.keys(errors).length > 0) {
      setSignUpErrors(errors);
      showToast('Please fill in your details first', true);
      return;
    }
    setSignUpErrors({});
    setSignUpStep(2);
  };

  const handleBackToBasic = () => {
    setSignUpStep(1);
    setSignUpErrors({});
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    const errors = {};
    const { username, password } = signInData;
    if (!username) errors.username = 'Username required';
    if (!password) errors.password = 'Password required';
    else if (password.length < 4) errors.password = 'At least 4 characters';

    if (Object.keys(errors).length > 0) {
      setSignInErrors(errors);
      showToast('Please fix sign-in errors', true);
      return;
    }

    try {
      const res = await axios.post('http://localhost:3000/login', signInData);
      showToast(res.data.message);
      if (res.data.message === 'Logged in successfully') {
        localStorage.setItem('user', JSON.stringify({
          username: res.data.username,
          name: res.data.name,
          userType: res.data.userType,
          userId: res.data.userId
        }));
        if (res.data.username === 'admin') {
          navigate('/admin');
        } else {
          navigate('/home');
        }
      }
    } catch (err) {
      console.log('Login error', err);
      showToast(err.response?.data?.message || 'Login failed. Please check your connection.', true);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    const errors = {};
    const { securityQuestion1, securityAnswer1, securityQuestion2, securityAnswer2, username, password } = signUpData;

    if (!username) errors.username = 'Username required';
    else if (username.length < 3) errors.username = 'Min 3 characters';
    if (!password) errors.password = 'Password required';
    else if (password.length < 5) errors.password = 'Min 5 characters';
    if (!securityQuestion1) errors.securityQuestion1 = 'Select a question';
    if (!securityAnswer1) errors.securityAnswer1 = 'Answer required';
    if (!securityQuestion2) errors.securityQuestion2 = 'Select second question';
    if (!securityAnswer2) errors.securityAnswer2 = 'Answer required';
    if (securityQuestion1 && securityQuestion2 && securityQuestion1 === securityQuestion2)
      errors.securityQuestion2 = 'Choose a different question';

    if (Object.keys(errors).length > 0) {
      setSignUpErrors(errors);
      showToast('Please complete all fields', true);
      return;
    }

    try {
      const res = await axios.post('http://localhost:3000/signup', signUpData);
      showToast(res.data.message);
      if (res.data.message === 'User created successfully') {
        setTimeout(() => {
          swapToSignIn();
          setSignInData(prev => ({ ...prev, username: signUpData.username }));
          setSignUpData({ username: '', password: '', securityQuestion1: '', securityAnswer1: '', securityQuestion2: '', securityAnswer2: '' });
          navigate('/');
        }, 1000);
      }
    } catch (err) {
      console.log('Signup error', err);
      showToast(err.response?.data?.message || 'Signup failed. Please try again.', true);
    }
  };

  const handleSignInChange = (e) => {
    setSignInData({ ...signInData, [e.target.name]: e.target.value });
    if (signInErrors[e.target.name]) setSignInErrors({ ...signInErrors, [e.target.name]: '' });
  };

  const handleSignUpChange = (e) => {
    setSignUpData({ ...signUpData, [e.target.name]: e.target.value });
    if (signUpErrors[e.target.name]) setSignUpErrors({ ...signUpErrors, [e.target.name]: '' });
  };

  const handleForgotChange = (e) => {
    setForgotData({ ...forgotData, [e.target.name]: e.target.value });
    if (forgotErrors[e.target.name]) setForgotErrors({ ...forgotErrors, [e.target.name]: '' });
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!forgotData.username) errors.username = 'Username required';
    if (!forgotData.securityQuestion1) errors.securityQuestion1 = 'Select question 1';
    if (!forgotData.securityAnswer1) errors.securityAnswer1 = 'Answer required';
    if (!forgotData.securityQuestion2) errors.securityQuestion2 = 'Select question 2';
    if (!forgotData.securityAnswer2) errors.securityAnswer2 = 'Answer required';
    if (!forgotData.newPassword) errors.newPassword = 'Enter new password';

    if (Object.keys(errors).length > 0) {
      setForgotErrors(errors);
      return;
    }

    try {
      const res = await axios.post('http://localhost:3000/forgot-password', forgotData);
      showToast(res.data.message);
      if (res.data.message === 'Password updated successfully') {
        setTimeout(() => {
          setShowForgotPassword(false);
          setForgotData({ username: '', securityQuestion1: '', securityAnswer1: '', securityQuestion2: '', securityAnswer2: '', newPassword: '' });
        }, 1000);
      }
    } catch (err) {
      console.log('Forgot password error:', err.response?.data || err);
      showToast(`Password reset failed: ${err.response?.data?.message || err.message || 'Unknown error'}`, true);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    setShowForgotPassword(true);
  };

  return (
    <div className="auth-page">
      <div className="auth-container">

        {toast.show && (
          <div className={`booking-toast ${toast.isError ? 'error-toast' : 'success-toast'}`}>
            <i className={`fas ${toast.isError ? 'fa-exclamation-triangle' : 'fa-circle-check'}`}></i>
            {toast.message}
          </div>
        )}

        <div className="card-wrapper" ref={cardWrapperRef}>

          {/* ── WHITE PANEL ── */}
          <div className="panel panel-white">
            <div className="panel-inner">

              {/* Sign In */}
              <div style={{ display: isSignInView ? 'block' : 'none' }}>
                <h2>Login to BookMyHall</h2>
                <div className="divider"><span>use your username</span></div>

                {!showForgotPassword ? (
                  <form onSubmit={handleSignIn}>
                    <div className="input-group">
                      <input type="text" name="username" placeholder="Username"
                        value={signInData.username} onChange={handleSignInChange} autoComplete="off" />
                      {signInErrors.username && <span className="error-text">{signInErrors.username}</span>}
                    </div>
                    <div className="input-group">
                      <input type="password" name="password" placeholder="Password"
                        value={signInData.password} onChange={handleSignInChange} />
                      {signInErrors.password && <span className="error-text">{signInErrors.password}</span>}
                    </div>
                    <div className="forgot-link">
                      <a href="#" onClick={handleForgotPassword}>Forgot your password?</a>
                    </div>
                    <button type="submit" className="btn-primary">LOGIN</button>
                  </form>
                ) : (
                  <form onSubmit={handleForgotSubmit}>
                    <div className="step-back-row">
                      <button type="button" className="step-back-btn"
                        onClick={() => setShowForgotPassword(false)}>
                        <i className="fas fa-chevron-up"></i>
                      </button>
                      <span className="step-hint">Recover password</span>
                    </div>
                    <div className="input-group">
                      <input type="text" name="username" placeholder="Username"
                        value={forgotData.username} onChange={handleForgotChange} />
                      {forgotErrors.username && <span className="error-text">{forgotErrors.username}</span>}
                    </div>
                    <div className="input-group">
                      <select name="securityQuestion1" value={forgotData.securityQuestion1} onChange={handleForgotChange}>
                        <option value="">Select security question 1</option>
                        <option value="What is your mother's maiden name?">What is your mother's maiden name?</option>
                        <option value="What was your first pet's name?">What was your first pet's name?</option>
                        <option value="What is the name of your first school?">Name of your first school?</option>
                        <option value="What city were you born in?">What city were you born in?</option>
                      </select>
                      {forgotErrors.securityQuestion1 && <span className="error-text">{forgotErrors.securityQuestion1}</span>}
                    </div>
                    <div className="input-group">
                      <input type="text" name="securityAnswer1" placeholder="Answer 1"
                        value={forgotData.securityAnswer1} onChange={handleForgotChange} />
                      {forgotErrors.securityAnswer1 && <span className="error-text">{forgotErrors.securityAnswer1}</span>}
                    </div>
                    <div className="input-group">
                      <select name="securityQuestion2" value={forgotData.securityQuestion2} onChange={handleForgotChange}>
                        <option value="">Select security question 2</option>
                        <option value="What was your favorite childhood teacher's name?">Favorite teacher's name?</option>
                        <option value="What is your favorite book?">What is your favorite book?</option>
                        <option value="What was the model of your first car?">Model of your first car?</option>
                        <option value="What is your dream vacation destination?">Dream vacation destination?</option>
                      </select>
                      {forgotErrors.securityQuestion2 && <span className="error-text">{forgotErrors.securityQuestion2}</span>}
                    </div>
                    <div className="input-group">
                      <input type="text" name="securityAnswer2" placeholder="Answer 2"
                        value={forgotData.securityAnswer2} onChange={handleForgotChange} />
                      {forgotErrors.securityAnswer2 && <span className="error-text">{forgotErrors.securityAnswer2}</span>}
                    </div>
                    <div className="input-group">
                      <input type="password" name="newPassword" placeholder="New Password"
                        value={forgotData.newPassword} onChange={handleForgotChange} />
                      {forgotErrors.newPassword && <span className="error-text">{forgotErrors.newPassword}</span>}
                    </div>
                    <button type="submit" className="btn-primary">RESET PASSWORD</button>
                  </form>
                )}
              </div>

              {/* Sign Up */}
              <div style={{ display: !isSignInView ? 'block' : 'none' }}>
                <h2>Create Account</h2>
                <div className="divider"><span>Create your username and password</span></div>

                <form onSubmit={handleSignUp}>
                  {/* Step 1 */}
                  <div className={`signup-step ${signUpStep === 1 ? 'step-visible' : 'step-hidden'}`}>
                    <div className="input-group">
                      <input type="text" name="username" placeholder="Username"
                        value={signUpData.username} onChange={handleSignUpChange} autoComplete="username" />
                      {signUpErrors.username && <span className="error-text">{signUpErrors.username}</span>}
                    </div>
                    <div className="input-group">
                      <input type="password" name="password" placeholder="Password"
                        value={signUpData.password} onChange={handleSignUpChange} autoComplete="new-password" />
                      {signUpErrors.password && <span className="error-text">{signUpErrors.password}</span>}
                    </div>
                    <div className="step-advance-row">
                      <span className="step-hint">Set up security questions</span>
                      <button type="button" className="step-arrow-btn"
                        onClick={handleAdvanceToSecurity} aria-label="Continue to security questions">
                        <i className="fas fa-chevron-down"></i>
                      </button>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className={`signup-step ${signUpStep === 2 ? 'step-visible' : 'step-hidden'}`}>
                    <div className="step-back-row">
                      <button type="button" className="step-back-btn"
                        onClick={handleBackToBasic} aria-label="Back to account details">
                        <i className="fas fa-chevron-up"></i>
                      </button>
                      <span className="step-hint">Security questions</span>
                    </div>
                    <div className="input-group">
                      <select name="securityQuestion1" value={signUpData.securityQuestion1} onChange={handleSignUpChange}>
                        <option value="">Select security question 1</option>
                        <option value="What is your mother's maiden name?">What is your mother's maiden name?</option>
                        <option value="What was your first pet's name?">What was your first pet's name?</option>
                        <option value="What is the name of your first school?">Name of your first school?</option>
                        <option value="What city were you born in?">What city were you born in?</option>
                      </select>
                      {signUpErrors.securityQuestion1 && <span className="error-text">{signUpErrors.securityQuestion1}</span>}
                    </div>
                    <div className="input-group">
                      <input type="text" name="securityAnswer1" placeholder="Answer to question 1"
                        value={signUpData.securityAnswer1} onChange={handleSignUpChange} />
                      {signUpErrors.securityAnswer1 && <span className="error-text">{signUpErrors.securityAnswer1}</span>}
                    </div>
                    <div className="input-group">
                      <select name="securityQuestion2" value={signUpData.securityQuestion2} onChange={handleSignUpChange}>
                        <option value="">Select security question 2</option>
                        <option value="What was your favorite childhood teacher's name?">Favorite teacher's name?</option>
                        <option value="What is your favorite book?">What is your favorite book?</option>
                        <option value="What was the model of your first car?">Model of your first car?</option>
                        <option value="What is your dream vacation destination?">Dream vacation destination?</option>
                      </select>
                      {signUpErrors.securityQuestion2 && <span className="error-text">{signUpErrors.securityQuestion2}</span>}
                    </div>
                    <div className="input-group">
                      <input type="text" name="securityAnswer2" placeholder="Answer to question 2"
                        value={signUpData.securityAnswer2} onChange={handleSignUpChange} />
                      {signUpErrors.securityAnswer2 && <span className="error-text">{signUpErrors.securityAnswer2}</span>}
                    </div>
                    <button type="submit" className="btn-primary" style={{ marginTop: '6px' }}>SIGN UP</button>
                  </div>
                </form>
              </div>

            </div>
          </div>

          {/* ── BLUE PANEL ── */}
          <div className="panel panel-blue">
            <div className="panel-inner">

              <div style={{ display: isSignInView ? 'block' : 'none' }}>
                <h2>Hello, Friend!</h2>
                <p>Enter your personal details and start journey with us</p>
                <button onClick={swapToSignUp} className="btn-outline-light">SIGN UP</button>
                <div className="hall-badge">
                  <i className="fas fa-calendar-check"></i>
                  <span>HallBooking · premium venues</span>
                </div>
              </div>

              <div style={{ display: !isSignInView ? 'block' : 'none' }}>
                <h2>Welcome Back!</h2>
                <p>To keep connected with us please login with your personal info</p>
                <button onClick={swapToSignIn} className="btn-outline-light">SIGN IN</button>
                <div className="hall-badge">
                  <i className="fas fa-calendar-check"></i>
                  <span>HallBooking · secure & smooth</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Signup;
