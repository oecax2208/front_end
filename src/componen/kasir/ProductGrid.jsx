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
  IconButton,
  InputBase,
  Divider
} from '@mui/material';
import { Search as SearchIcon, Close as CloseIcon } from "@mui/icons-material";
import axios from 'axios';
import Swal from "sweetalert2";
import { useSelector } from 'react-redux';

const getApiBaseUrl = () => {
  const protocol = window.location.protocol === "https:" ? "https" : "http";
  const baseUrl = process.env.REACT_APP_URL.replace(/^https?:\/\//, "");
  return `${protocol}://${baseUrl}`;
};

const ProductGrid = () => {
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
  const [customerName, setCustomerName] = useState("");
  const user = useSelector((state) => state.auth.user);
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
          axios.get(`${getApiBaseUrl()}/barang`, { withCredentials: true }),
          axios.get(`${getApiBaseUrl()}/kategori`, { withCredentials: true })
        ]);
        setProducts(productResponse.data.data || []);
        setCategories(categoryResponse.data.data || []);
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
        setBranchName(response.data.branchName || user?.cabang?.namacabang || "Cabang Tidak Diketahui");
      } catch (err) {
        console.error("Gagal mendapatkan nama cabang:", err);
        setBranchName(user?.cabang?.namacabang || "Cabang Tidak Diketahui");
      }
    };
  
    fetchBranchName();
  }, [user]);
  

  const addToOrder = (product) => {
    setOrders((prevOrders) => {
      const existingOrder = prevOrders.find((order) => order.id === product.uuid);
      if (existingOrder) {
        return prevOrders.map((order) =>
          order.id === product.uuid ? { ...order, quantity: order.quantity + 1 } : order
        );
      }
      return [...prevOrders, { id: product.uuid, name: product.namabarang, price: product.harga, quantity: 1 }];
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
  const printReceipt = () => {
    if (!receiptData || !Array.isArray(receiptData.items) || receiptData.items.length === 0) {
      Swal.fire("Tidak ada data untuk dicetak", "", "error");
      return;
    }
  
    const total = receiptData.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
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
              margin: 0;
            }
            .date {
              font-size: 8pt;
              margin: 2mm 0;
            }
            .divider {
              border-top: 1px dashed #000;
              margin: 2mm 0;
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
            }
            .item-name {
              font-size: 8pt;
              flex: 1;
            }
            .item-details {
              text-align: right;
              font-size: 8pt;
              flex: 1;
            }
            .total,
            .payment-method,
            .change {
              text-align: right;
              font-size: 9pt;
              font-weight: bold;
              margin: 2mm 0;
            }
            .footer {
              text-align: center;
              font-size: 7pt;
              margin-top: 5mm;
            }
            @media print {
              #btn-cetak, #btn-tutup {
                  display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2 class="store-name">${branchName || user?.cabang?.namacabang || "Cabang Tidak Diketahui"}</h2>
            <p>Pemesan: ${customerName || "Tidak Diketahui"}</p>
            <p class="date">${formatDate(new Date())}</p>
          </div>
          <div class="divider"></div>
          <ul class="items">
            ${receiptData.items
              .map(
                (order) => `
                  <li class="item">
                    <span class="item-name">${order.name}</span>
                    <span class="item-details">
                      ${order.quantity} x Rp ${order.price.toLocaleString()} = Rp ${(order.price * order.quantity).toLocaleString()}
                    </span>
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
          <p class="payment-method">Metode Pembayaran: ${receiptData.paymentMethod}</p>
          <div class="footer">Terima kasih atas kunjungan Anda</div>
        </body>
      </html>
    `;
  
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.top = "-10000px";
    iframe.style.left = "-10000px";
    document.body.appendChild(iframe);
  
    const iframeDoc = iframe.contentWindow || iframe.contentDocument;
    iframeDoc.document.open();
    iframeDoc.document.write(receiptContent);
    iframeDoc.document.close();
  
    iframe.onload = () => {
      iframe.contentWindow.print();
      document.body.removeChild(iframe);
    };
  };
  
  // **Proses Pembayaran Tunai**
  const processCashPayment = async (total) => {
    if (!customerCash || parseFloat(customerCash) < total) {
      Swal.fire("Uang tidak mencukupi", "Silakan masukkan jumlah yang benar", "error");
      return;
    }
  
    const change = parseFloat(customerCash) - total;
  
    try {
      await axios.post(`${getApiBaseUrl()}/createtransaksi`, {
        pembayaran: "cash",
        items: orders.map((order) => ({
          baranguuid: order.id,
          jumlahbarang: order.quantity,
        })),
        
      },{withCredentials :true});
      
  
      Swal.fire({
        title: "Pembayaran Berhasil",
        html: `<p>Total: Rp ${total.toLocaleString()}</p><p>Dibayar: Rp ${parseFloat(customerCash).toLocaleString()}</p><p>Kembalian: Rp ${change.toLocaleString()}</p>`,
        icon: "success",
      });
  
      setReceiptData({
        total,
        paymentMethod: "Cash",
        items: orders.map((order) => ({
          id: order.id,
          name: order.name,
          quantity: order.quantity,
          price: order.price,
        })),
      });
      console.log(change)
      setPaymentDialogOpen(false); 
      setReceiptDialogOpen(true); 
      setOrders([]); 
    } catch (error) {
      console.error("Error processing cash payment:", error);
      Swal.fire("Terjadi kesalahan", "Gagal menyimpan transaksi", "error");
    }
  };
  const renderQRCode = (qrString) => {
    return `<div id="qrcode-container" style="background: white; padding: 16px; border-radius: 8px; display: inline-block;"></div>`;
  };
  //----------------------TRANSAKSI BANYAK OPSI-----------------------
  // const processQrisPayment = async (total) => {
  //   try {
  //     const response = await axios.post(
  //       `${getApiBaseUrl()}/createtransaksi`,
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
  
  //     // Tampilkan modal dengan QR code
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
  //       width: 600,
  //       showCloseButton: true
  //     });
  
  //   } catch (error) {
  //     console.error("Error processing QRIS payment:", error);
  //     Swal.fire("Terjadi kesalahan", "Gagal memproses pembayaran QRIS", "error");
  //   }
  // };
  
//----------------------KHUSUS QRIS-------------------  
  const processQrisPayment = async (total) => {
    try {
      const response = await axios.post(`${getApiBaseUrl()}/createtransaksi`, {
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
              <strong>Total Pembayaran:</strong> Rp ${total.toLocaleString()}
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
        setReceiptData({
          total,
          paymentMethod: "Qris",
          items: orders.map((order) => ({
            id: order.id,
            name: order.name,
            quantity: order.quantity,
            price: order.price,
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
          if (onSuccess) onSuccess(); 
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
    const total = items.reduce((sum, order) => sum + order.price * order.quantity, 0);
    const change = parseFloat(customerCash || 0) - total;
  
    return (
      <Dialog open={receiptDialogOpen} onClose={() => setReceiptDialogOpen(false)}>
        <DialogContent>
          <div id="receipt-preview" style={{ minWidth: "300px" }}>
            <Typography variant="h6" align="center">
              {user?.cabang?.namacabang || "Cabang Tidak Diketahui"}
            </Typography>
            <Typography align="center">
              Pemesan: {customerName || "Tidak Diketahui"}
            </Typography>
            <Typography variant="body2" align="center" gutterBottom>
              {formatDate(new Date())}
            </Typography>
            <Divider style={{ margin: "10px 0" }} />
            <List>
              {items.map((order) => (
                <ListItem key={order.id} style={{ padding: "4px 0" }}>
                  <ListItemText
                    primary={order.name}
                    secondary={`${order.quantity} x Rp ${order.price.toLocaleString()}`}
                  />
                  <Typography>
                    Rp {(order.price * order.quantity).toLocaleString()}
                  </Typography>
                </ListItem>
              ))}
            </List>
            <Divider style={{ margin: "10px 0" }} />
            {receiptData.paymentMethod === "Cash" && (
              <>
                <Typography variant="body1" align="right" gutterBottom>
                  Uang Customer: Rp {parseFloat(customerCash || 0).toLocaleString()}
                </Typography>
                <Typography variant="body1" align="right" gutterBottom>
                  Kembalian: Rp {change > 0 ? change.toLocaleString() : 0}
                </Typography>
              </>
            )}
            <Typography variant="h6" align="right" gutterBottom>
              Total: Rp {total.toLocaleString()}
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
      !selectedCategory || product.Kategori.namakategori === selectedCategory;
    const matchesSearch =
      !searchTerm ||
      product.namabarang.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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
  const formatRupiah = (value) =>{
    if(!value)return "";
    return value
    .toString()
   .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }
  
  return (
<div
  style={{
    display: 'flex',
    flexDirection: 'row',
    gap: '10px',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    position: 'relative',
  }}
>
{/* Bagian Produk */}
<div
  style={{
    flex: 2,
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    overflowY: 'auto',
    maxHeight: '100vh',
  }}
>

  {/* Filter Kategori */}
  <FormControl fullWidth>
    <InputLabel id="category-filter-label">Filter Kategori</InputLabel>
    <Select
      labelId="category-filter-label"
      value={selectedCategory}
      onChange={(e) => setSelectedCategory(e.target.value)}
      fullWidth
    >
      <MenuItem value="">Semua Kategori</MenuItem>
      {categories.map((category) => (
        <MenuItem key={category.uuid} value={category.namakategori}>
          {category.namakategori}
        </MenuItem>
      ))}
    </Select>
    <Box sx={{ position: 'relative'}}>
          {showSearch ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#f1f1f1',
               
                
              }}
            >
              <InputBase
                placeholder="Cari produk"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ flex: 1 }}
              />
              <IconButton onClick={() => setShowSearch(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
          ) : (
            <IconButton
              onClick={() => setShowSearch(true)}
              sx={{
                backgroundColor: '#f1f1f1',
              
               
              }}
            >
              <SearchIcon />
            </IconButton>
          )}
        </Box>
  </FormControl>

  {/* Grid Produk */}
  <Grid container spacing={2}>
    {filteredProducts.map((product) => (
      <Grid item xs={12} sm={6} md={4} lg={3} key={product.uuid}>
        <Card
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '100%', // Tinggi konsisten untuk semua card
            boxShadow: 3, // Tambahkan bayangan
          }}
        >
          <CardMedia
            component="img"
            image={`${getApiBaseUrl()}/uploads/${product.foto}`}
            alt={product.namabarang}
            height="140"
            sx={{ objectFit: 'cover' }} // Pastikan gambar rapi dan tidak terdistorsi
          />
          <CardContent sx={{ flexGrow: 1, overflow: "hidden" }}>
            <Typography
              variant="h6"
              sx={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {product.namabarang}
            </Typography>
            <Typography color="textSecondary">
            Rp {parseFloat(product.harga).toLocaleString("id-ID", { maximumFractionDigits: 0 })}
            </Typography>
            <Typography color="textSecondary">
              Kategori: {product.Kategori.namakategori}
            </Typography>
          </CardContent>
          <Box sx={{ padding: "8px" }}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={() => addToOrder(product)}
            >
              Tambah
            </Button>
          </Box>
        </Card>
      </Grid>
    ))}
  </Grid>
</div>

{/* Bagian Transaksi */}
<div className="transaction-container">
  {/* Judul Daftar Pesanan */}
  <Typography variant="h6" gutterBottom>
    Daftar Pesanan
  </Typography>

  {/* List Pesanan */}
  <List>
    {orders.map((order) => (
      <ListItem
        key={order.id}
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexDirection: { xs: "column", sm: "row" }, // Kolom di mobile
          textAlign: { xs: "center", sm: "left" }, // Tengah di mobile
          gap: 1, // Spasi antar elemen
          padding: "8px 0", // Padding vertikal
        }}
      >
        {/* Nama Barang dan Harga */}
        <Box
          sx={{
            flexGrow: 1, // Memanfaatkan ruang yang tersedia
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap", // Nama barang tidak multi-baris
            minWidth: "0", // Mencegah overflow
          }}
        >
          <Typography variant="body1" sx={{ fontWeight: "bold" }}>
            {order.name}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Rp {(order.price * order.quantity).toLocaleString()}
          </Typography>
        </Box>

        {/* Tombol Kuantitas */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0, // Tombol tidak mengecil
            gap: 1, // Spasi antar tombol
            marginTop: { xs: 1, sm: 0 }, // Spasi tambahan di mobile
          }}
        >
          <Button
            size="small"
            variant="outlined"
            onClick={() => decrementOrder(order.id)}
          >
            -
          </Button>
          <Typography>{order.quantity}</Typography>
          <Button
            size="small"
            variant="outlined"
            onClick={() => incrementOrder(order.id)}
          >
            +
          </Button>
        </Box>

        {/* Tombol Hapus */}
        <Button
          color="error"
          onClick={() => removeOrder(order.id)}
          sx={{
            marginTop: { xs: 1, sm: 0 }, // Spasi di mobile
            flexShrink: 0,
          }}
        >
          Hapus
        </Button>
      </ListItem>
    ))}
  </List>

  {/* Total dan Tombol Bayar */}
  <Typography
    variant="h6"
    className="total-amount"
    sx={{
      textAlign: "right",
      marginTop: 2,
    }}
  >
    Total: Rp{" "}
    {orders
      .reduce((sum, order) => sum + order.price * order.quantity, 0)
      .toLocaleString()}
  </Typography>
  <Button
    variant="contained"
    color="secondary"
    onClick={() => setPaymentDialogOpen(true)}
    fullWidth
    sx={{ marginTop: 2 }}
  >
    Bayar
  </Button>
</div>


{/* Dialog Pembayaran */}
<ReceiptDialog />
<Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)}>
  <DialogTitle>Pilih Metode Pembayaran</DialogTitle>
  <DialogContent>
    <FormControl fullWidth>
    {selectedPaymentMethod && (
   <TextField
     fullWidth
     margin="normal"
     label="Nama Pemesan"
     value={customerName}
     onChange={(e) => setCustomerName(e.target.value)}
   />
)}    
<InputLabel id="payment-method-label">Metode Pembayaran</InputLabel>
      <Select
        labelId="payment-method-label"
        value={selectedPaymentMethod}
        onChange={(e) => setSelectedPaymentMethod(e.target.value)}
        fullWidth
      >
        <MenuItem value="qris">QRIS</MenuItem>
        <MenuItem value="cash">Cash</MenuItem>
      </Select>
    </FormControl>
    {selectedPaymentMethod === "cash" && (
       <TextField
              fullWidth
              margin="normal"
              label="Uang Customer"
              type="number"
              value={formatRupiah(customerCash)}
              onChange={(e) => {
                const rawValue = e.target.value.replace(/\./g, "");
                if (!isNaN(rawValue)) {
                  setCustomerCash(rawValue);
                }
              }}
            />
      
    )}
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setPaymentDialogOpen(false)} color="secondary">
      Batal
    </Button>
    <Button onClick={handlePayment} color="primary">
      Lanjutkan
    </Button>
  </DialogActions>
</Dialog>


  {/* Responsif untuk Mobile */}
  <style>
    {`
      @media (max-width: 768px) {
        div {
          flex-direction: column;
        }
      }
    `}
  </style>
</div>
  );
};

export default ProductGrid;