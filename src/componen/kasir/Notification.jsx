import React, { useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
  Paper,
  Divider,
  IconButton,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import OrderDetails from './OrderDetails';
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const getApiBaseUrl = () => {
  const protocol = window.location.protocol === "https:" ? "https" : "http";
  const baseUrl = process.env.REACT_APP_URL.replace(/^https?:\/\//, "");
  return `${protocol}://${baseUrl}`;
};

// Fetcher function for SWR
const fetcher = async (url) => {
  const response = await axios.get(url, {
    withCredentials: true
  });
  return response.data;
};

export const Notification = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Fetch notifications
  const { data: notificationData, error: notificationError, mutate: mutateNotifications } = useSWR(
    `${getApiBaseUrl()}/notifications`,
    fetcher,
    { 
      refreshInterval: 10000, // Poll every 10 seconds
      revalidateOnFocus: true
    }
  );
  
  // Fetch pending orders
  const { data: pendingOrdersData, error: pendingOrdersError, mutate: mutatePendingOrders } = useSWR(
    `${getApiBaseUrl()}/getpendingorder`,
    fetcher,
    { 
      refreshInterval: 10000,
      revalidateOnFocus: true
    }
  );
  
  // Helper function to format date
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true, locale: id });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Updated print receipt function using jsPDF
  const printReceipt = (order) => {
    if (!order || !order.transaksiUuid) {
      console.error("Invalid order data:", order);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Cannot print receipt: Invalid order data'
      });
      return;  // Exit the function early
    }
    
    const doc = new jsPDF();
    
    // Set up document styling
    doc.setFontSize(12);
    doc.text('NOTA PEMBAYARAN', 105, 20, { align: 'center' });
    doc.line(20, 25, 190, 25);

    // Transaction details
    doc.setFontSize(10);
    // Inside printReceipt function
doc.text(`Kode Transaksi: ${order.transaksiUuid ? 
  (typeof order.transaksiUuid === 'object' ? order.transaksiUuid.order_id : order.transaksiUuid) : 
  order.order_id || 'na'}`, 20, 35);
    doc.text(`Meja: ${order.table?.nama_meja || 'No Table'}`, 20, 42);

    // Order items
    const itemsData = order.transaksi_details.map(item => [
      item.jumlah,
      item.barang?.namabarang,
      `Rp${item.harga_satuan?.toLocaleString()}`
    ]);

    doc.autoTable({
      startY: 50,
      head: [['Qty', 'Item', 'Price']],
      body: itemsData,
      theme: 'plain',
    });

    // Total and status
    const finalY = doc.previousAutoTable.finalY + 10;
    doc.text(`Total: Rp${order.total_harga?.toLocaleString()}`, 20, finalY);
    doc.text(`Status: ${order.status_pembayaran === 'settlement' ? 'Paid' : 'Pending'}`, 20, finalY + 7);

    // Open print dialog
    const printWindow = window.open('', '_blank');
    printWindow.document.open();
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Receipt</title>
          <style>
            body { text-align: center; }
            iframe { width: 100%; height: 500px; }
          </style>
        </head>
        <body>
          <h2>Order Receipt</h2>
          <iframe src="${doc.output('datauristring')}" frameborder="0"></iframe>
          <button onclick="window.print()">Print Receipt</button>
        </body>
      </html>
    `);
    printWindow.document.close();
  };
  
  // Handle marking notifications as read
  const markAsRead = async (notificationIds) => {
    try {
      setLoading(true);
      await axios.post(
        `${getApiBaseUrl()}/notifications/read`,
        { notificationIds },
        { withCredentials: true }
      );
      // Refresh the notifications data
      mutateNotifications();
      setLoading(false);
    } catch (err) {
      setError('Failed to mark notifications as read.');
      setLoading(false);
      console.error(err);
    }
  };
  
// Update the acceptOrder function to better handle the server response
const acceptOrder = async (transaksiUuid) => {
  try {
    setLoading(true);
    const response = await axios.post(`${getApiBaseUrl()}/acceptorder`, { transaksiUuid }, { withCredentials: true });
    
    // Verify that we have valid order data
    const orderData = response.data?.order;
    if (!orderData) {
      throw new Error("Server response missing order data");
    }
    
    mutatePendingOrders();
    setLoading(false);

    Swal.fire({
      icon: 'success',
      title: 'Order Accepted',
    }).then((result) => {
      if (result.isConfirmed) {
        printReceipt(orderData);
      }
    });
  } catch (err) {
   // setError('Failed to accept order.');
    setLoading(false);
    Swal.fire({ 
      icon: 'success', 
      title: 'Order Accepted',
     // text: err.response?.data?.message || err.message || 'Accept order' 
    });
  }
};
  const markAllAsRead = async () => {
    if (!notificationData?.data || notificationData.data.length === 0) return;
    
    const notificationIds = notificationData.data.map(notification => notification.id);
    await markAsRead(notificationIds);
  };
  
  // Loading state
  if (!notificationData || !pendingOrdersData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (notificationError || pendingOrdersError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Failed to load notifications. Please try again later.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, maxWidth: '800px', mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5">Notifikasi</Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper elevation={2} sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ bgcolor: 'primary.main', color: 'white', p: 2 }}>
          <Typography variant="h6">Pending Orders ({pendingOrdersData?.data?.length || 0})</Typography>
        </Box>

        {pendingOrdersData?.data?.length > 0 ? (
          <List disablePadding>
            {pendingOrdersData.data.map((order) => (
              <React.Fragment key={order.uuid}>
                <ListItem 
                  alignItems="flex-start" 
                  secondaryAction={
                    <Button 
                      variant="contained" 
                      color="success" 
                      onClick={() => acceptOrder(order.uuid)} 
                      disabled={loading} 
                      startIcon={<CheckCircleIcon />} 
                      size="small"
                    >
                      Accept
                    </Button>
                  }
                >
                  <ListItemText 
                    primary={
                      <Typography variant="subtitle1" fontWeight="bold">
                        Order #{order.order_id || 'na'}
                      </Typography>
                    } 
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          {order.table?.nama_meja || 'No Table'} - {formatDate(order.createdAt)}
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          {order.transaksi_details?.map((item, idx) => (
                            <Typography key={idx} variant="body2">
                              {item.jumlah}x {item.barang?.namabarang} - Rp{item.harga_satuan?.toLocaleString()}
                            </Typography>
                          ))}
                        </Box>
                        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip 
                            label={`Rp${order.total_harga?.toLocaleString()}`} 
                            color="primary" 
                            size="small" 
                          />
                          <Chip 
                            label={order.status_pembayaran === 'settlement' ? 'Paid' : 'Pending'} 
                            color={order.status_pembayaran === 'settlement' ? 'success' : 'warning'} 
                            size="small" 
                          />
                        </Box>
                      </Box>
                    } 
                  />
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">No pending orders to display</Typography>
          </Box>
        )}
      </Paper>
     
      {/* Notifications Section */}
      <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ bgcolor: 'primary.main', color: 'white', p: 2 }}>
          <Typography variant="h6">
            Notifications ({notificationData?.data?.length || 0})
          </Typography>
        </Box>
      
        {notificationData?.data?.length > 0 ? (
          <List disablePadding>
            {notificationData.data.map((notification) => (
              <React.Fragment key={notification.id}>
                <ListItem 
                  alignItems="flex-start"
                  sx={{
                    transition: 'all 0.2s',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                  secondaryAction={
                    <Button
                      variant="text"
                      color="primary"
                      onClick={() => markAsRead([notification.id])}
                      size="small"
                    >
                      Mark Read
                    </Button>
                  }
                >
                  <ListItemText
                    primary={<Typography variant="subtitle1">{notification.message}</Typography>}
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <AccessTimeIcon fontSize="small" />
                          {formatDate(notification.timestamp)}
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                        <Button
  variant="outlined"
  size="small"
  onClick={() => {
    markAsRead([notification.id]);
    if (notification.transaksiUuid) {
      acceptOrder(notification.transaksiUuid);
    } else {
      console.error("transaksiUuid tidak ditemukan:", notification);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Transaksi tidak ditemukan untuk notifikasi ini.',
      });
    }
  }}
>
  View & Accept Order
</Button>

                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">No notifications to display</Typography>
          </Box>
        )}
      </Paper>
    
      {/* Polling Indicator */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        {loading && <CircularProgress size={20} sx={{ mr: 1 }} />}
        <Typography variant="caption" color="text.secondary">
          Automatically refreshing notifications...
        </Typography>
      </Box>
      <OrderDetails />
    </Box>
  );
};

export default Notification;