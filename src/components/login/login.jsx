import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import './login.css';

const Login = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("eve.holt@reqres.in");
  const [password, setPassword] = useState("cityslicka");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const token = await loginUser(email, password);
      if (token) {
        setIsAuthenticated(true);
        await Swal.fire({
          icon: 'success',
          title: 'Login Successful',
          text: 'Redirecting to dashboard...',
          showConfirmButton: false,
          timer: 1500
        });
        navigate("/dashboard");
      }
    } catch (error) {
      setError(error.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  async function loginUser(email, password) {
    const response = await fetch('https://reqres.in/api/login', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Login failed");
    }
    localStorage.setItem("authToken", data.token);
    return data.token;
  }

  return (
    <div className="login-container">
      <main className="form-signin">
        <form onSubmit={handleSubmit}>
          <img 
            className="logo" 
            src="https://res.cloudinary.com/dj5stvxl3/image/upload/v1737734460/cld-sample-5.jpg" 
            alt="Company Logo" 
          />
          <h1>Please Log In</h1>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <div className="form-floating">
            <input 
              type="email" 
              className="form-control" 
              id="floatingInput"
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
            <label htmlFor="floatingInput">Email address</label>
          </div>
          
          <div className="form-floating">
            <input 
              type="password" 
              className="form-control" 
              id="floatingPassword"
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
            <label htmlFor="floatingPassword">Password</label>
          </div>

          <button className="w-100 btn btn-primary" type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Signing in...
              </>
            ) : 'Sign in'}
          </button>
        </form>
      </main>
    </div>
  );
};

export default Login;