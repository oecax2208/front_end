import React, { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import QRCode from "qrcode";
import './Header.css'
import {
  Box,
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  Typography, 
  Button, 
  CircularProgress, 
  Alert, 
  List, 
  ListItem, 
  ListItemText, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  TextField,
  useTheme,
  useMediaQuery,
  IconButton,
  InputBase,
  Divider,
  Drawer,
  AppBar,
  Toolbar,
  Badge,
  
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Close as CloseIcon, 
  ShoppingCart as ShoppingCartIcon,
  Print as PrintIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';
import axios from 'axios';
import Swal from "sweetalert2";
import { useDispatch, useSelector } from 'react-redux';
import { Me } from '../../fitur/AuthSlice';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
// import {  useTheme } from '@mui/material';


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
const ProductPerCabang = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [customerCash, setCustomerCash] = useState("");
  const [receiptData, setReceiptData] = useState([]);
  const [branchName, setBranchName] = useState("Nama Toko");
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
   const [customerName, setCustomerName] = useState("");
   const theme = useTheme();
const isMobile = useMediaQuery(theme.breakpoints.down('sm')); 
   const [mobileCartOpen, setMobileCartOpen] = useState(false);
   
  //console.log("User State:", user); 
  const { data: notificationData, error: notificationError, mutate: mutateNotifications } = useSWR(
    `${getApiBaseUrl()}/notifications`,
    fetcher,
    { 
      refreshInterval: 30000, 
      revalidateOnFocus: true,
      dedupingInterval: 5000
    }
  );
  const notificationCount = notificationData?.data?.length || 0;

  const handleNotificationClick = () => {
    navigate('/notification');
  };
  const formatDate = (date) => {
    return new Intl.DateTimeFormat("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(date);
  };

  useEffect(() => {
    const fetchProductsAndCategories = async () => {
      try {
        const [productResponse, categoryResponse] = await Promise.all([
        //  axios.get(`${getApiBaseUrl()}/barang`, { withCredentials: true }),
          axios.get(`${getApiBaseUrl()}/barangcabang`, { withCredentials: true }),
          axios.get(`${getApiBaseUrl()}/kategori`, { withCredentials: true })
        ]);
        setProducts(productResponse.data.data);
        setCategories(categoryResponse.data.data); 
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchProductsAndCategories();
  }, []);
  useEffect(() => {
    const fetchBranchName = async () => {
      try {
        const response = await axios.get(`${getApiBaseUrl()}/cabang`, { withCredentials: true });
        setBranchName(response.data.branchName || "Nama Toko Tidak Diketahui");
      } catch (err) {
        console.error("Gagal mendapatkan nama cabang:", err);
        setBranchName("Nama Toko Tidak Diketahui");
        navigate('/');  
      }
    };
    
    fetchBranchName();
  }, [navigate]);
  const formatCurrency = (value) => {
    if (typeof value === "string") value = parseFloat(value);
    return typeof value === "number" && !isNaN(value)
      ? value.toLocaleString("id-ID", { style: "currency", currency: "IDR" }).replace("Rp", "Rp ")
      : "Rp 0";
  };
  
  const addToOrder = (product) => {
    setOrders((prevOrders) => {
      const existingOrder = prevOrders.find((order) => order.id === product.baranguuid);
      if (existingOrder) {
        return prevOrders.map((order) =>
          order.id === product.baranguuid
            ? { ...order, quantity: order.quantity + 1 }
            : order
        );
      }
      return [
        ...prevOrders,
        {
          id: product.baranguuid,
          name: product.Barang.namabarang,
          price: parseFloat(product.Barang.harga),
          quantity: 1,
        },
      ];
    });
  };

  const removeOrder = (id) => {
    setOrders((prevOrders) => prevOrders.filter((order) => order.id !== id));
  };

  const handlePayment = async () => {
    const total = orders.reduce((sum, order) => sum + order.price * order.quantity, 0);
  
    if (!selectedPaymentMethod) {
      Swal.fire("Metode Pembayaran Tidak Dipilih", "Pilih metode pembayaran terlebih dahulu", "error");
      return;
    }
  
    if (selectedPaymentMethod === "cash") {
      await processCashPayment(total);
    } else if (selectedPaymentMethod === "qris") {
      await processQrisPayment(total);
    }
  };
 
 // console.log("Receipt Data:", receiptData);
 const processCashPayment = async (total) => {
  if (!customerCash || parseFloat(customerCash) < total) {
    Swal.fire("Uang tidak mencukupi", "Silakan masukkan jumlah yang benar", "error");
    return;
  }

  const change = parseFloat(customerCash) - total;

  try {
    // Kirim data transaksi ke server
    await axios.post(`${getApiBaseUrl()}/createtransaksicabang`, {
      pembayaran: "cash",
      items: orders.map((order) => ({
        baranguuid: order.id,
        jumlahbarang: order.quantity,
      })),
    }, { withCredentials: true });

    // Simpan data transaksi sementara untuk ditampilkan di nota
    setReceiptData({
      total,
      paymentMethod: "Cash",
      customerName,
      customerCash: parseFloat(customerCash),
      change,
      items: orders.map((order) => ({
        id: order.id,
        name: order.name,
        price: order.price,
        quantity: order.quantity,
      })),
    });

    // Update local product stock
    updateProductStock(orders);

    // Tampilkan sukses transaksi
    Swal.fire({
      title: "Pembayaran Berhasil",
      html: `<p>Total: Rp ${formatCurrency(total)}</p><p>Dibayar: Rp ${formatCurrency(parseFloat(customerCash))}</p><p>Kembalian: Rp ${formatCurrency(change)}</p>`,
      icon: "success",
    });

    // Reset data transaksi
    setPaymentDialogOpen(false);
    setReceiptDialogOpen(true);
    setOrders([]); // Kosongkan daftar pesanan
    setCustomerName(''); // Reset nama pembeli
    setCustomerCash(''); // Reset uang customer
  } catch (error) {
    Swal.fire("Terjadi kesalahan", "Gagal menyimpan transaksi", "error");
  }
};
  
  const renderQRCode = (qrString) => {
    return `<div id="qrcode-container" style="background: white; padding: 16px; border-radius: 8px; display: inline-block;"></div>`;
  };
  //-----------------------TRANSAKSI MIDTRANS BANYAK OPSI(SNAP)--------------------------
  // const processQrisPayment = async (total) => {
  //   try {
  //     const response = await axios.post(
  //       `${getApiBaseUrl()}/createtransaksicabang`,
  //       {
  //         pembayaran: "qris",
  //         items: orders.map((order) => ({
  //           baranguuid: order.id,
  //           jumlahbarang: order.quantity,
  //         })),
  //       },
  //       { withCredentials: true }
  //     );
  
  //     const { qris_url, transaksi } = response.data?.data || {};
  //     const orderId = transaksi?.order_id;
  
  //     // Validasi respons
  //     if (!qris_url || !orderId) {
  //       Swal.fire("Terjadi kesalahan", "Data pembayaran QRIS tidak tersedia", "error");
  //       return;
  //     }
  
  //     // Tampilkan modal dengan iframe Midtrans
  //     Swal.fire({
  //       title: "Pembayaran QRIS",
  //       html: `
  //         <div class="text-center">
  //           <p style="font-size: 16px; margin: 10px 0;">
  //             <strong>Total Pembayaran:</strong> Rp ${total.toLocaleString()}
  //           </p>
  //           <p style="font-size: 14px; color: #666; margin: 10px 0;">
  //             Order ID: ${orderId}
  //           </p>
  //           <iframe 
  //             src="${qris_url}"
  //             frameborder="0"
  //             width="100%"
  //             height="550px"
  //           ></iframe>
  //         </div>
  //       `,
  //       showConfirmButton: true,
  //       confirmButtonText: "Tutup",
  //       width: 500,
  //       showCloseButton: true,
  //       allowOutsideClick: false,
  //       didOpen: () => {
  //         const handlePaymentStatus = (event) => {
  //           if (event.data === "success") {
  //             Swal.close();
  //             startPaymentStatusPolling(orderId, () => {
  //               setReceiptData({
  //                 total,
  //                 paymentMethod: "Qris",
  //                 items: orders.map((order) => ({
  //                   id: order.id,
  //                   name: order.name,
  //                   price: order.price,
  //                   quantity: order.quantity,
  //                 })),
  //               });
  //             });
  //           }
  //         };

  //         window.addEventListener("message", handlePaymentStatus);
  //         Swal.getPopup().addEventListener("click", () => {
  //           window.removeEventListener("message", handlePaymentStatus);
  //         });
  //       },
  //     });
  //   } catch (error) {
  //     console.error("Error processing QRIS payment:", error);
  //     Swal.fire("Terjadi kesalahan", "Gagal memproses pembayaran QRIS", "error");
  //   }
  // };
  
  //-----------------TRANSAKSI KSHUS QRIS(COREAPI)------------------------//
  const processQrisPayment = async (total) => {
    try {
      const response = await axios.post(`${getApiBaseUrl()}/createtransaksicabang`, {
        pembayaran: "qris",
        items: orders.map((order) => ({
          baranguuid: order.id,
          jumlahbarang: order.quantity,
        })),
      },{withCredentials: true});
  
      const { qris_data, transaksi } = response.data?.data || {};
      const qrString = qris_data?.qr_string;
      const orderId = transaksi?.order_id;
      const generatedImageUrl = qris_data?.generated_image_url;
  
      if (!qrString || !orderId) {
        Swal.fire("Terjadi kesalahan", "Data QRIS tidak tersedia", "error");
        return;
      }
      setPaymentDialogOpen(false);
      Swal.fire({
        title: "Scan QRIS",
        html: `
          <div class="text-center">
            <p style="font-size: 16px; margin: 10px 0;">
          <strong>Total Pembayaran:</strong> Rp ${formatCurrency(total)}
            </p>
            <p style="font-size: 14px; color: #666; margin: 10px 0;">
              Order ID: ${orderId}
            </p>
            <p style="font-size: 14px; color: #444;">
              Silakan scan kode QR menggunakan aplikasi e-wallet Anda.
            </p>
            <img src="${generatedImageUrl}" alt="QRIS Code" style="max-width: 256px; height: auto;"/>
          </div>
        `,
        showConfirmButton: true,
        confirmButtonText: "Tutup",
        width: 600,
        showCloseButton: true,
      });
      startPaymentStatusPolling(orderId, () => {
        // Update product stock after successful QRIS payment
        updateProductStock(orders);
        
        setReceiptData({
          total,
          paymentMethod: "Qris",
          customerName,
          items: orders.map((order) => ({
            id: order.id,
            name: order.name,
            price: order.price,
            quantity: order.quantity,
          })),
        });
        setReceiptDialogOpen(true);
        setOrders([]); 
      });
    } catch (error) {
      console.error("Error processing QRIS payment:", error);
      Swal.fire("Terjadi kesalahan", "Gagal memproses pembayaran QRIS", "error");
    }
  };
  const updateProductStock = (orderItems) => {
    setProducts(prevProducts => {
      return prevProducts.map(product => {
        const orderItem = orderItems.find(order => order.id === product.baranguuid);
        
        if (orderItem) {
          const newStock = parseInt(product.stok) - orderItem.quantity;
          return {
            ...product,
            stok: Math.max(0, newStock).toString()
          };
        }
        return product;
      });
    });
  };
  useEffect(() => {
    dispatch(Me());
  }, [dispatch]);
  

  // **Render QR Code**

  
  // **Polling Status Pembayaran**
  const startPaymentStatusPolling = (orderId, onSuccess) => {
    const pollInterval = setInterval(async () => {
      try {
        const statusResponse = await axios.get(`${getApiBaseUrl()}/gettransaksinotification/${orderId}`);
        const status = statusResponse.data?.data?.transaksi?.status_pembayaran;
  
        if (status === "settlement") {
          clearInterval(pollInterval);
          Swal.fire({
            title: "Pembayaran Berhasil!",
            text: "Terima kasih atas pembayaran Anda.",
            icon: "success",
          });
          if (onSuccess) onSuccess(); // This will call updateProductStock
        } else if (status === "expire" || status === "cancel") {
          clearInterval(pollInterval);
          Swal.fire({
            title: "Pembayaran Gagal",
            text: "Silakan coba lagi.",
            icon: "error",
          });
        }
      } catch (error) {
        console.error("Error checking payment status:", error);
      }
    }, 5000); 
  
    setTimeout(() => clearInterval(pollInterval), 300000);
  };
  const ReceiptDialog = () => {
    const items = Array.isArray(receiptData?.items) ? receiptData.items : [];
    const totalKeseluruhan = receiptData?.total || 0;
    const change = receiptData?.change || 0;
    const customerName = receiptData?.customerName || "Tidak Diketahui";
    const customerCash = receiptData?.customerCash || 0;
  
    return (
      <Dialog open={receiptDialogOpen} onClose={() => setReceiptDialogOpen(false)}>
        <DialogTitle align="center">Struk Pembelian</DialogTitle>
        <DialogContent>
          <div id="receipt-preview" style={{ minWidth: "300px" }}>
            <Typography variant="h6" align="center">
              {user?.cabang?.namacabang || "Cabang Tidak Diketahui"}
            </Typography>
            <Typography align="center">Pemesan: {customerName}</Typography>
            <Typography variant="body2" align="center" gutterBottom>
              {formatDate(new Date())}
            </Typography>
            <Divider style={{ margin: "10px 0" }} />
            <List>
              {items.map((order, index) => (
                <ListItem key={order.id || index} style={{ padding: "4px 0" }}>
                  <ListItemText
                    primary={order.name || "Nama barang tidak tersedia"}
                    secondary={`Rp ${order.price.toLocaleString()} x ${order.quantity || 0}`}
                  />
                  <Typography>
                    Rp {(order.price * order.quantity).toLocaleString()}
                  </Typography>
                </ListItem>
              ))}
            </List>
            <Divider style={{ margin: "10px 0" }} />
            <Typography variant="h6" align="right" gutterBottom>
              Total: Rp {totalKeseluruhan.toLocaleString()}
            </Typography>
            <Typography variant="h6" align="right" gutterBottom>
              Uang Customer: Rp {customerCash.toLocaleString()}
            </Typography>
            <Typography variant="h6" align="right" gutterBottom>
              Kembalian: Rp {change.toLocaleString()}
            </Typography>
            <Typography variant="body2" align="center">
              Metode Pembayaran: {receiptData?.paymentMethod || "Tidak diketahui"}
            </Typography>
          </div>
        </DialogContent>
        <DialogActions>
          <Button id="btn-cetak" onClick={printReceipt} color="primary">
            Cetak
          </Button>
          <Button
            id="btn-tutup"
            onClick={() => setReceiptDialogOpen(false)}
            color="secondary"
          >
            Tutup
          </Button>
        </DialogActions>
      </Dialog>
    );
  };
  
  
  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      !selectedCategory || product?.Barang?.Kategori?.namakategori === selectedCategory;
    const matchesSearch =
      !searchTerm ||
      product?.Barang?.namabarang?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });
 // console.log(products);

  

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">Gagal memuat data produk.</Alert>;
  const incrementOrder = (id) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === id ? { ...order, quantity: order.quantity + 1 } : order
      )
    );
  };
  
  const decrementOrder = (id) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === id && order.quantity > 1
          ? { ...order, quantity: order.quantity - 1 }
          : order
      )
    );
  };

  const printReceipt = () => {
    if (!receiptData || !Array.isArray(receiptData.items) || receiptData.items.length === 0) {
      Swal.fire("Tidak ada data untuk dicetak", "", "error");
      return;
    }
  
    const total = receiptData.items.reduce(
      (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
      0
    );
  
    const change = parseFloat(customerCash || 0) - total;
  
    const receiptContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Struk Pembelian</title>
          <style>
            @page {
              size: 58mm auto;
              margin: 0;
            }
            body {
              font-family: Arial, sans-serif;
              width: 58mm;
              padding: 3mm;
              margin: 0;
              font-size: 8pt;
              box-sizing: border-box;
            }
            .header {
              text-align: center;
              margin-bottom: 5mm;
            }
            .store-name {
              font-size: 10pt;
              font-weight: bold;
            }
            .date {
              font-size: 8pt;
              margin: 2mm 0;
            }
            .divider {
              border-top: 1px dashed #000;
              margin: 3mm 0;
            }
            .items {
              list-style: none;
              padding: 0;
              margin: 0;
            }
            .item {
              margin-bottom: 2mm;
              display: flex;
              justify-content: space-between;
              font-size: 8pt;
            }
            .total, .change {
              text-align: right;
              font-size: 9pt;
              font-weight: bold;
              margin: 3mm 0;
            }
            .payment-method {
              text-align: center;
              font-size: 8pt;
              margin-top: 3mm;
            }
            .footer {
              text-align: center;
              font-size: 7pt;
              margin-top: 5mm;
            }
          </style>
        </head>
        <body>
          <div class="header">
           <p class="store-name">${user?.cabang?.namacabang || "Cabang Tidak Diketahui"}</p>
            <p class="customer-name">Pemesan: ${customerName || "Tidak Diketahui"}</p>
            <p class="date">${formatDate(new Date())}</p>
          </div>
          <div class="divider"></div>
          <ul class="items">
            ${receiptData.items
              .map(
                (order) => `
                  <li class="item">
                    <span>${order.name || "Barang tidak tersedia"}</span>
                    <span>${order.quantity || 0} x Rp ${order.price.toLocaleString()} = Rp ${(order.price * order.quantity).toLocaleString()}</span>
                  </li>
                `
              )
              .join("")}
          </ul>
          <div class="divider"></div>
          <p class="total">Total: Rp ${total.toLocaleString()}</p>
          ${
            receiptData.paymentMethod === "Cash"
              ? `<p class="total">Uang Customer: Rp ${parseFloat(customerCash || 0).toLocaleString()}</p>
                 <p class="change">Kembalian: Rp ${change > 0 ? change.toLocaleString() : 0}</p>`
              : ""
          }
          <p class="payment-method">Metode Pembayaran: ${receiptData.paymentMethod || "Tidak diketahui"}</p>
          <div class="footer">Terima kasih atas kunjungan Anda</div>
        </body>
      </html>
    `;
  
    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.top = "-10000px";
    document.body.appendChild(iframe);
  
    const iframeDoc = iframe.contentWindow || iframe.contentDocument;
    iframeDoc.document.open();
    iframeDoc.document.write(receiptContent);
    iframeDoc.document.close();
  
    setTimeout(() => {
      iframe.contentWindow.print();
      document.body.removeChild(iframe);
    }, 500);
  };
  
const formatRupiah = (value) =>{
  if(!value)return "";
  return value
  .toString()
 .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
const OrdersList = () => (
  <Box sx={{ 
    display: 'flex',
    flexDirection: 'column',
    height: isMobile ? '100%' : 'auto',
    bgcolor: 'white',
    borderRadius: isMobile ? 0 : 2,
    p: 5,
    boxShadow: 2
  }}>
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      mb: 2 
    }}>
      {isMobile && (
        <IconButton 
          variant="outlined" 
          color="secondary" 
          size="small"
          onClick={() => setMobileCartOpen(false)}
        >
          <CloseIcon />
         </IconButton>
       
      )}
    </Box>
    <Typography variant="p" sx={{ mb: 2}}>
      Order List
    </Typography>
    <div style={{ maxHeight: '300px', overflowY: 'auto', padding: '1px', border: '1px solid #ddd', borderRadius: '1px' }}>
    <List>
      {orders.map((order) => (
        <ListItem
          key={order.id}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            gap: 1,
            py: 2,
            borderBottom: '1px solid #eee'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="subtitle2">{order.name}</Typography>
            <Button
              color="error"
              size="small"
              onClick={() => removeOrder(order.id)}
            >
              Remove
            </Button>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Rp {(order.price * order.quantity).toLocaleString()}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => decrementOrder(order.id)}
                sx={{ minWidth: '32px', p: 0 }}
              >
                -
              </Button>
              <Typography>{order.quantity}</Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={() => incrementOrder(order.id)}
                sx={{ minWidth: '32px', p: 0 }}
              >
                +
              </Button>
            </Box>
          </Box>
        </ListItem>
      ))}
    </List>
</div>
    <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #eee' }}>
      <Typography variant="h6" sx={{ mb: 2, textAlign: 'right' }}>
        Total: Rp {orders.reduce((sum, order) => sum + order.price * order.quantity, 0).toLocaleString()}
      </Typography>
      <Button
        variant="contained"
        fullWidth
        onClick={() => {
          setPaymentDialogOpen(true);
          if (isMobile) setMobileCartOpen(false);
        }}
        sx={{ 
          py: 1.5,
          bgcolor: 'secondary.main',
          '&:hover': { bgcolor: 'secondary.dark' }
        }}
      >
        Pay
      </Button>
    </Box>
  </Box>
);
return (
  <Box 
    sx={{ 
      display: 'flex', 
      flexDirection: 'row', 
      height: '100vh', 
      backgroundColor: '#f0f2f5' 
    }}
  >
    {/* Products Section */}
    <Box 
      sx={{ 
        flex: 3, 
        display: 'flex', 
        flexDirection: 'column', 
        p: { xs: 1, sm: 2 }, 
        gap: 2 
      }}
    >
      {/* Mobile Header */}
      {isMobile && (
        <AppBar 
          position="static" 
          color="default" 
          elevation={0}
          sx={{ borderRadius: 2, backgroundColor: 'transparent' }}
        >
          <Toolbar>
            <Typography 
              variant="h6" 
              sx={{ 
                flexGrow: 1, 
                fontWeight: 'bold', 
                color: 'primary.main' 
              }}
            >
              POS System
            </Typography>
            <Badge badgeContent={notificationCount} color="error" sx={{ mr: 2 }}>
                <IconButton onClick={handleNotificationClick} if>
                  <NotificationsIcon />
                </IconButton>
              </Badge>
            <Badge badgeContent={orders.length} color="secondary">
              <IconButton onClick={() => setMobileCartOpen(true)}>
                <ShoppingCartIcon />
              </IconButton>
            </Badge>
          </Toolbar>
        </AppBar>
      )}

      {/* Filters */}
      <Box 
  sx={{ 
    display: 'flex', 
    flexDirection: { xs: 'column', sm: 'row' }, 
    gap: 2, 
    backgroundColor: 'white', 
    p: 2, 
    borderRadius: 2, 
    boxShadow: 1 
  }}
>
  <FormControl 
    size="small" 
    sx={{ 
      width: { xs: '100%', sm: 200 }, 
      mb: { xs: 2, sm: 0 }
    }}
  >
    <Select
      value={selectedCategory}
      onChange={(e) => setSelectedCategory(e.target.value)}
      displayEmpty
      sx={{ 
        borderRadius: 2, 
        width: '100%',
        '& .MuiSelect-select': { 
          py: 1.5 
        } 
      }}
    >
      <MenuItem value="">All Categories</MenuItem>
      {categories.map((category) => (
        <MenuItem 
          key={category.uuid} 
          value={category.namakategori}
        >
          {category.namakategori}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
            {!isMobile && (
            <Badge badgeContent={notificationCount} color="error" sx={{ mr: 2 }}>
              <IconButton onClick={handleNotificationClick}>
                <NotificationsIcon />
              </IconButton>
            </Badge>
          )}
  {/* Search Section */}
  <Box sx={{ flex: 1, width: '100%' }}>
    {showSearch ? (
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          border: '1px solid', 
          borderColor: 'divider', 
          borderRadius: 2, 
          px: 2,
          width: '100%'
        }}
      >
        <InputBase
          placeholder="Search products"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ 
            flex: 1, 
            py: 1,
            width: '100%'
          }}
          startAdornment={<SearchIcon sx={{ mr: 2, color: 'text.secondary' }} />}
        />
        <IconButton 
          size="small" 
          onClick={() => setShowSearch(false)}
        >
          <CloseIcon />
        </IconButton>
      </Box>
    ) : (
      <Button
        variant="outlined"
        fullWidth
        onClick={() => setShowSearch(true)}
        startIcon={<SearchIcon />}
        sx={{ 
          borderRadius: 2, 
          py: 1.5,
          width: '100%'
        }}
      >
        Search Products
      </Button>
    )}
  </Box>
</Box>

      {/* Product Grid */}
<Box sx={{ overflowY: "auto", p: 2 }}>
  <Grid container spacing={2}>
    {filteredProducts.map((product) => (
      <Grid item xs={6} sm={4} md={3} key={product.uuid}>
        <Card sx={{ 
          display: "flex", 
          flexDirection: "column", 
          borderRadius: 2, 
          boxShadow: 3,
          height: '100%',
          width: '100%',
          maxWidth: 280,
          margin: '0 auto'
        }}>
          <Box sx={{ position: "relative", pt: "75%", backgroundColor: "white" }}>
            <CardMedia
              component="img"
              image={`${getApiBaseUrl()}/uploads/${product?.Barang?.foto || product?.foto}`}
              alt={product?.Barang?.namabarang}
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "12px 12px 0 0",
              }}
            />
          </Box>
          <CardContent sx={{ p: 2, textAlign: "center", flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Box>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 'bold', 
                  mb: 1, 
                  fontSize: '1rem',
                  height: '2.5rem',
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  textOverflow: 'ellipsis'
                }}
              >
                {product?.Barang?.namabarang}
              </Typography>
              <Typography 
                color="primary" 
                sx={{ 
                  fontWeight: 'bold', 
                  mb: 1, 
                  fontSize: '0.9rem' 
                }}
              >
                Rp {parseFloat(product?.Barang?.harga).toLocaleString("id-ID")}
              </Typography>
            </Box>
            <Box>
              <Typography
                sx={{
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "text.primary",
                  mb: 0.5
                }}
              >
                {product?.Barang?.Kategori?.namakategori}
              </Typography>
              <Typography
                sx={{
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: parseInt(product?.stok) === 0 ? "error.main" : "text.primary",
                  mb: 1
                }}
              >
                Stok tersedia: {product?.stok}
              </Typography>
            </Box>
          </CardContent>
          <Button
            variant="contained"
            fullWidth
            disabled={parseInt(product?.stok) === 0}
            sx={{
              py: 1.5,
              borderRadius: "0 0 12px 12px",
              backgroundColor: parseInt(product?.stok) === 0 ? "grey.400" : "primary.main",
              color: parseInt(product?.stok) === 0 ? "text.secondary" : "white",
              transition: "background-color 0.3s",
              "&:hover": { 
                backgroundColor: parseInt(product?.stok) === 0 ? "grey.400" : "primary.dark" 
              },
              "&.Mui-disabled": {
                backgroundColor: "grey.300",
                color: "text.secondary"
              }
            }}
            onClick={() => addToOrder(product)}
          >
            {parseInt(product?.stok) === 0 ? "Out of Stock" : "Add to Order"}
          </Button>
        </Card>
      </Grid>
    ))}
  </Grid>
</Box>
</Box>

    {/* Orders Section */}
    {!isMobile ? (
      <Box 
        sx={{ 
          width: 350, 
          backgroundColor: 'white', 
          borderLeft: '1px solid', 
          borderColor: 'divider' 
        }}
      >
        <OrdersList />
      </Box>
    ) : (
      <Drawer
        anchor="right"
        open={mobileCartOpen}
        onClose={() => setMobileCartOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: '100%',
            maxWidth: 350,
            boxSizing: 'border-box',
            borderRadius: '16px 0 0 16px'
          },
        }}
      >
        <OrdersList />
      </Drawer>
    )}

    {/* Payment Dialog */}
    <ReceiptDialog />
    <Dialog 
      open={paymentDialogOpen} 
      onClose={() => setPaymentDialogOpen(false)}
      PaperProps={{ 
        sx: { 
          borderRadius: 3, 
          p: 1 
        } 
      }}
    >
      <DialogTitle>Select Payment Method</DialogTitle>
      <DialogContent>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <Select
            value={selectedPaymentMethod}
            onChange={(e) => setSelectedPaymentMethod(e.target.value)}
            displayEmpty
            sx={{ 
              borderRadius: 2, 
              mb: 2 
            }}
          >
            <MenuItem value="qris">QRIS</MenuItem>
            <MenuItem value="cash">Cash</MenuItem>
          </Select>
          
          {selectedPaymentMethod && (
            <TextField
              fullWidth
              label="Customer Name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              sx={{ mb: 2 }}
              variant="outlined"
            />
          )}

          {selectedPaymentMethod === "cash" && (
            <TextField
              fullWidth
              label="Customer Cash"
              type="text" 
              value={formatRupiah(customerCash)}
              onChange={(e) => {
                const rawValue = e.target.value.replace(/\./g, "");
                setCustomerCash(rawValue);
              }}
              variant="outlined"
            />
          )}
        </FormControl>
      </DialogContent>
      <DialogActions>
          <Button 
            onClick={() => setPaymentDialogOpen(false)} 
            color="secondary"
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handlePayment} 
            color="primary" 
            variant="contained"
            sx={{ 
              borderRadius: 2,
              px: 3  
            }}
            startIcon={<PrintIcon />}
          >
            Pay & Print
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
export default ProductPerCabang;