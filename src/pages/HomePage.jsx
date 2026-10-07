import React, { useState } from "react";
import axios from "axios";
import UserCard from "../components/UserCard";

const HomePage = () => {
  const [username, setUsername] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchUser = async (e) => {
    e.preventDefault();
    if (!username) return;

    setLoading(true);
    setError("");

    // try {
    //   const response = await axios.get(`https://api.github.com/users/${username}`);
    //   setUser(response.data);
    // } catch (err) {
    //   setError('User not found');
    //   setUser(null);
    // } finally {
    //   setLoading(false);
    // }

    try {
      const [userRes, reposRes] = await Promise.all([
        axios.get(`https://api.github.com/users/${username}`),
        axios.get(
          `https://api.github.com/users/${username}/repos?per_page=100`
        ),
      ]);

      const userData = userRes.data;
      userData.repos = reposRes.data;

      // Анализ языков программирования
      const languageStats = {};
      reposRes.data.forEach((repo) => {
        if (repo.language) {
          languageStats[repo.language] =
            (languageStats[repo.language] || 0) + 1;
        }
      });

      userData.languageStats = languageStats;
      setUser(userData);
    } catch {
      setError("User not found");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>GitHub Profile Viewer</h1>
      <form className='search-container' onSubmit={fetchUser}>
        <input
          type='text'
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder='Enter GitHub username'
        />
        <button type='submit' disabled={loading}>
          {loading ? "Loading..." : "Search"}
        </button>
      </form>

      {error && <p className='error'>{error}</p>}
      {user && <UserCard user={user} />}
    </div>
  );
};

export default HomePage;
