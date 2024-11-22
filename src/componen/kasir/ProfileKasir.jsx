import React, { useEffect, useState } from 'react';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

const getApiBaseUrl = () => {
  const protocol = window.location.protocol === "https:" ? "https" : "http";
  const baseUrl = process.env.REACT_APP_URL.replace(/^https?:\/\//, "");
  return `${protocol}://${baseUrl}`;
};

export const ProfileKasir = ({ userUuid }) => {
  const [profile, setProfile] = useState(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!userUuid) return;

      try {
        const response = await fetch(`${getApiBaseUrl()}/me`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        const data = await response.json();
        if (response.ok) {
          setProfile(data);
        } else {
          setError(data.message || 'Failed to fetch profile');
        }
      } catch (err) {
        setError('An error occurred while fetching profile');
      }
    };

    fetchProfile();
  }, [userUuid]);

  // Handle password update
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!userUuid) {
      setError('User UUID is missing. Please try again.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      const response = await fetch(`${getApiBaseUrl()}/updateuser/me/${userUuid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ password, confpassword: confirmPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to update password');
      } else {
        setSuccess('Password updated successfully');
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setError('An error occurred while updating password');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
      <Card>
        <CardHeader subheader="User Profile" title="My Profile" />
        <Divider />
        <CardContent>
          {/* Display Profile Info */}
          {profile ? (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="body1">
                  <strong>Username:</strong> {profile.username}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body1">
                  <strong>Role:</strong> {profile.role}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body1">
                  <strong>Cabang:</strong> {profile.cabang?.namacabang || 'N/A'}
                </Typography>
              </Grid>
            </Grid>
          ) : (
            <Typography variant="body1" color="textSecondary">
              Loading profile...
            </Typography>
          )}

          <Divider sx={{ margin: '20px 0' }} />

          {/* Password Update Form */}
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>New Password</InputLabel>
                <OutlinedInput
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  label="New Password"
                />
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Confirm Password</InputLabel>
                <OutlinedInput
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  label="Confirm Password"
                />
              </FormControl>
            </Grid>
          </Grid>

          {/* Error and Success Messages */}
          {error && <p style={{ color: 'red' }}>{error}</p>}
          {success && <p style={{ color: 'green' }}>{success}</p>}
        </CardContent>
        <Divider />
        <CardActions sx={{ justifyContent: 'flex-end' }}>
          <Button type="submit" variant="contained">
            Update Password
          </Button>
        </CardActions>
      </Card>
    </form>
  );
};
