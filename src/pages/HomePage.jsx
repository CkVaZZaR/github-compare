import React, { useState } from 'react';
import axios from 'axios';
import UserCard from '../components/UserCard';

const HomePage = () => {
  const [username, setUsername] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchUser = async () => {
    if (!username) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.get(`https://api.github.com/users/${username}`);
      setUser(response.data);
    } catch (err) {
      setError('User not found');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>GitHub Profile Viewer</h1>
      <div className="search-container">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter GitHub username"
        />
        <button onClick={fetchUser} disabled={loading}>
          {loading ? 'Loading...' : 'Search'}
        </button>
      </div>
      
      {error && <p className="error">{error}</p>}
      {user && <UserCard user={user} />}
    </div>
  );
};

export default HomePage;