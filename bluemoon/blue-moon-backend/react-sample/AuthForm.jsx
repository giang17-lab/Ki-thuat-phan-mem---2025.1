import React, { useState } from 'react';

const API = process.env.REACT_APP_API_BASE || 'http://localhost:3000';

export default function AuthForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState(localStorage.getItem('bm_token') || '');
  const [message, setMessage] = useState('');

  async function register() {
    const res = await fetch(`${API}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, email, ten_nguoi_dung: username })
    });
    const data = await res.json();
    if (res.ok) setMessage('Đăng ký thành công: ' + (data.data?.username || ''));
    else setMessage(data.message || 'Đăng ký lỗi');
  }

  async function login() {
    const res = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok) {
      setToken(data.token);
      localStorage.setItem('bm_token', data.token);
      setMessage('Đăng nhập thành công.');
    } else {
      setMessage(data.message || 'Đăng nhập lỗi');
    }
  }

  async function whoami() {
    const res = await fetch(`${API}/api/auth/verify`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('bm_token')}` }
    });
    const data = await res.json();
    if (res.ok) setMessage('User: ' + data.username);
    else setMessage(data.message || 'Lỗi verify');
  }

  return (
    <div style={{maxWidth:400, margin:'20px auto', fontFamily:'Arial'}}>
      <h3>Auth Demo</h3>
      <input placeholder="username" value={username} onChange={e=>setUsername(e.target.value)} />
      <br />
      <input placeholder="email (for register)" value={email} onChange={e=>setEmail(e.target.value)} />
      <br />
      <input placeholder="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
      <br />
      <button onClick={register}>Register</button>
      <button onClick={login}>Login</button>
      <button onClick={whoami}>Verify Token</button>
      <div style={{marginTop:10}}>{message}</div>
    </div>
  );
}
