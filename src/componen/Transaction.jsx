import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Pagination from '@mui/material/Pagination';
import Modal from '@mui/material/Modal';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import {TableContainer} from '@mui/material'
import dayjs from 'dayjs';
import useSWR from 'swr';
import axios from 'axios';

const getApiBaseUrl = () => {
  const protocol = window.location.protocol === 'https:' ? 'https' : 'http';
  const baseUrl = process.env.REACT_APP_URL.replace(/^https?:\/\/+/, '');
  return `${protocol}://${baseUrl}`;
};

const statusMap = {
  'settlement': { label: 'Success', color: 'success' },
  'pending': { label: 'Pending', color: 'warning' },
  'failure': { label: 'Failed', color: 'error' },
  'cancel': { label: 'Failed', color: 'error' }
};

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '80%',
  maxWidth: 800,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  maxHeight: '90vh',
  overflow: 'auto',
  borderRadius: 1
};

const fetcher = (url) => axios.get(url, { withCredentials: true }).then((res) => res.data);

export const Transaction = ({ userRole }) => {
  const baseUrl = getApiBaseUrl();
  const apiUrl = `${baseUrl}/gettransaksi`;
  const { data, error } = useSWR(apiUrl, fetcher);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});

  const [filters, setFilters] = useState({ username: '', branch: '', date: '' });
  const itemsPerPage = 10;

  if (error) return <div>Error loading transactions.</div>;
  if (!data) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f4f6f8' }}>
        <CircularProgress />
      </Box>
    );
  }

  const transactions = [...(data.transaksi || [])].sort((a, b) => 
    new Date(b.createdAt) - new Date(a.createdAt)
  );
  const filteredTransactions = transactions.filter((transaction) => {
    const matchesUsername = filters.username
      ? transaction.User?.username?.toLowerCase().includes(filters.username.toLowerCase())
      : true;
    const matchesBranch = userRole === 'superadmin' && filters.branch
      ? transaction.User?.Cabang?.namacabang?.toLowerCase().includes(filters.branch.toLowerCase())
      : true;
    const matchesDate = filters.date
      ? dayjs(transaction.tanggal).isSame(filters.date, 'day')
      : true;

    return matchesUsername && matchesBranch && matchesDate;
  });

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleTransactionClick = (transaction) => {
    setSelectedTransaction(transaction);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedTransaction(null);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };
  const updateTransaction = async (transactionId, updatedData) => {
    try {
      const response = await axios.put(`${getApiBaseUrl()}/updatetransaksi/${transactionId}`, updatedData, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      console.error("Failed to update transaction:", error);
      throw error;
    }
  };
  
  const deleteTransaction = async (transactionId) => {
    try {
      const response = await axios.delete(`${getApiBaseUrl()}/deletetransaksi/${transactionId}`, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      console.error("Failed to delete transaction:", error);
      throw error;
    }
  };
  const handleEditClick = (transaction) => {
    setSelectedTransaction(null); 
    setModalOpen(false); 
    setEditData({
      uuid: transaction.uuid,
      totaljual: transaction.totaljual,
      pembayaran: transaction.pembayaran,
      status_pembayaran: transaction.status_pembayaran,
    });
    setIsEditing(true); 
  };
  
  const handleSaveEdit = async () => {
    try {
      await updateTransaction(editData.uuid, editData);
      setIsEditing(false);
      alert("Transaction updated successfully!");
    } catch {
      alert("Failed to update transaction.");
    }
  };
  const handleDeleteTransaction = async (transactionId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this transaction?");
    if (confirmDelete) {
      try {
        await deleteTransaction(transactionId);
        alert("Transaction deleted successfully!");
      } catch {
        alert("Failed to delete transaction.");
      }
    }
  };
  const handleRowClick = (event, transaction) => {
    // Prevent row click if clicking on the action buttons
    if (event.target.closest('button')) {
      return;
    }
    setSelectedTransaction(transaction);
    setModalOpen(true);
  };
  
  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Card>
        <CardHeader 
          title={userRole === 'superadmin' ? 'All Transactions' : 'Branch Transactions'} 
          subheader={`Total transactions: ${filteredTransactions.length}`}
        />
        <Divider />

        {/* Filter Inputs */}
        <Box sx={{ display: 'flex', gap: 2, padding: 2 }}>
          <TextField
            label="Username"
            name="username"
            value={filters.username}
            onChange={handleFilterChange}
            size="small"
          />
          {userRole === 'superadmin' && (
            <TextField
              label="Branch"
              name="branch"
              value={filters.branch}
              onChange={handleFilterChange}
              size="small"
            />
          )}
          <TextField
            label="Date"
            name="date"
            type="date"
            value={filters.date}
            onChange={handleFilterChange}
            size="small"
            InputLabelProps={{ shrink: true }}
          />
        </Box>

        <Divider />

        {/* Transactions Table */}
        <Box sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 200 }}>
            <TableHead>
              <TableRow>
                <TableCell>No</TableCell>
                <TableCell>Transaction ID</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Total Amount</TableCell>
                <TableCell>Payment Method</TableCell>
                <TableCell>Status</TableCell>
                {userRole === 'superadmin' && <TableCell>Branch Name</TableCell>}
                <TableCell>Kasir</TableCell>
                <TableCell>CreatedAt</TableCell>
                {userRole === "superadmin" && <TableCell>Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedTransactions.map((transaction, index) => {
                const statusConfig = statusMap[transaction.status_pembayaran] || { label: 'Unknown', color: 'default' };

                return (
                  <TableRow 
                    hover 
                    key={transaction.uuid}
                    onClick={(e) => handleRowClick(e, transaction)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{transaction.uuid}</TableCell>
                    <TableCell>{dayjs(transaction.tanggal).format('DD MMM YYYY')}</TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR'
                      }).format(transaction.totaljual)}
                    </TableCell>
                    <TableCell>{transaction.pembayaran}</TableCell>
                    <TableCell>
                      <Chip color={statusConfig.color} label={statusConfig.label} size="small" />
                    </TableCell>
                    {userRole === 'superadmin' && (
                      <TableCell>
                        {transaction.User?.Cabang?.namacabang || 'No Branch'}
                      </TableCell>
                    )}
                    <TableCell>{transaction.User?.username || 'N/A'}</TableCell>
                    <TableCell>
                      {transaction.createdAt
                        ? dayjs(transaction.createdAt).format('HH:mm:ss')
                        : 'N/A'}
                    </TableCell>
                    {userRole === "superadmin" && (
                <TableCell>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleEditClick(transaction)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    onClick={() => handleDeleteTransaction(transaction.uuid)}
                  >
                    Delete
                  </Button>
                </TableCell>
              )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>

        <Divider />

        {/* Pagination */}
        <Box sx={{ display: 'flex', justifyContent: 'center', padding: 2 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(_, value) => setCurrentPage(value)}
            color="primary"
          />
        </Box>
      </Card>

      {/* Transaction Detail Modal */}
      <Modal
         open={modalOpen && !isEditing}
        onClose={handleCloseModal}
        aria-labelledby="transaction-detail-modal"
      >
        <Box sx={modalStyle}>
          {selectedTransaction && (
            <>
              <Typography variant="h6" component="h2" gutterBottom>
                Transaction Details
              </Typography>
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Transaction Information
                </Typography>
                <Paper sx={{ p: 2 }}>
                  <Typography><strong>Transaction ID:</strong> {selectedTransaction.uuid}</Typography>
                  <Typography><strong>Order ID      :</strong> {selectedTransaction.order_id}</Typography>
                  <Typography><strong>Date          :</strong> {dayjs(selectedTransaction.tanggal).format('DD MMM YYYY')}</Typography>
                  <Typography><strong>Created At    :</strong> {dayjs(selectedTransaction.createdAt).format('DD MMM YYYY HH:mm:ss')}</Typography>
                  <Typography><strong>Payment Method:</strong> {selectedTransaction.pembayaran}</Typography>
                  <Typography><strong>Status        :</strong> {selectedTransaction.status_pembayaran}</Typography>
                  <Typography><strong>Total Amount  :</strong> {
                    new Intl.NumberFormat('id-ID', {
                      style: 'currency',
                      currency: 'IDR'
                    }).format(selectedTransaction.totaljual)
                  }</Typography>
                </Paper>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Cashier Information
                </Typography>
                <Paper sx={{ p: 2 }}>
                  <Typography><strong>Cashier:</strong> {selectedTransaction.User?.username}</Typography>
                  <Typography><strong>Branch:</strong> {selectedTransaction.User?.Cabang?.namacabang}</Typography>
                </Paper>
              </Box>

              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Items
                </Typography>
                <Paper sx={{ p: 2 }}>
  <TableContainer sx={{ maxHeight: 400, overflow: 'auto' }}>
    <Table size="small" stickyHeader>
      <TableHead>
        <TableRow>
          <TableCell>Name</TableCell>
          <TableCell>Quantity</TableCell>
          <TableCell>Price</TableCell>
          <TableCell>Total</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {selectedTransaction.TransaksiDetails.map((item) => (
          <TableRow key={item.uuid}>
            <TableCell>{item.Barang?.namabarang || 'NA'}</TableCell>
            <TableCell>{item.jumlahbarang}</TableCell>
            <TableCell>{new Intl.NumberFormat('id-ID', {
              style: 'currency',
              currency: 'IDR'
            }).format(item.harga)}</TableCell>
            <TableCell>{new Intl.NumberFormat('id-ID', {
              style: 'currency',
              currency: 'IDR'
            }).format(item.total)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
</Paper>

              </Box>

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button onClick={handleCloseModal} variant="contained">
                  Close
                </Button>
              </Box>
            </>
          )}
         
        </Box>
      </Modal>
        {/* Modal Edit */}
        <Modal open={isEditing} onClose={() => setIsEditing(false)}>
           <Box sx={modalStyle}>
          <Typography variant="h6" gutterBottom>
            Edit Transaction
          </Typography>
          <TextField
            label="Total Amount"
            type="number"
            fullWidth
            margin="normal"
            value={editData.totaljual}
            onChange={(e) => setEditData({ ...editData, totaljual: e.target.value })}
          />
          <TextField
            label="Payment Method"
            fullWidth
            margin="normal"
            value={editData.pembayaran}
            onChange={(e) => setEditData({ ...editData, pembayaran: e.target.value })}
          />
          <TextField
            label="Payment Status"
            fullWidth
            margin="normal"
            value={editData.status_pembayaran}
            onChange={(e) => setEditData({ ...editData, status_pembayaran: e.target.value })}
          />
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button variant="contained" onClick={handleSaveEdit}>
              Save
            </Button>
            <Button variant="outlined" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};
