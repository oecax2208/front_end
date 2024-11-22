import React, { useState, useEffect, useRef } from 'react';
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
  Card,
  CardContent,
  Chip,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  TextField,
  InputAdornment,
  Pagination,
  Modal,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  Search as SearchIcon,
  Sort as SortIcon,
  Print as PrintIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import useSWR from 'swr';
import axios from 'axios';
import { format, formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import Swal from "sweetalert2";

const getApiBaseUrl = () => {
  const protocol = window.location.protocol === "https:" ? "https" : "http";
  const baseUrl = process.env.REACT_APP_URL.replace(/^https?:\/\//, "");
  return `${protocol}://${baseUrl}`;
};

const fetcher = async (url) => {
    const response = await axios.get(url, {
      withCredentials: true
    });
    return response.data; 
  };

// Updated Thermal Receipt Component for printing
const ThermalReceipt = React.forwardRef(({ orderDetail }, ref) => {
    if (!orderDetail) return null;
    const transaksi = orderDetail.Transaksi;
    
    return (
      <div ref={ref} style={{ width: '58mm', fontFamily: 'monospace', padding: '0mm' }}>
        <div style={{ textAlign: 'center', marginBottom: '5mm' }}>
          <div style={{ fontWeight: 'bold', fontSize: '12pt' }}>{transaksi.User.Cabang.namacabang}</div>
          <div style={{ fontSize: '8pt' }}>Struk Pembayaran</div>
          <div style={{ fontSize: '8pt', marginTop: '2mm' }}>
            {format(new Date(orderDetail.timestamp), 'dd/MM/yyyy HH:mm', { locale: id })}
          </div>
        </div>
        
        <div style={{ marginBottom: '3mm', borderBottom: '1px dashed #000', paddingBottom: '2mm' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8pt' }}>
            <span>ID Pesanan:</span>
            <span>{orderDetail.orderId}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8pt' }}>
            <span>Kasir:</span>
            <span>{transaksi.User.username}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8pt' }}>
            <span>Meja:</span>
            <span>{transaksi.tableId}</span>
          </div>
        </div>
        
        {/* Display actual items from TransaksiDetails */}
        <div style={{ marginBottom: '3mm', borderBottom: '1px dashed #000', paddingBottom: '2mm' }}>
          <div style={{ fontSize: '8pt', fontWeight: 'bold', marginBottom: '2mm' }}>Detail Barang:</div>
          {transaksi.TransaksiDetails.map((item, index) => (
            <div key={index} style={{ fontSize: '8pt', marginBottom: '1mm' }}>
              {item.Barang.namabarang} ({item.jumlahbarang}x) {Number(item.harga).toLocaleString('id-ID')} = Rp {Number(item.total).toLocaleString('id-ID')}
            </div>
          ))}
        </div>
        
        <div style={{ marginBottom: '3mm', borderBottom: '1px dashed #000', paddingBottom: '2mm' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8pt' }}>
            <span>Total:</span>
            <span>Rp {Number(transaksi.totaljual).toLocaleString('id-ID')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8pt' }}>
            <span>Status:</span>
            <span>{transaksi.status_pembayaran}</span>
          </div>
          {transaksi.pembayaran && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8pt' }}>
              <span>Metode:</span>
              <span>{transaksi.pembayaran}</span>
            </div>
          )}
        </div>
        
        <div style={{ marginBottom: '3mm', fontSize: '8pt' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Cabang:</span>
            <span>{transaksi.User.Cabang.namacabang}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Kasir:</span>
            <span>{transaksi.User.username}</span>
          </div>
        </div>
        
        <div style={{ marginTop: '5mm', textAlign: 'center', fontSize: '8pt' }}>
          {orderDetail.message}
        </div>
        
        <div style={{ marginTop: '10mm', textAlign: 'center', fontSize: '8pt' }}>
          -- Terima Kasih --
        </div>
      </div>
    );
  });

export const OrderDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams(); 
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const printRef = useRef(null);
  const apiBaseUrl = getApiBaseUrl();
  const listApiUrl = `${apiBaseUrl}/getdetails?page=${currentPage}&limit=${itemsPerPage}`;
  const { data: listData, error: listError, mutate: mutateList } = useSWR(listApiUrl, fetcher);
  const detailApiUrl = selectedOrderId ? `${apiBaseUrl}/getdetails/${selectedOrderId}` : null;
  const { data: detailData, error: detailError, mutate: mutateDetail } = useSWR(
    detailApiUrl, 
    selectedOrderId ? fetcher : null
  );
  
  const loading = !listData && !listError;
  const loadingDetail = selectedOrderId && !detailData && !detailError;
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, sortOrder]);
  useEffect(() => {
    if (id) {
      setSelectedOrderId(id);
      setModalOpen(true);
    }
    return () => {
        if (id) {
          setModalOpen(false);
        }
      };
  }, [id]);
  
  useEffect(() => {
    console.log("ID from params:", id);
    console.log("Selected Order ID:", selectedOrderId);
    console.log("Modal Open State:", modalOpen);
    
    if (id) {
      setSelectedOrderId(id);
      setModalOpen(true);
    }
  }, [id]);
  
  useEffect(() => {
    console.log("Detail API URL:", detailApiUrl);
    console.log("Detail Data:", detailData);
  }, [detailApiUrl, detailData]);
  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=58mm,height=600');
    
    if (printWindow) {
      printWindow.document.write('<html><head><title>Print Receipt</title>');
      printWindow.document.write(`
        <style>
          @page {
            size: 58mm auto;
            margin: 0;
          }
          body {
            width: 58mm;
            margin: 0;
            padding: 0;
            font-family: monospace;
          }
        </style>
      `);
      printWindow.document.write('</head><body>');
      if (printRef.current) {
        printWindow.document.write(printRef.current.innerHTML);
      }
      
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.onload = function() {
        printWindow.focus();
        printWindow.print();
        printWindow.addEventListener('afterprint', function() {
          printWindow.close();
        });
      };
    }
  };
  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedOrderId(null);
    if (id) {
      navigate('/orders', { replace: true });
    }
  };
  const markAsRead = async (notificationId) => {
    try {
      await axios.post(`${apiBaseUrl}/notifications/read/${notificationId}`, {}, {
        withCredentials: true
      });
      mutateList();
      if (selectedOrderId) {
        mutateDetail();
      }
      
      Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: 'Notifikasi telah ditandai sebagai dibaca',
        timer: 1500
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: 'Gagal menandai notifikasi sebagai dibaca'
      });
    }
  };
  const handlePageChange = (event, value) => {
    setCurrentPage(value);
    window.scrollTo(0, 0); 
  };
  const handleItemsPerPageChange = (event) => {
    setItemsPerPage(parseInt(event.target.value));
    setCurrentPage(1); 
  };
  const viewOrderDetails = (notificationId) => {
    console.log('Viewing details for notification ID:', notificationId);
    setSelectedOrderId(notificationId);
    setModalOpen(true); 
  };
  
  
  const processData = (data) => {
    if (!data || !Array.isArray(data)) return [];
    
    let processedData = [...data];
    if (filterType !== 'all') {
      processedData = processedData.filter(item => item.type === filterType);
    }
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      processedData = processedData.filter(item => 
        item.message.toLowerCase().includes(searchLower) || 
        item.orderId.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort based on time
    processedData.sort((a, b) => {
      const timestampA = new Date(a.timestamp).getTime();
      const timestampB = new Date(b.timestamp).getTime();
      return sortOrder === 'newest' ? timestampB - timestampA : timestampA - timestampB;
    });
    
    return processedData;
  };
  const notifications = listData && listData.success ? processData(listData.data) : [];
  const pagination = listData && listData.success ? listData.pagination : null;
  
  const orderDetail = detailData && detailData.success ? detailData.data : null;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (listError) {
    return (
      <Box sx={{ mt: 2 }}>
        <Alert severity="error">
          Gagal memuat data. {listError.message}
        </Alert>
      </Box>
    );
  }
  
  const renderOrderDetailModal = () => {
    if (loadingDetail) {
      return (
        <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
          <DialogContent>
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          </DialogContent>
        </Dialog>
      );
    }
    
    if (detailError) {
      return (
        <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
          <DialogContent>
            <Alert severity="error">
              Gagal memuat detail pesanan. {detailError.message}
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseModal} color="primary">Tutup</Button>
          </DialogActions>
        </Dialog>
      );
    }

    if (!detailData || !detailData.success || !detailData.data) return null;

    // Pastikan data diakses dengan aman
    const orderDetail = Array.isArray(detailData.data) ? detailData.data[0] : detailData.data;
    const transaksi = orderDetail?.Transaksi || {};

    console.log("Mapped Order Detail:", orderDetail);
    console.log("Mapped Transaction:", transaksi);

    return (
      <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Detail Pesanan</Typography>
            <Box>
              <IconButton onClick={handlePrint} color="primary" sx={{ mr: 1 }}>
                <PrintIcon />
              </IconButton>
              <IconButton onClick={handleCloseModal}>
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Informasi Pesanan</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Chip 
                  icon={orderDetail.read ? <CheckCircleIcon /> : <AccessTimeIcon />} 
                  label={orderDetail.read ? "Sudah Dibaca" : "Belum Dibaca"} 
                  color={orderDetail.read ? "success" : "warning"} 
                  size="small" 
                  sx={{ mr: 2 }}
                />
                <Typography variant="body2" color="text.secondary">
                  {format(new Date(orderDetail.timestamp), 'dd MMMM yyyy, HH:mm', { locale: id })}
                  {' '}({formatDistanceToNow(new Date(orderDetail.timestamp), { addSuffix: true, locale: id })})
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ mb: 1 }}>{orderDetail.message}</Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom>ID Pesanan: {orderDetail.orderId}</Typography>
              <Typography variant="subtitle1" gutterBottom>Tipe: {orderDetail.type}</Typography>
              <Typography variant="subtitle1" gutterBottom>Status Pembayaran: {transaksi.status_pembayaran}</Typography>
              {transaksi.pembayaran && (
                <Typography variant="subtitle1" gutterBottom>Metode Pembayaran: {transaksi.pembayaran}</Typography>
              )}
              <Typography variant="subtitle1" gutterBottom>Meja: {transaksi.tableId}</Typography>
            </CardContent>
          </Card>

          {/* Detail Barang */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Detail Barang</Typography>
              <List disablePadding>
                {(transaksi.TransaksiDetails || []).map((item, index) => (
                  <ListItem key={index} disablePadding sx={{ py: 1 }}>
                    <ListItemText
                      primary={item.Barang?.namabarang || "Barang Tidak Diketahui"}
                      secondary={`${item.jumlahbarang}x @ Rp ${Number(item.harga).toLocaleString('id-ID')}`}
                    />
                    <Typography variant="body1">
                      Rp {Number(item.total).toLocaleString('id-ID')}
                    </Typography>
                  </ListItem>
                ))}
                <Divider sx={{ my: 1 }} />
                <ListItem disablePadding sx={{ py: 1 }}>
                  <ListItemText primary="Total" />
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    Rp {Number(transaksi.totaljual).toLocaleString('id-ID')}
                  </Typography>
                </ListItem>
              </List>
            </CardContent>
          </Card>

          {/* Informasi Cabang */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Informasi Cabang</Typography>
              <Typography variant="subtitle1" gutterBottom>Nama Cabang: {transaksi.User?.Cabang?.namacabang || "N/A"}</Typography>
              <Typography variant="subtitle1" gutterBottom>Kasir: {transaksi.User?.username || "N/A"}</Typography>
            </CardContent>
          </Card>

          {/* Debug JSON Data */}
          {/* <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Data JSON</Typography>
              <Box component="pre" sx={{ overflowX: 'auto', backgroundColor: '#f5f5f5', p: 2, borderRadius: 1, fontSize: '0.8rem' }}>
                {JSON.stringify({ success: true, data: orderDetail }, null, 2)}
              </Box>
            </CardContent>
          </Card> */}

        </DialogContent>
        <DialogActions>
          {!orderDetail.read && (
            <Button variant="contained" color="primary" onClick={() => markAsRead(orderDetail.id)}>
              Tandai Sebagai Dibaca
            </Button>
          )}
          <Button onClick={handleCloseModal} color="inherit">Tutup</Button>
        </DialogActions>
      </Dialog>
    );
  };
  return (
    <Box sx={{ p: 2 }}>

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Cari pesan atau ID pesanan..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          margin="normal"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />

<Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mt: 2 }}>
  <FormControl variant="outlined" size="small" sx={{ minWidth: { xs: '100%', sm: 150 } }}>
    <InputLabel>Tipe</InputLabel>
    <Select
      value={filterType}
      onChange={(e) => setFilterType(e.target.value)}
      label="Tipe"
    >
      <MenuItem value="all">Semua</MenuItem>
      <MenuItem value="order_accepted">Pesanan Diterima</MenuItem>
      <MenuItem value="order_completed">Pesanan Selesai</MenuItem>
      <MenuItem value="order_cancelled">Pesanan Dibatalkan</MenuItem>
    </Select>
  </FormControl>

  <FormControl variant="outlined" size="small" sx={{ minWidth: { xs: '100%', sm: 150 } }}>
    <InputLabel>Urutan</InputLabel>
    <Select
      value={sortOrder}
      onChange={(e) => setSortOrder(e.target.value)}
      label="Urutan"
    >
      <MenuItem value="newest">Terbaru</MenuItem>
      <MenuItem value="oldest">Terlama</MenuItem>
    </Select>
  </FormControl>

  <FormControl variant="outlined" size="small" sx={{ minWidth: { xs: '100%', sm: 150 } }}>
    <InputLabel>Item Per Halaman</InputLabel>
    <Select
      value={itemsPerPage}
      onChange={handleItemsPerPageChange}
      label="Item Per Halaman"
    >
      <MenuItem value={5}>5</MenuItem>
      <MenuItem value={10}>10</MenuItem>
      <MenuItem value={25}>25</MenuItem>
      <MenuItem value={50}>50</MenuItem>
    </Select>
  </FormControl>
</Box>
      </Box>

      {notifications.length === 0 ? (
        <Alert severity="info">
          Tidak ada pesanan yang ditemukan
        </Alert>
      ) : (
        <>
          <List component={Paper} sx={{ width: '100%', mb: 2 }}>
            {notifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                <ListItem 
                  alignItems="flex-start"
                  sx={{ 
                    cursor: 'pointer',
                    backgroundColor: notification.read ? 'inherit' : 'rgba(25, 118, 210, 0.05)'}}
                    onClick={() => viewOrderDetails(notification.id)}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="subtitle1" component="span">
                            {notification.orderId}
                          </Typography>
                          <Chip 
                            icon={notification.read ? <CheckCircleIcon /> : <CheckCircleIcon />} 
                            label={notification.read ? "Done" : "Done"} 
                            color={notification.read ? "Done" : "Done"} 
                            size="small" 
                          />
                        </Box>
                      }
                      secondary={
                        <React.Fragment>
                          <Typography
                            sx={{ display: 'block' }}
                            component="span"
                            variant="body2"
                            color="text.primary"
                          >
                            {notification.message}
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Total: Rp {Number(notification.Transaksi.totaljual).toLocaleString('id-ID')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {format(new Date(notification.timestamp), 'dd MMM yyyy, HH:mm', { locale: id })}
                            </Typography>
                          </Box>
                        </React.Fragment>
                      }
                    />
                  </ListItem>
                  {index < notifications.length - 1 && <Divider component="li" />}
                </React.Fragment>
              ))}
            </List>
  
            {/* Pagination component */}
            {pagination && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, mb: 3 }}>
                <Pagination 
                  count={pagination.totalPages}
                  page={currentPage}
                  onChange={handlePageChange}
                  color="primary"
                  showFirstButton 
                  showLastButton
                />
              </Box>
            )}
  
            {/* Pagination summary */}
            {pagination && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, pagination.totalItems)} dari {pagination.totalItems} data
                </Typography>
              </Box>
            )}
          </>
        )}
      
      {/* Render the modal for order details */}
      {renderOrderDetailModal()}
      
    </Box>
  );
};

export default OrderDetails;