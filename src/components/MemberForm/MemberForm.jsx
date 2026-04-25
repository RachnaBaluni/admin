import React, { useState } from 'react';

const MemberForm = ({ onSubmit, initialData = {} }) => {
  const [name, setName] = useState(initialData.name || '');
  const [type, setType] = useState(initialData.type || 'Player');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ name, type });
    setName('');
    setType('Player');
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ marginRight: '10px', padding: '10px' }}
      />
      <select value={type} onChange={(e) => setType(e.target.value)} style={{ marginRight: '10px', padding: '10px' }}>
        <option value="Player">Player</option>
        <option value="Coach">Coach</option>
        <option value="Academy">Academy</option>
      </select>
      <button type="submit" style={{ padding: '10px' }}>Submit</button>
    </form>
  );
};

export default MemberForm;
