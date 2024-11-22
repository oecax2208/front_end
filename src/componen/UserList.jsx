import React, { useState } from "react";
import useSWR, { mutate } from "swr";
import { useSelector } from "react-redux";
import {
  Box,
  Button,
  Card,
  Modal,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  MenuItem,
  TableContainer,
  Paper,
} from "@mui/material";
import axios from "axios";

const getApiBaseUrl = () => {
  const protocol = window.location.protocol === "https:" ? "https" : "http";
  const baseUrl = process.env.REACT_APP_URL.replace(/^https?:\/\/+/, "");
  return `${protocol}://${baseUrl}`;
};

const fetcher = (url) => axios.get(url).then((res) => res.data.data);

function UserList() {
  const { user } = useSelector((state) => state.auth);
  const endpoint = user?.role === "superadmin" ? "/getuser" : "/getusercabang";
  const { data: users, error: userError } = useSWR(user ? `${getApiBaseUrl()}${endpoint}` : null, fetcher);  
  // const { data: users, error: userError } = useSWR(`${getApiBaseUrl()}/getuser`, fetcher);
  const { data: cabangList, error: cabangError } = useSWR(`${getApiBaseUrl()}/cabang`, fetcher);

  const [openModal, setOpenModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUser, setCurrentUser] = useState({
    uuid: "",
    username: "",
    password: "",
    confpassword: "",
    role: "",
    cabanguuid: "",
  });

  const handleOpenModal = (user = null) => {
    if (user) {
      setIsEditing(true);
      setCurrentUser(user);
    } else {
      setIsEditing(false);
      setCurrentUser({ username: "", password: "", confpassword: "", role: "", cabanguuid: "" });
    }
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setCurrentUser({ username: "", password: "", confpassword: "", role: "", cabanguuid: "" });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setCurrentUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveUser = async () => {
    if (currentUser.password !== currentUser.confpassword) {
      alert("Password and confirm password do not match.");
      return;
    }

    try {
      if (isEditing) {
        await axios.put(`${getApiBaseUrl()}/updateuser/${currentUser.uuid}`, currentUser, {
          withCredentials: true
        });
      } else {
        await axios.post(`${getApiBaseUrl()}/createuser`, currentUser, {
          withCredentials: true
        });
      }
      mutate(`${getApiBaseUrl()}/getuser`);
      handleCloseModal();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to save user.");
    }
  };

  const handleDeleteUser = async (uuid) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await axios.delete(`${getApiBaseUrl()}/deleteuser/${uuid}`, { withCredentials: true });
      mutate(`${getApiBaseUrl()}/getuser`, { withCredentials: true });
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete user.");
    }
  };

  if (userError || cabangError) return <Typography>Error loading data.</Typography>;
  if (!users || !cabangList) return <Typography>Loading...</Typography>;

  return (
    <Box sx={{
      p: { xs: 0, sm: 0 }, // Responsive padding
      backgroundColor: "#f4f6f8",
      minHeight: "100vh",
      display: "flex",
      overflowX: 'auto',
      flexDirection: "column",
    }}>
      <Card sx={{ 
        padding: { xs: 0, sm: 0 }, // Responsive card padding
        flex: 1,
        width: "100%",
        overflowX: 'auto',
      }}>
        <Box sx={{
          mb: 2,
          display: "flex",
          justifyContent: "flex-end",
          overflowX: 'auto',
        }}>
          <Box>
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleOpenModal()}
          >
            Add User
          </Button>
          </Box>
        </Box>

        {/* Responsive Table Container */}
        <TableContainer 
          component={Paper} 
          sx={{
            maxWidth: '100%',
            overflowX: 'auto',
            '&::-webkit-scrollbar': {
              height: '8px',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: '#f1f1f1',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: '#888',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              backgroundColor: '#555',
            },
          }}
        >
          <Table sx={{
            minWidth: {
            
            }
          }}>
            <TableHead>
              <TableRow>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>No</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>Username</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>Role</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>Cabang</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user, index) => (
                <TableRow key={user.uuid}>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{index + 1}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{user.username}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{user.role}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{user.Cabang?.namacabang || "N/A"}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    <Button
                      color="primary"
                      onClick={() => handleOpenModal(user)}
                      sx={{ mr: 1 }}
                      size="small" // Smaller buttons on mobile
                    >
                      Edit
                    </Button>
                    <Button 
                      color="error" 
                      onClick={() => handleDeleteUser(user.uuid)}
                      size="small" // Smaller buttons on mobile
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Modal */}
        <Modal open={openModal} onClose={handleCloseModal}>
         <Box
                   sx={{
                     position: "absolute",
                     top: "50%",
                     left: "50%",
                     transform: "translate(-50%, -50%)",
                     width: 250,
                     bgcolor: "background.paper",
                     boxShadow: 24,
                     p: 4,
                   }}
                 >
            <Typography variant="h6" mb={2}>
              {isEditing ? "Edit User" : "Add New User"}
            </Typography>

            <TextField
              fullWidth
              label="Username"
              name="username"
              value={currentUser.username}
              onChange={handleFormChange}
              margin="normal"
              size="small" // Smaller fields on mobile
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              name="password"
              value={currentUser.password}
              onChange={handleFormChange}
              margin="normal"
              size="small"
            />
            <TextField
              fullWidth
              label="Confirm Password"
              type="password"
              name="confpassword"
              value={currentUser.confpassword}
              onChange={handleFormChange}
              margin="normal"
              size="small"
            />
            <TextField
              fullWidth
              select
              label="Role"
              name="role"
              value={currentUser.role}
              onChange={handleFormChange}
              margin="normal"
              size="small"
            >
              <MenuItem value="">Select Role</MenuItem>
              <MenuItem value="superadmin">Superadmin</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="kasir">Kasir</MenuItem>
            </TextField>
            <TextField
              fullWidth
              select
              label="Cabang"
              name="cabanguuid"
              value={currentUser.cabanguuid}
              onChange={handleFormChange}
              margin="normal"
              size="small"
            >
              <MenuItem value="">None</MenuItem>
              {cabangList.map((cabang) => (
                <MenuItem key={cabang.uuid} value={cabang.uuid}>
                  {cabang.namacabang}
                </MenuItem>
              ))}
            </TextField>

            <Box mt={2} display="flex" justifyContent="flex-end">
              <Button 
                onClick={handleCloseModal} 
                sx={{ mr: 1 }}
                size="small"
              >
                Cancel
              </Button>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleSaveUser}
                size="small"
              >
                {isEditing ? "Save Changes" : "Add"}
              </Button>
            </Box>
          </Box>
        </Modal>
      </Card>
    </Box>
  );
}

export default UserList;