// src/components/UserCard.jsx
import React from "react";
import UserCharts from "./UserCharts";

const UserCard = ({ user }) => {
  if (!user) return <div>Loading...</div>;

  // Рассчитываем топ-3 языка
  const topLanguages = user.languages
    ? Object.entries(user.languages)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([lang]) => lang)
    : [];

  return (
    <div className='user-card'>
      <div className='user-card__head'>
        <img
          src={user.avatar_url}
          alt={`${user.login}'s avatar`}
          className='avatar'
        />
        <div>
          <h2>{user.name || user.login}</h2>
          <a href={user.html_url} target='_blank' rel='noreferrer'>
            @{user.login}
          </a>
        </div>
      </div>

      <dl className='stats'>
        <div><dt>Followers</dt><dd>{user.followers}</dd></div>
        <div><dt>Following</dt><dd>{user.following}</dd></div>
        <div><dt>Repositories</dt><dd>{user.public_repos}</dd></div>
        <div><dt>Created</dt><dd>{new Date(user.created_at).toLocaleDateString()}</dd></div>
      </dl>

      {user.languages && (
        <div className='language-info'>
          <p>
            <strong>Top Languages:</strong>{" "}
            {topLanguages.join(", ") || "No data"}
          </p>
          <p>
            <strong>Total Languages:</strong>{" "}
            {Object.keys(user.languages).length}
          </p>
        </div>
      )}

      <UserCharts user={user} />
    </div>
  );
};

export default UserCard;
