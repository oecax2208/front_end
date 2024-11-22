import React, { useState, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import axios from 'axios';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Divider, 
  Chip, 
  LinearProgress, 
  Stack, 
  Card, 
  CardContent, 
  List, 
  ListItem, 
  ListItemText,
  Button
} from '@mui/material';
import { styled } from '@mui/system';
import { format } from 'date-fns';
import Swal from 'sweetalert2';
import { 
  CheckCircle, 
  ClockCounterClockwise, 
  CookingPot,
  Receipt
} from '@phosphor-icons/react';

const StatusChip = styled(Chip)(({ theme, status }) => ({
  fontWeight: 'bold',
  ...(status === 'paid' && {
    backgroundColor: '#e6f7ed',
    color: '#00a854',
  }),
  ...(status === 'accepted' && {
    backgroundColor: '#e6f7ff',
    color: '#0077cc',
  }),
  ...(status === 'processing' && {
    backgroundColor: '#fff7e6',
    color: '#fa8c16',
  }),
  ...(status === 'waiting' && {
    backgroundColor: '#f5f5f5',
    color: '#595959',
  }),
}));

const StatusIcon = ({ status }) => {
  switch (status) {
    case 'paid':
      return <CheckCircle size={24} weight="fill" color="#00a854" />;
    case 'accepted':
      return <Receipt size={24} weight="fill" color="#0077cc" />;
    case 'processing':
      return <CookingPot size={24} weight="fill" color="#fa8c16" />;
    case 'waiting':
      return <ClockCounterClockwise size={24} weight="fill" color="#595959" />;
    default:
      return null;
  }
};

const StepBox = styled(Box)(({ theme, active }) => ({
  padding: '16px',
  borderRadius: '8px',
  backgroundColor: active ? '#f0f5ff' : '#f5f5f5',
  borderLeft: active ? '4px solid #1890ff' : '4px solid transparent',
}));

const OrderStatusPage = () => {
  const location = useLocation();
  const params = useParams();
  const [orderId, setOrderId] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // First check URL params from React Router (if using a route like /status/:orderId)
    const orderIdFromParams = params.orderId;
    
    // Then check query params (from Midtrans redirect)
    const searchParams = new URLSearchParams(location.search);
    const orderIdFromQuery = searchParams.get('order_id');
    
    const orderIdToUse = orderIdFromParams || orderIdFromQuery;
    
    if (orderIdToUse) {
      setOrderId(orderIdToUse);
      fetchOrderStatus(orderIdToUse);
    } else {
      setError("Order ID not found. Please check your URL.");
      setLoading(false);
    }
  }, [location, params]);

  const fetchOrderStatus = async (id) => {
    try {
      setLoading(true);
      
      // Fix: Use encodeURIComponent to properly encode the order ID for the API call
      const encodedOrderId = encodeURIComponent(id);
      
      // Make sure the API URL is correct - using the port 5000, not 80
      const response = await axios.get(`http://192.168.1.7:5000/status/${encodedOrderId}`);
      
      if (response.data && response.data.status === true) {
        setOrderData(response.data.data);
      } else {
        throw new Error("Failed to get order data");
      }
    } catch (err) {
      console.error("API Error:", err);
      setError(`Error fetching order status: ${err.message}`);
      Swal.fire({
        title: 'Error',
        text: 'Gagal mendapatkan status pesanan. Pastikan ID pesanan benar.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshStatus = () => {
    if (orderId) {
      fetchOrderStatus(orderId);
    }
  };

  // Debug output (can be removed in production)
  const debugInfo = () => {
    return (
      <Box mt={2} p={2} bgcolor="#f5f5f5" borderRadius={1}>
        <Typography variant="caption" component="div">Debug Info:</Typography>
        <Typography variant="caption" component="div">Order ID: {orderId}</Typography>
        <Typography variant="caption" component="div">
          API URL: {`http://192.168.1.7:5000/status/${encodeURIComponent(orderId || '')}`}
        </Typography>
      </Box>
    );
  };

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h5" align="center" gutterBottom>
            Memuat Status Pesanan...
          </Typography>
          <LinearProgress sx={{ mt: 2 }} />
          {orderId && debugInfo()}
        </Paper>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h5" align="center" color="error" gutterBottom>
            Error
          </Typography>
          <Typography align="center">{error}</Typography>
          <Box display="flex" justifyContent="center" mt={2}>
            <Button variant="contained" color="primary" onClick={() => window.location.href = '/'}>
              Kembali ke Beranda
            </Button>
          </Box>
          <Box display="flex" justifyContent="center" mt={2}>
            <Button variant="outlined" color="primary" onClick={refreshStatus}>
              Coba Lagi
            </Button>
          </Box>
          {orderId && debugInfo()}
        </Paper>
      </Container>
    );
  }

  if (!orderData) {
    return null;
  }

  const { orderDetails, statusInfo, statusMessage, estimatedTime } = orderData;

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, borderRadius: 2 }}>
        <Box display="flex" justifyContent="space-between" flexWrap="wrap" mb={3}>
          <Typography variant="h4" component="h1" gutterBottom>
            Status Pesanan
          </Typography>
          <Button 
            variant="outlined" 
            onClick={refreshStatus} 
            startIcon={<ClockCounterClockwise weight="bold" />}
          >
            Refresh
          </Button>
        </Box>

        <Card sx={{ mb: 4, backgroundColor: '#f9f9f9', borderRadius: 2 }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" flexWrap="wrap">
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Order ID
                </Typography>
                <Typography variant="subtitle1" fontWeight="bold">
                  {orderDetails.order_id}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Tanggal
                </Typography>
                <Typography variant="subtitle1">
                  {format(new Date(orderDetails.tanggal), 'dd MMMM yyyy')}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Meja
                </Typography>
                <Typography variant="subtitle1">
                  {orderDetails.Table.name}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Pembayaran
                </Typography>
                <Typography variant="subtitle1" textTransform="uppercase">
                  {orderDetails.pembayaran}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
          Status Pemrosesan
        </Typography>

        <Box mb={4}>
          <StepBox active={statusInfo.paid} mb={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              <StatusIcon status="paid" />
              <Box flex={1}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Pembayaran
                </Typography>
                <Typography variant="body2">
                  {statusInfo.paid ? 'Pembayaran berhasil' : 'Menunggu pembayaran'}
                </Typography>
              </Box>
              <StatusChip 
                label={statusInfo.paid ? "Dibayar" : "Menunggu"} 
                status="paid" 
                variant={statusInfo.paid ? "filled" : "outlined"}
              />
            </Stack>
          </StepBox>

          <StepBox active={statusInfo.accepted} mb={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              <StatusIcon status="accepted" />
              <Box flex={1}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Pesanan Diterima
                </Typography>
                <Typography variant="body2">
                  {statusInfo.accepted ? 'Pesanan sudah diterima oleh kasir' : 'Menunggu konfirmasi kasir'}
                </Typography>
              </Box>
              <StatusChip 
                label={statusInfo.accepted ? "Diterima" : "Menunggu"} 
                status="accepted" 
                variant={statusInfo.accepted ? "filled" : "outlined"}
              />
            </Stack>
          </StepBox>

          <StepBox active={statusInfo.processing} mb={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              <StatusIcon status="processing" />
              <Box flex={1}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Pemrosesan
                </Typography>
                <Typography variant="body2">
                  {statusInfo.processing ? 'Pesanan sedang diproses' : 'Menunggu pemrosesan'}
                </Typography>
                {statusInfo.processing && (
                  <Typography variant="body2" color="primary" fontWeight="medium">
                    Estimasi waktu: {estimatedTime}
                  </Typography>
                )}
              </Box>
              <StatusChip 
                label={statusInfo.processing ? "Diproses" : "Menunggu"} 
                status="processing" 
                variant={statusInfo.processing ? "filled" : "outlined"}
              />
            </Stack>
          </StepBox>

          <StepBox active={statusInfo.waiting} mb={2}>
            {/*
            <Stack direction="row" spacing={2} alignItems="center">
              <StatusIcon status="waiting" />
               <Box flex={1}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Pengantaran
                </Typography>
                <Typography variant="body2">
                  {statusInfo.waiting ? 'Menunggu pengantaran ke meja' : 'Belum siap untuk diantar'}
                </Typography>
              </Box> 
              <StatusChip 
                label={statusInfo.waiting ? "Menunggu" : "Belum Siap"} 
                status="waiting" 
                variant={statusInfo.waiting ? "filled" : "outlined"}
              />
            </Stack>
            */}
          </StepBox>
        </Box>

        <Box mt={3} mb={4} p={2} bgcolor="#f5f5f5" borderRadius={2}>
          <Typography variant="h6" gutterBottom>
            Status Pesanan:
          </Typography>
          <Typography variant="body1" fontWeight="medium" color="primary">
            {statusMessage}
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h5" gutterBottom>
          Detail Pesanan
        </Typography>

        <List>
          {orderDetails.TransaksiDetails.map((item, index) => (
            <ListItem 
              key={index} 
              divider={index < orderDetails.TransaksiDetails.length - 1}
              sx={{ px: 0 }}
            >
              <ListItemText
                primary={
                  <Typography variant="subtitle1" fontWeight="medium">
                    {item.Barang.namabarang}
                  </Typography>
                }
                secondary={
                  <Typography variant="body2" color="text.secondary">
                    {item.Barang.Kategori.namakategori}
                  </Typography>
                }
              />
              <Stack direction="column" alignItems="flex-end">
                <Typography variant="body2" color="text.secondary">
                  {item.jumlahbarang} x Rp {parseFloat(item.harga).toLocaleString('id-ID')}
                </Typography>
                <Typography variant="subtitle1" fontWeight="bold">
                  Rp {parseFloat(item.total).toLocaleString('id-ID')}
                </Typography>
              </Stack>
            </ListItem>
          ))}
        </List>

        <Box mt={3} p={2} bgcolor="#f9f9f9" borderRadius={2}>
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="h6">Total</Typography>
            <Typography variant="h6" fontWeight="bold">
              Rp {parseFloat(orderDetails.totaljual).toLocaleString('id-ID')}
            </Typography>
          </Stack>
        </Box>
      </Paper>
    </Container>
  );
};

export default OrderStatusPage;