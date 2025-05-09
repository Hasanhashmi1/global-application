import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import './dashboard.css';

const Dashboard = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();
  const [state, setState] = useState({
    users: [],
    allUsers: [],
    currentPage: 1,
    totalPages: 2, // Hardcoded since we know there are only 2 pages
    loading: false,
    searchTerm: '',
    filterValue: 'all',
    editingUser: null,
    isFetchingAll: false,
    error: null
  });

  const API_KEY = 'reqres-free-v1';

  // Fetch users for a specific page
  const fetchUsers = useCallback(async (page) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await fetch(`https://reqres.in/api/users?page=${page}`, {
        headers: {
          'x-api-key': API_KEY,
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      setState(prev => ({
        ...prev,
        users: data.data || [],
        loading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error.message,
        loading: false
      }));
      Swal.fire('Error', 'Failed to fetch users', 'error');
    }
  }, []);

  // Fetch all users from both pages
  const fetchAllUsers = useCallback(async () => {
    setState(prev => ({ ...prev, isFetchingAll: true, error: null }));
    try {
      // Fetch both pages in parallel
      const [page1Response, page2Response] = await Promise.all([
        fetch(`https://reqres.in/api/users?page=1`, {
          headers: {
            'x-api-key': API_KEY,
            'Accept': 'application/json'
          }
        }),
        fetch(`https://reqres.in/api/users?page=2`, {
          headers: {
            'x-api-key': API_KEY,
            'Accept': 'application/json'
          }
        })
      ]);
      
      if (!page1Response.ok || !page2Response.ok) {
        throw new Error(`HTTP error! status: ${!page1Response.ok ? page1Response.status : page2Response.status}`);
      }
      
      const [page1Data, page2Data] = await Promise.all([
        page1Response.json(),
        page2Response.json()
      ]);
      
      const allUsers = [
        ...(page1Data.data || []),
        ...(page2Data.data || [])
      ];
      
      setState(prev => ({
        ...prev,
        allUsers,
        isFetchingAll: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error.message,
        isFetchingAll: false
      }));
      Swal.fire('Error', 'Failed to fetch all users', 'error');
    }
  }, []);

  // Fetch users on page change
  useEffect(() => {
    fetchUsers(state.currentPage);
  }, [state.currentPage, fetchUsers]);

  // Fetch all users on mount
  useEffect(() => {
    fetchAllUsers();
  }, [fetchAllUsers]);

  const handleDelete = async (userId) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`https://reqres.in/api/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'x-api-key': API_KEY,
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        setState(prev => ({
          ...prev,
          users: prev.users.filter(user => user.id !== userId),
          allUsers: prev.allUsers.filter(user => user.id !== userId)
        }));
        Swal.fire('Deleted!', 'User has been deleted.', 'success');
      } catch (error) {
        setState(prev => ({ ...prev, error: error.message }));
        Swal.fire('Error', 'Failed to delete user', 'error');
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setIsAuthenticated(false);
    navigate('/login');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`https://reqres.in/api/users/${state.editingUser.id}`, {
        method: 'PUT',
        headers: {
          'x-api-key': API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: state.editingUser.first_name,
          last_name: state.editingUser.last_name,
          email: state.editingUser.email
        })
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const updatedUser = await response.json();
      
      setState(prev => ({
        ...prev,
        users: prev.users.map(user => 
          user.id === state.editingUser.id ? { ...user, ...updatedUser } : user
        ),
        allUsers: prev.allUsers.map(user => 
          user.id === state.editingUser.id ? { ...user, ...updatedUser } : user
        ),
        editingUser: null
      }));
      Swal.fire('Success', 'User updated successfully', 'success');
    } catch (error) {
      setState(prev => ({ ...prev, error: error.message }));
      Swal.fire('Error', 'Failed to update user', 'error');
    }
  };

  // Derived state for filtered users
  const filteredUsers = React.useMemo(() => {
    const source = (state.searchTerm || state.filterValue !== 'all') 
      ? state.allUsers 
      : state.users;

    return (source || []).filter(user => {
      const matchesSearch = 
        state.searchTerm === '' || 
        (user.first_name?.toLowerCase().includes(state.searchTerm.toLowerCase())) ||
        (user.last_name?.toLowerCase().includes(state.searchTerm.toLowerCase())) ||
        (user.email?.toLowerCase().includes(state.searchTerm.toLowerCase()));
      
      const matchesFilter = 
        state.filterValue === 'all' || 
        (state.filterValue === 'even' && user.id % 2 === 0) || 
        (state.filterValue === 'odd' && user.id % 2 !== 0);
      
      return matchesSearch && matchesFilter;
    });
  }, [state.searchTerm, state.filterValue, state.users, state.allUsers]);

  // Helper functions for state updates
  const setSearchTerm = (term) => setState(prev => ({ ...prev, searchTerm: term }));
  const setFilterValue = (value) => setState(prev => ({ ...prev, filterValue: value }));
  const setEditingUser = (user) => setState(prev => ({ ...prev, editingUser: user }));
  const setCurrentPage = (page) => setState(prev => ({ ...prev, currentPage: page }));

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>User Management</h1>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>

      {state.error && (
        <div className="error-message">
          Error: {state.error}
        </div>
      )}

      <div className="controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search all users..."
            value={state.searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={state.isFetchingAll}
          />
          <i className="search-icon">🔍</i>
          {state.isFetchingAll && <span className="loading-text">Loading all users...</span>}
        </div>
        
        <select 
          value={state.filterValue} 
          onChange={(e) => setFilterValue(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Users</option>
          <option value="even">Even IDs</option>
          <option value="odd">Odd IDs</option>
        </select>
      </div>

      {state.loading ? (
        <div className="loading">Loading current page...</div>
      ) : (
        <>
          {filteredUsers.length === 0 ? (
            <div className="no-results">
              {state.isFetchingAll ? 'Loading all users...' : 'No users found matching your criteria'}
            </div>
          ) : (
            <div className="user-cards">
              {filteredUsers.map(user => (
                <div key={`${user.id}-${user.email}`} className="user-card">
                  <img src={user.avatar} alt={`${user.first_name} ${user.last_name}`} />
                  <div className="user-info">
                    <h3>{user.first_name} {user.last_name}</h3>
                    <p>{user.email}</p>
                  </div>
                  <div className="user-actions">
                    <button 
                      onClick={() => setEditingUser(user)}
                      className="btn btn-sm btn-primary"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(user.id)}
                      className="btn btn-sm btn-danger"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!state.searchTerm && state.filterValue === 'all' && (
            <div className="pagination">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={state.currentPage === 1 || state.loading}
                className={state.currentPage === 1 ? 'active' : ''}
              >
                Page 1
              </button>
              <button
                onClick={() => setCurrentPage(2)}
                disabled={state.currentPage === 2 || state.loading}
                className={state.currentPage === 2 ? 'active' : ''}
              >
                Page 2
              </button>
            </div>
          )}
        </>
      )}

      {state.editingUser && (
        <div className="modal-overlay" onClick={() => setEditingUser(null)}>
          <div className="modal-main-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit User</h3>
              <button 
                onClick={() => setEditingUser(null)}
                className="close-btn"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  value={state.editingUser.first_name || ''}
                  onChange={(e) => setEditingUser({
                    ...state.editingUser,
                    first_name: e.target.value
                  })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  value={state.editingUser.last_name || ''}
                  onChange={(e) => setEditingUser({
                    ...state.editingUser,
                    last_name: e.target.value
                  })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={state.editingUser.email || ''}
                  onChange={(e) => setEditingUser({
                    ...state.editingUser,
                    email: e.target.value
                  })}
                  required
                />
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  onClick={() => setEditingUser(null)} 
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;