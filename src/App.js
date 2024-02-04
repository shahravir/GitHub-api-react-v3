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
          'https://api.github.com/repos/allenai/OLMo/pulls?state=all',
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

  const filteredPRData = prData.filter(pr => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    return (
      pr.number.toString().includes(lowerCaseQuery) ||
      pr.user.login.toLowerCase().includes(lowerCaseQuery) ||
      pr.title.toLowerCase().includes(lowerCaseQuery) ||
      pr.comments.some(comment => comment.body.toLowerCase().includes(lowerCaseQuery))
    );
  });

  return (
    <div className="App">
      <h1>Banking App PR Stats</h1>
      <div className='search-container'>
      <input
        type="text"
        className='search-input'
        placeholder="Search by PR Number, User, Title, or Comment"
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
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
  return Math.round(ageInDays) + ' days';
}

export default App;
