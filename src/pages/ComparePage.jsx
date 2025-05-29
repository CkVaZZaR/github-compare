import React, { useState } from 'react';
import axios from 'axios';
import UserCard from '../components/UserCard';
import CompareTable from '../components/CompareTable';

const ComparePage = () => {
  const [username1, setUsername1] = useState('');
  const [username2, setUsername2] = useState('');
  const [user1, setUser1] = useState(null);
  const [user2, setUser2] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    if (!username1 || !username2) return;
    
    setLoading(true);
    setError('');
    
    try {
      const [res1, res2] = await Promise.all([
        axios.get(`https://api.github.com/users/${username1}`),
        axios.get(`https://api.github.com/users/${username2}`)
      ]);
      
      setUser1(res1.data);
      setUser2(res2.data);
    } catch (err) {
      setError('One or both users not found');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Compare GitHub Profiles</h1>
      <div className="compare-inputs">
        <input
          type="text"
          value={username1}
          onChange={(e) => setUsername1(e.target.value)}
          placeholder="First GitHub username"
        />
        <span>vs</span>
        <input
          type="text"
          value={username2}
          onChange={(e) => setUsername2(e.target.value)}
          placeholder="Second GitHub username"
        />
        <button onClick={fetchUsers} disabled={loading}>
          {loading ? 'Loading...' : 'Compare'}
        </button>
      </div>
      
      {error && <p className="error">{error}</p>}
      
      {user1 && user2 && (
        <div className="compare-results">
          <div className="users-container">
            <UserCard user={user1} />
            <UserCard user={user2} />
          </div>
          <CompareTable user1={user1} user2={user2} />
        </div>
      )}
    </div>
  );
};

export default ComparePage;