import React from 'react';

const CompareTable = ({ user1, user2 }) => {
  const fields = [
    { name: 'Followers', key: 'followers' },
    { name: 'Following', key: 'following' },
    { name: 'Repositories', key: 'public_repos' },
    { name: 'Account Age', key: 'created_at' },
  ];

  const calculateDiff = (val1, val2, isDate = false) => {
    if (!val1 || !val2) return 0;
    
    if (isDate) {
      const date1 = new Date(val1);
      const date2 = new Date(val2);
      return Math.abs(date1 - date2) / (1000 * 60 * 60 * 24);
    }
    
    return Math.abs(Number(val1) - Number(val2));
  };

  return (
    <table className="compare-table">
      <thead>
        <tr>
          <th>Metric</th>
          <th>{user1.login}</th>
          <th>{user2.login}</th>
          <th>Difference</th>
        </tr>
      </thead>
      <tbody>
        {fields.map((field) => (
          <tr key={field.key}>
            <td>{field.name}</td>
            <td>{field.key === 'created_at' 
                  ? new Date(user1[field.key]).toLocaleDateString() 
                  : user1[field.key]}</td>
            <td>{field.key === 'created_at' 
                  ? new Date(user2[field.key]).toLocaleDateString() 
                  : user2[field.key]}</td>
            <td className={
              calculateDiff(user1[field.key], user2[field.key], field.key === 'created_at') > 0 
                ? 'highlight' : ''
            }>
              {field.key === 'created_at'
                ? `${Math.round(calculateDiff(user1[field.key], user2[field.key], true))} days`
                : calculateDiff(user1[field.key], user2[field.key])}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default CompareTable;