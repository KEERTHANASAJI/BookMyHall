import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

function Login() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError('');
  };

  const loginHandler = async () => {
    if (!formData.username || !formData.password) {
      setError('Username and password are required.');
      return;
    }

    setIsLoading(true);
    
    try {
      const res = await axios.post('http://localhost:3000/login', formData);
      alert(res.data.message);
      console.log('Login response:', res.data);
      
      if (res.data.message === "Logged in successfully") {
        // FIXED: Using 'userId' instead of 'id' to match MyBookings.jsx expectation
        const userData = {
          username: res.data.username,
          name: res.data.name,
          userType: res.data.userType,
          userId: res.data.userId  // CHANGED FROM 'id' TO 'userId'
        };
        
        localStorage.setItem("user", JSON.stringify(userData));
        
        console.log('User data stored in localStorage:', userData);
        console.log('Full localStorage user:', localStorage.getItem("user"));
        
        if (res.data.username === "admin") {
          navigate("/admin");
        } else {
          navigate("/home"); // Changed from "/user" to "/home" to match your Try1.jsx route
        }
      }
    } catch (err) {
      console.log("Login error", err);
      if (err.response && err.response.data) {
        setError(err.response.data.message || 'Login failed. Please try again.');
      } else {
        setError('Login failed. Please check your connection and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await loginHandler();
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="logo">
          <h1>BookMyHall</h1>
        </div>
        <h2>Welcome Back</h2>
        {/* <p className="auth-subtitle">Please log in to continue</p> */}
        
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
              disabled={isLoading}
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
              disabled={isLoading}
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
              'Login'
            )}
          </button>
        </form>
        
        <div className="toggle-link">
          Don't have an account?{' '}
          <button 
            onClick={() => navigate('/signup')} 
            className="link-button"
            disabled={isLoading}
          >
            Sign up here
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;