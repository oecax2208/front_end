import React, { useState } from 'react';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import axios from 'axios';
import { useSelector } from 'react-redux';

const getApiBaseUrl = () => {
  const protocol = window.location.protocol === 'https:' ? 'https' : 'http';
  const baseUrl = process.env.REACT_APP_URL.replace(/^https?:\/\/+/, '');
  return `${protocol}://${baseUrl}`;
};

export const Profile = () => {
  const { user } = useSelector((state) => state.auth);
  const [password, setPassword] = useState('');
  const [confPassword, setConfPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleUpdate = async () => {
    if (password !== confPassword) {
      setMessage('Password dan Konfirmasi Password tidak cocok.');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const response = await axios.put(
        `${getApiBaseUrl()}/updateuser/me/${user.uuid}`,
        { password, confpassword: confPassword },
        { withCredentials: true }
      );
      setMessage(response.data.message);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Gagal mengupdate profil.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Typography variant="h6" color="textSecondary">
        Anda belum login. Silakan login untuk melihat profil.
      </Typography>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h5">Profil Pengguna</Typography>
        <Divider sx={{ marginY: 2 }} />
        <Typography variant="body1">
          Username: <strong>{user.username}</strong>
        </Typography>
        <Typography variant="body1">
          Role: <strong>{user.role}</strong>
        </Typography>
        {user.cabang && (
          <Typography variant="body1">
            Cabang: <strong>{user.cabang.namacabang}</strong>
          </Typography>
        )}
        <Divider sx={{ marginY: 2 }} />
        <FormControl fullWidth margin="normal">
          <InputLabel>Password Baru</InputLabel>
          <OutlinedInput
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </FormControl>
        <FormControl fullWidth margin="normal">
          <InputLabel>Konfirmasi Password</InputLabel>
          <OutlinedInput
            type="password"
            value={confPassword}
            onChange={(e) => setConfPassword(e.target.value)}
          />
        </FormControl>
        {message && <Typography color="error">{message}</Typography>}
      </CardContent>
      <CardActions>
        <Button
          variant="contained"
          color="primary"
          onClick={handleUpdate}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Update Profil'}
        </Button>
      </CardActions>
    </Card>
  );
};
