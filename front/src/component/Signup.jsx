import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

function Signup() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError('');
  };

  const signupHandler = async () => {
    if (!formData.username || !formData.password) {
      setError('Username and password are required.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    
    try {
      const res = await axios.post('http://localhost:3000/signup', formData);
      alert(res.data.message);
      console.log(res.data.message);
      
      if (res.data.message === "User created successfully") {
        navigate('/');
      }
    } catch (err) {
      console.log("Signup error", err);
      alert("An error occurred during signup");
      setError('Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await signupHandler();
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="logo">
          <h1>BookMyHall</h1>
        </div>
        <h2>Create Account</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              placeholder="Enter your username"
              value={formData.username}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
            />
          </div>
          <button 
            type="submit" 
            className="auth-button"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="wave-loader">
                <div></div>
                <div></div>
                <div></div>
              </div>
            ) : (
              'Sign Up'
            )}
          </button>
        </form>
        <div className="toggle-link">
          Already have an account?{' '}
          <button onClick={() => navigate('/')} className="link-button">
            Login here
          </button>
        </div>
      </div>
    </div>
  );
}

export default Signup;