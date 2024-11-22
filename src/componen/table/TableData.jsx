import React, { useState, useEffect } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Card,
  Button,
  TableContainer,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  Chip,
  MenuItem,
  Select,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Tooltip,
  Snackbar,
  FormControl,
  InputLabel,
} from "@mui/material";
import QrCodeIcon from '@mui/icons-material/QrCode';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import { QRCodeCanvas } from 'qrcode.react';
import Swal from 'sweetalert2';
import axios from "axios";
import { useDispatch, useSelector } from 'react-redux';

const getApiBaseUrl = () => {
  const protocol = window.location.protocol === "https:" ? "https" : "http";
  const baseUrl = process.env.REACT_APP_URL.replace(/^https?:\/\/+/, "");
  return `${protocol}://${baseUrl}`;
};

export const TableData = () => {
  const user = useSelector((state) => state.auth.user);
  const [tables, setTables] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [currentTable, setCurrentTable] = useState(null);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    cabangUuid: ''
  });
  const [isEditing, setIsEditing] = useState(false);

  const apiBaseUrl = getApiBaseUrl();

  // Fetch tables data
  const fetchTables = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${apiBaseUrl}/getmeja`, { withCredentials: true });
      setTables(response.data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch tables');
      console.error('Error fetching tables:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch branches for dropdown
  const fetchBranches = async () => {
    try {
      const response = await axios.get(`${apiBaseUrl}/cabang`, { withCredentials: true });
      setBranches(response.data.data);
    } catch (err) {
      console.error('Error fetching branches:', err);
    }
  };

  // Fetch QR code for a table
  const fetchQrCode = async (tableId) => {
    try {
      const response = await axios.get(`${apiBaseUrl}/table/qr/${tableId}`, { withCredentials: true });
      setQrCodeData(response.data.data);
      setQrDialogOpen(true);
    } catch (err) {
      setSnackbarMessage(err.response?.data?.message || 'Failed to fetch QR code');
      setSnackbarOpen(true);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle form submission for create/update
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (isEditing) {
        await axios.put(`${apiBaseUrl}/updatemeja/${currentTable.id}`, formData, { withCredentials: true });
        setSnackbarMessage('Table updated successfully');
      } else {
        await axios.post(`${apiBaseUrl}/createmeja`, formData, { withCredentials: true });
        setSnackbarMessage('Table created successfully');
      }
      setSnackbarOpen(true);
      setOpenDialog(false);
      fetchTables();
    } catch (err) {
      setSnackbarMessage(err.response?.data?.message || 'Operation failed');
      setSnackbarOpen(true);
    }
  };

  // Handle table deletion
  const handleDelete = (tableId) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`${apiBaseUrl}/deletemeja/${tableId}`, { withCredentials: true });
          setSnackbarMessage('Table deleted successfully');
          setSnackbarOpen(true);
          fetchTables();
        } catch (err) {
          setSnackbarMessage(err.response?.data?.message || 'Failed to delete table');
          setSnackbarOpen(true);
        }
      }
    });
  };

  // Handle edit button click
  const handleEditClick = (table) => {
    setCurrentTable(table);
    setFormData({
      name: table.name,
      cabangUuid: table.cabangUuid
    });
    setIsEditing(true);
    setOpenDialog(true);
  };

  // Handle QR code button click
  const handleQrClick = (tableId) => {
    setCurrentTable(tables.find(table => table.id === tableId));
    fetchQrCode(tableId);
  };

  // Handle creating a new table
  const handleNewTable = () => {
    setCurrentTable(null);
    setFormData({
      name: '',
      cabangUuid: branches.length > 0 ? branches[0].uuid : ''
    });
    setIsEditing(false);
    setOpenDialog(true);
  };

  // Download QR code as image
  const downloadQrCode = () => {
    if (!qrCodeData) return;
    
    const canvas = document.getElementById('qr-canvas');
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = `table-qr-${currentTable.id}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    
    setSnackbarMessage('QR Code downloaded successfully');
    setSnackbarOpen(true);
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchTables();
    fetchBranches();
  }, []);

  // Check if user is admin
  const isAdmin = user && user.role === 'admin';

  if (!isAdmin) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">You don't have permission to access this page.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Card sx={{ mb: 4, p: 3, boxShadow: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>
            Table Management
          </Typography>
          <Box>
            <Button
              variant="contained"
              color="primary"
              startIcon={<RefreshIcon />}
              onClick={fetchTables}
              sx={{ mr: 2 }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<AddIcon />}
              onClick={handleNewTable}
            >
              Add Table
            </Button>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <TableContainer component={Paper} sx={{ boxShadow: 2 }}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ bgcolor: 'primary.main' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Table Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Branch</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'white' }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : tables.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No tables found
                  </TableCell>
                </TableRow>
              ) : (
                tables.map((table) => (
                  <TableRow key={table.id} hover>
                    <TableCell>{table.id}</TableCell>
                    <TableCell>{table.name}</TableCell>
                    <TableCell>{table.Cabang?.namaCabang || 'N/A'}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="Generate QR Code">
                        <IconButton 
                          color="info" 
                          onClick={() => handleQrClick(table.id)}
                          sx={{ mr: 1 }}
                        >
                          <QrCodeIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Table">
                        <IconButton 
                          color="primary" 
                          onClick={() => handleEditClick(table)}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Table">
                        <IconButton 
                          color="error" 
                          onClick={() => handleDelete(table.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>{isEditing ? 'Edit Table' : 'Create New Table'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              name="name"
              label="Table Name"
              type="text"
              fullWidth
              variant="outlined"
              value={formData.name}
              onChange={handleInputChange}
              required
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth>
              <InputLabel id="branch-select-label">Branch</InputLabel>
              <Select
                labelId="branch-select-label"
                name="cabangUuid"
                value={formData.cabangUuid}
                onChange={handleInputChange}
                label="Branch"
                required
              >
                {branches.map((branch) => (
                  <MenuItem key={branch.uuid} value={branch.uuid}>
                    {branch.namacabang}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenDialog(false)} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              {isEditing ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onClose={() => setQrDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          QR Code for Table: {currentTable?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>
            {qrCodeData ? (
              <>
                <QRCodeCanvas
                  id="qr-canvas"
                  value={qrCodeData.orderUrl}
                  size={250}
                  level="H"
                  includeMargin
                />
                <Typography variant="body2" color="textSecondary" sx={{ mt: 2, mb: 1 }}>
                  Scan this QR code to access the menu for this table.
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<DownloadIcon />}
                    onClick={downloadQrCode}
                  >
                    Download QR Code
                  </Button>
                </Box>
              </>
            ) : (
              <CircularProgress />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQrDialogOpen(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default TableData;