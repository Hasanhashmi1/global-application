import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import './dashboard.css';

const Dashboard = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValue, setFilterValue] = useState('all');
  const [editingUser, setEditingUser] = useState(null);
  const [isFetchingAll, setIsFetchingAll] = useState(false);

  // Fetch users for current page
  useEffect(() => {
    fetchUsers(currentPage);
  }, [currentPage]);

  // Fetch all users for global search
  useEffect(() => {
    const fetchAllUsers = async () => {
      setIsFetchingAll(true);
      try {
        let allUsers = [];
        const firstPage = await fetch(`https://reqres.in/api/users?page=1`);
        const firstPageData = await firstPage.json();
        allUsers = [...firstPageData.data];
        setTotalPages(firstPageData.total_pages);

        if (firstPageData.total_pages > 1) {
          const promises = [];
          for (let i = 2; i <= firstPageData.total_pages; i++) {
            promises.push(fetch(`https://reqres.in/api/users?page=${i}`));
          }
          
          const responses = await Promise.all(promises);
          const data = await Promise.all(responses.map(res => res.json()));
          
          data.forEach(page => {
            allUsers = [...allUsers, ...page.data];
          });
        }
        
        setAllUsers(allUsers);
      } catch (error) {
        Swal.fire('Error', 'Failed to fetch all users', 'error');
      } finally {
        setIsFetchingAll(false);
      }
    };

    fetchAllUsers();
  }, []);

  const fetchUsers = async (page) => {
    setLoading(true);
    try {
      const response = await fetch(`https://reqres.in/api/users?page=${page}`);
      const data = await response.json();
      setUsers(data.data);
      setTotalPages(data.total_pages);
    } catch (error) {
      Swal.fire('Error', 'Failed to fetch users', 'error');
    } finally {
      setLoading(false);
    }
  };

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
        await fetch(`https://reqres.in/api/users/${userId}`, {
          method: 'DELETE'
        });
        
        setAllUsers(allUsers.filter(user => user.id !== userId));
        setUsers(users.filter(user => user.id !== userId));
        Swal.fire('Deleted!', 'User has been deleted.', 'success');
      } catch (error) {
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
      const response = await fetch(`https://reqres.in/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: editingUser.first_name,
          last_name: editingUser.last_name,
          email: editingUser.email
        })
      });

      if (response.ok) {
        setAllUsers(allUsers.map(user => 
          user.id === editingUser.id ? editingUser : user
        ));
        setUsers(users.map(user => 
          user.id === editingUser.id ? editingUser : user
        ));
        setEditingUser(null);
        Swal.fire('Success', 'User updated successfully', 'success');
      }
    } catch (error) {
      Swal.fire('Error', 'Failed to update user', 'error');
    }
  };

  const filteredUsers = searchTerm || filterValue !== 'all' 
    ? allUsers.filter(user => {
        const matchesSearch = 
          searchTerm === '' || 
          user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesFilter = 
          filterValue === 'all' || 
          (filterValue === 'even' && user.id % 2 === 0) || 
          (filterValue === 'odd' && user.id % 2 !== 0);
        
        return matchesSearch && matchesFilter;
      })
    : users;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>User Management</h1>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>

      <div className="controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search all users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={isFetchingAll}
          />
          <i className="search-icon">🔍</i>
          {isFetchingAll && <span className="loading-text">Loading all users...</span>}
        </div>
        
        <select 
          value={filterValue} 
          onChange={(e) => setFilterValue(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Users</option>
          <option value="even">Even IDs</option>
          <option value="odd">Odd IDs</option>
        </select>
      </div>

      {loading ? (
        <div className="loading">Loading current page...</div>
      ) : (
        <>
          {filteredUsers.length === 0 ? (
            <div className="no-results">
              {isFetchingAll ? 'Loading all users...' : 'No users found matching your criteria'}
            </div>
          ) : (
            <div className="user-cards">
              {filteredUsers.map(user => (
                <div key={user.id} className="user-card">
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

          {!searchTerm && filterValue === 'all' && (
            <div className="pagination">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || loading}
              >
                Previous
              </button>
              <span>Page {currentPage} of {totalPages}</span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || loading}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

{editingUser && (
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
                  value={editingUser.first_name}
                  onChange={(e) => setEditingUser({
                    ...editingUser,
                    first_name: e.target.value
                  })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  value={editingUser.last_name}
                  onChange={(e) => setEditingUser({
                    ...editingUser,
                    last_name: e.target.value
                  })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({
                    ...editingUser,
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