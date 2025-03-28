import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import './edit-user.css';

const EditUser = ({ setIsAuthenticated }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState({
    first_name: '',
    last_name: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const response = await fetch(`https://reqres.in/api/users/${id}`);
        const data = await response.json();
        setUser(data.data);
      } catch (error) {
        Swal.fire('Error', 'Failed to fetch user data', 'error');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch(`https://reqres.in/api/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email
        })
      });

      if (response.ok) {
        await Swal.fire('Success', 'User updated successfully', 'success');
        navigate('/dashboard');
      } else {
        throw new Error('Failed to update user');
      }
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  if (loading && !user.first_name) {
    return <div className="loading">Loading user data...</div>;
  }

  return (
    <div className="edit-user-container">
      <div className="edit-form">
        <h2>Edit User</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>First Name</label>
            <input
              type="text"
              name="first_name"
              value={user.first_name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Last Name</label>
            <input
              type="text"
              name="last_name"
              value={user.last_name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={user.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-actions">
            <button type="button" onClick={handleCancel} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUser;