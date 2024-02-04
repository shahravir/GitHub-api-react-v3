import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [prData, setPrData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchPRData = async () => {
      try {
        const token = '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';
        const config = {
          headers: {
            Authorization: `token ${token}`
          }
        };

        const response = await axios.get(
          'https://api.github.com/repos/ohmyzsh/ohmyzsh/pulls?state=all&per_page=100',
          config
        );
        const prsWithComments = await Promise.all(response.data.map(async pr => {
          const commentsResponse = await axios.get(pr.comments_url, config);
          pr.comments = commentsResponse.data;
          return pr;
        }));
        setPrData(prsWithComments);
      } catch (error) {
        console.error('Error fetching PR data:', error);
      }
    };

    fetchPRData();
  }, []);

  const handleSearchChange = event => {
    setSearchQuery(event.target.value);
  };

  const filteredPRData = prData.filter(pr => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    return (
      pr.number.toString().includes(lowerCaseQuery) ||
      pr.user.login.toLowerCase().includes(lowerCaseQuery) ||
      pr.title.toLowerCase().includes(lowerCaseQuery) ||
      pr.comments.some(comment => comment.body.toLowerCase().includes(lowerCaseQuery))
    );
  });

  // Calculate interesting PR stats
  const totalPRs = prData.length;
  const openPRs = prData.filter(pr => !pr.merged_at && !pr.closed_at).length;
  const mergedPRs = prData.filter(pr => pr.merged_at).length;
  const closedPRs = prData.filter(pr => pr.closed_at && !pr.merged_at).length;

  const totalAge = prData.reduce((total, pr) => {
    return total + calculateAge(pr.created_at, pr.merged_at, pr.closed_at);
  }, 0);

  const averageAge = totalAge / totalPRs;

  return (
    <div className="App">
      <h1>PR Stats for ohmyzsh</h1>
      <div className="stats">
        <p>Total PRs: {totalPRs}</p>
        <p>Open PRs: {openPRs}</p>
        <p>Merged PRs: {mergedPRs}</p>
        <p>Closed PRs: {closedPRs}</p>
        <p>Average Age of PRs: {averageAge.toFixed(2)} days</p>
      </div>
      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="Search by PR Number, User, Title, or Comment"
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>
      <table>
        <thead>
          <tr>
            <th>PR Number</th>
            <th>User</th>
            <th>Title</th>
            <th>Created At</th>
            <th>Merged At</th>
            <th>Closed At</th>
            <th>Age</th>
            <th>All Comments</th>
            <th>Link</th>
          </tr>
        </thead>
        <tbody>
          {filteredPRData.map(pr => (
            <tr key={pr.id}>
              <td>{pr.number}</td>
              <td>{pr.user.login}</td>
              <td>{pr.title}</td>
              <td>{pr.created_at}</td>
              <td>{pr.merged_at}</td>
              <td>{pr.closed_at}</td>
              <td>{calculateAge(pr.created_at, pr.merged_at, pr.closed_at)}</td>
              <td>
                {pr.comments.map(comment => (
                  <div className="comment-bubble" key={comment.id}>
                    <p><strong>{comment.user.login}</strong>: {comment.body}</p>
                  </div>
                ))}
              </td>
              <td>
                <a href={pr.html_url} target="_blank" rel="noreferrer">
                  Link
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function calculateAge(created_at, merged_at, closed_at) {
  let endDate;
  if (merged_at) {
    endDate = new Date(merged_at);
  } else if (closed_at) {
    endDate = new Date(closed_at);
  } else {
    endDate = new Date(); // If neither merged nor closed, use current date
  }

  const createdDate = new Date(created_at);
  const ageInMilliseconds = endDate - createdDate;
  const ageInDays = ageInMilliseconds / (1000 * 60 * 60 * 24);
  return Math.round(ageInDays);
}

export default App;
