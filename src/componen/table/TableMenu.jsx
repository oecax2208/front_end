import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Drawer,
  List,
  ListItem,
  IconButton,
  Badge,
  AppBar,
  Toolbar,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  useTheme,
  useMediaQuery,
  InputBase,
  FormControl,
  Select,
  MenuItem,
  Paper,
  Container,
  Chip,
  Avatar,
  alpha,
} from '@mui/material';
import {
  ShoppingCart as ShoppingCartIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  Restaurant as RestaurantIcon,
  Category as CategoryIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Note as NoteIcon,
} from '@mui/icons-material';
import Swal from 'sweetalert2';

const getApiBaseUrl = () => {
  const protocol = window.location.protocol === "https:" ? "https" : "http";
  const baseUrl = process.env.REACT_APP_URL.replace(/^https?:\/\//, "");
  return `${protocol}://${baseUrl}`;
};

const TableMenu = () => {
  const { cabangUuid, tableId } = useParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tableInfo, setTableInfo] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerNote, setCustomerNote] = useState('');
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Fetch menu items and table info
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get products for this table/branch
        const productsResponse = await axios.get(`${getApiBaseUrl()}/tableproduk/${cabangUuid}/${tableId}`);
        
        // Get categories
        const categoriesResponse = await axios.get(`${getApiBaseUrl()}/kategori`);
        
        setProducts(productsResponse.data.data.products);
        setTableInfo(productsResponse.data.data.table);
        setCategories(categoriesResponse.data.data || []);
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.response?.data?.message || "Failed to load menu data");
        setLoading(false);
      }
    };
    
    fetchData();
  }, [cabangUuid, tableId]);
  
  // Add item to cart
  const addToCart = (product) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.uuid === product.uuid);
      if (existingItem) {
        return prevItems.map(item => 
          item.uuid === product.uuid 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prevItems, {
        uuid: product.uuid,
        name: product.namabarang,
        price: parseFloat(product.harga),
        image: product.gambar,
        quantity: 1
      }];
    });
  };
  
  // Remove item from cart
  const removeFromCart = (uuid) => {
    setCartItems(prevItems => prevItems.filter(item => item.uuid !== uuid));
  };
  
  // Increment item quantity
  const incrementQuantity = (uuid) => {
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.uuid === uuid ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };
  
  // Decrement item quantity
  const decrementQuantity = (uuid) => {
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.uuid === uuid && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
    );
  };
  
  // Calculate total
  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };
  const handleCheckout = async (name, email, note) => {
    if (cartItems.length === 0) {
      Swal.fire({
        title: "Cart Empty",
        text: "Please add items to your cart before checkout",
        icon: "warning"
      });
      return;
    }
  
    if (!name || !name.trim()) { 
      Swal.fire({
        title: "Name Required",
        text: "Please enter your name to continue",
        icon: "warning"
      });
      return;
    }
  
    try {
      setCheckoutDialogOpen(false);
  
      const orderData = {
        pembayaran: "qris",
        tableId: parseInt(tableId),
        cabangUuid: cabangUuid,
        userName: name, 
        email: customerEmail || "guest@example.com",
        items: cartItems.map(item => ({
          baranguuid: item.uuid,
          jumlahbarang: item.quantity
        }))
      };
  
      console.log("Sending order data:", orderData);
  
      const response = await axios.post(`${getApiBaseUrl()}/createtransaksimejacabang`, orderData);
      const { redirect_url, token } = response.data.data.payment;
  
      window.snap.pay(token, {
        onSuccess: function(result) {
          handlePaymentSuccess(response.data.data.transaksi.order_id, result);
        },
        onPending: function(result) {
          handlePaymentPending(response.data.data.transaksi.order_id, result);
        },
        onError: function(result) {
          handlePaymentError(result);
        },
        onClose: function() {
          handlePaymentClose(response.data.data.transaksi.order_id);
        }
      });
    } catch (err) {
      console.error("Checkout error:", err);
      Swal.fire({
        title: "Checkout Failed",
        text: err.response?.data?.message || "Unable to process your order. Please try again.",
        icon: "error"
      });
    }
  };
  
  
  // Handle payment callbacks
  const handlePaymentSuccess = (orderId, result) => {
    Swal.fire({
      title: "Payment Successful!",
      text: "Your order has been placed. Your order ID is " + orderId,
      icon: "success"
    });
    setCartItems([]);
    setCustomerName('');
    setCustomerEmail('');
    setCustomerNote('');
  };
  
  const handlePaymentPending = (orderId, result) => {
    Swal.fire({
      title: "Payment Pending",
      text: "Please complete your payment. Your order ID is " + orderId,
      icon: "info"
    });
  };
  
  const handlePaymentError = (result) => {
    Swal.fire({
      title: "Payment Failed",
      text: "Unable to process payment. Please try again.",
      icon: "error"
    });
  };
  
  const handlePaymentClose = (orderId) => {
    Swal.fire({
      title: "Payment Cancelled",
      text: "You can continue shopping or try again later.",
      icon: "warning"
    });
  };
  
  const filteredProducts = products.filter(product => {
    const matchesCategory = !selectedCategory || 
      product.namakategori.toLowerCase() === selectedCategory.toLowerCase();
    
    const productName = product.namabarang || product.Barang?.namabarang || '';
    const matchesSearch = !searchTerm || 
      productName.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });
  // Loading state
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(to right, #f5f7fa, #c3cfe2)'
      }}>
        <CircularProgress size={60} thickness={4} sx={{ color: theme.palette.primary.main }} />
        <Typography variant="h6" sx={{ mt: 2, fontWeight: 500 }}>
          Loading Menu...
        </Typography>
      </Box>
    );
  }
  
  // Error state
  if (error) {
    return (
      <Box sx={{ 
        p: 3, 
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(to right, #f5f7fa, #c3cfe2)'
      }}>
        <Alert 
          severity="error" 
          sx={{ 
            maxWidth: 500,
            boxShadow: 3,
            borderRadius: 2
          }}
        >
          {error}
        </Alert>
      </Box>
    );
  }
  
  // Cart component
  const CartDrawer = () => (
    <Drawer
      anchor="right"
      open={cartOpen}
      onClose={() => setCartOpen(false)}
      sx={{
        '& .MuiDrawer-paper': {
          width: '100%',
          maxWidth: 420,
          boxSizing: 'border-box',
          padding: 0,
          backgroundColor: '#f9f9f9',
        },
      }}
    >
      <Box sx={{ 
        p: 2, 
        bgcolor: theme.palette.primary.main, 
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography variant="h6" component="div">
          Your Cart
        </Typography>
        <IconButton onClick={() => setCartOpen(false)} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </Box>
      
      <Box sx={{ p: 2, flexGrow: 1, overflowY: 'auto' }}>
        {cartItems.length === 0 ? (
          <Box sx={{ 
            my: 8, 
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '50vh'
          }}>
            <ShoppingCartIcon sx={{ fontSize: 80, color: alpha(theme.palette.text.primary, 0.2), mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Your cart is empty
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Add some delicious items to get started!
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => setCartOpen(false)}
              sx={{ mt: 4 }}
            >
              Browse Menu
            </Button>
          </Box>
        ) : (
          <>
            <List sx={{ pb: 2 }}>
              {cartItems.map(item => (
                <Paper
                  key={item.uuid}
                  elevation={1}
                  sx={{ 
                    mb: 2,
                    overflow: 'hidden',
                    borderRadius: 2
                  }}
                >
                  <ListItem 
                    sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'stretch',
                      p: 0
                    }}
                  >
                    <Box sx={{ 
                      display: 'flex',
                      p: 2,
                      width: '100%'
                    }}>
                      <Box sx={{ 
                        width: 70, 
                        height: 70, 
                        borderRadius: 1,
                        overflow: 'hidden',
                        mr: 2,
                        bgcolor: 'grey.100'
                      }}>
                        {item.image && (
                          <img 
                            src={`${getApiBaseUrl()}/uploads/${item.image}`}
                            alt={item.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              e.target.src = "https://via.placeholder.com/70?text=Food";
                            }}
                          />
                        )}
                      </Box>
                      
                      <Box sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="subtitle1" fontWeight="medium">
                            {item.name}
                          </Typography>
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => removeFromCart(item.uuid)}
                            sx={{ padding: '2px' }}
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Rp {item.price.toLocaleString()}
                        </Typography>
                        
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center'
                        }}>
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            border: '1px solid', 
                            borderColor: 'grey.300',
                            borderRadius: 1,
                            overflow: 'hidden'
                          }}>
                            <IconButton 
                              size="small"
                              onClick={() => decrementQuantity(item.uuid)}
                              sx={{ p: 0.5 }}
                            >
                              <RemoveIcon fontSize="small" />
                            </IconButton>
                            <Typography sx={{ mx: 2, userSelect: 'none' }}>
                              {item.quantity}
                            </Typography>
                            <IconButton 
                              size="small"
                              onClick={() => incrementQuantity(item.uuid)}
                              sx={{ p: 0.5 }}
                            >
                              <AddIcon fontSize="small" />
                            </IconButton>
                          </Box>
                          <Box sx={{ minWidth: '80px', textAlign: 'left' , p: 3}}>
                          <Typography variant="subtitle2" fontWeight="bold" sx={{ whiteSpace: 'nowrap' }}>
                            Rp {(item.price * item.quantity).toLocaleString()}
                          </Typography>
                        </Box>
                        </Box>
                      </Box>
                    </Box>
                  </ListItem>
                </Paper>
              ))}
            </List>
            
            <Box sx={{ 
              position: 'sticky',
              bottom: 0,
              bgcolor: '#f9f9f9',
              borderTop: '1px solid',
              borderColor: 'divider',
              p: 2,
              pt: 3
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle1">Subtotal</Typography>
                <Typography variant="subtitle1" fontWeight="bold">
                  Rp {calculateTotal().toLocaleString()}
                </Typography>
              </Box>
              
              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={() => {
                  setCartOpen(false);
                  setCheckoutDialogOpen(true);
                }}
                sx={{ 
                  py: 1.5,
                  borderRadius: 2,
                  boxShadow: 2,
                  textTransform: 'none',
                  fontSize: '1rem'
                }}
                startIcon={<ShoppingCartIcon />}
              >
                Checkout
              </Button>
            </Box>
          </>
        )}
      </Box>
    </Drawer>
  );

  const CheckoutDialog = () => {
    // Gunakan state yang sudah ada dari parent component
    const [localCustomerName, setLocalCustomerName] = useState(customerName);
    const [localCustomerEmail, setLocalCustomerEmail] = useState(customerEmail);
    const [localCustomerNote, setLocalCustomerNote] = useState(customerNote);
    
    // Update local state ketika dialog dibuka
    useEffect(() => {
      if (checkoutDialogOpen) {
        setLocalCustomerName(customerName);
        setLocalCustomerEmail(customerEmail);
        setLocalCustomerNote(customerNote);
      }
    }, [checkoutDialogOpen]);
  
    const handleSubmit = () => {
      if (!localCustomerName.trim()) {
        Swal.fire({
          title: "Name Required",
          text: "Please enter your name to continue",
          icon: "warning"
        });
        return;
      }
      setCustomerName(localCustomerName);
      setCustomerEmail(localCustomerEmail);
      setCustomerNote(localCustomerNote);
      setCheckoutDialogOpen(false);
      setTimeout(() => {
        handleCheckout(localCustomerName, localCustomerEmail, localCustomerNote);
      }, 100); 
    };
    
    
    
    return (
      <Dialog 
        open={checkoutDialogOpen} 
        onClose={() => setCheckoutDialogOpen(false)} 
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 2,
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: theme.palette.primary.main, 
          color: 'white',
          pb: 2
        }}>
          Complete Your Order
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3, pb: 1 }}>
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', mb: 2 }}>
              <PersonIcon sx={{ color: 'action.active', mr: 1, mb: 0.5 }} />
              <TextField
                fullWidth
                label="Your Name"
                variant="standard"
                value={localCustomerName}
                onChange={(e) => {
                  const newValue = e.target.value.slice(0, 8); 
                  setLocalCustomerName(newValue);
                }}
                required
                InputProps={{
                  sx: { fontSize: '1.1rem' }
                }}
              />
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'flex-end', mb: 2 }}>
              <EmailIcon sx={{ color: 'action.active', mr: 1, mb: 0.5 }} />
              <TextField
                fullWidth
                label="Your Email"
                variant="standard"
                type="email"
                value={localCustomerEmail}
                onChange={(e) => setLocalCustomerEmail(e.target.value)}
                InputProps={{
                  sx: { fontSize: '1.1rem' }
                }}
              />
            </Box>
            
            {/* <Box sx={{ display: 'flex', alignItems: 'flex-end', mb: 2 }}>
              <NoteIcon sx={{ color: 'action.active', mr: 1, mb: 0.5 }} />
              <TextField
                fullWidth
                label="Special Instructions (Optional)"
                variant="standard"
                multiline
                rows={2}
                value={localCustomerNote}
                onChange={(e) => setLocalCustomerNote(e.target.value)}
              />
            </Box> */}
          </Box>
    
          {/* Order Summary */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>
              Order Summary
            </Typography>
            
            <List disablePadding sx={{ mb: 2 }}>
              {cartItems.map(item => (
                <ListItem key={item.uuid} disablePadding sx={{ py: 0.8 }}>
                  <Typography variant="body2" sx={{ flex: 1 }}>
                    {item.quantity} × {item.name}
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    Rp {(item.price * item.quantity).toLocaleString()}
                  </Typography>
                </ListItem>
              ))}
            </List>
            
            <Divider sx={{ my: 1.5 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                Total
              </Typography>
              <Typography variant="subtitle1" fontWeight="bold" color="primary">
                Rp {calculateTotal().toLocaleString()}
              </Typography>
            </Box>
          </Paper>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={() => setCheckoutDialogOpen(false)}
            sx={{ 
              color: theme.palette.text.secondary,
              textTransform: 'none'
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            variant="contained" 
            sx={{
              px: 4,
              py: 1,
              borderRadius: 1.5,
              textTransform: 'none',
              fontWeight: 'bold'
            }}
          >
            Pay Now
          </Button>
        </DialogActions>
      </Dialog>
    );
  };
  return (
    <Box sx={{ 
      bgcolor: '#f5f7fa',
      minHeight: '100vh',
      pb: isMobile ? 10 : 8 
    }}>
      {/* Header */}
      <AppBar 
        position="sticky" 
        elevation={0}
        sx={{
          bgcolor: 'white',
          color: 'text.primary',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <RestaurantIcon sx={{ mr: 1.5, color: theme.palette.primary.main }} />
            <Box>
            <Typography variant="h6" component="div" fontWeight="bold">
              cabang : 
              {tableInfo?.Cabang ? tableInfo.Cabang.namacabang : 'Table Menu'}
            </Typography>
            {/* <Typography variant="body2" color="text.secondary">
              {tableInfo?.Cabang?.namacabang || ''}
            </Typography> */}

            </Box>
          </Box>
          
          <Box sx={{ flexGrow: 1 }} />
          
          <Badge 
            badgeContent={cartItems.length} 
            color="error"
            overlap="circular"
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '0.7rem',
                height: 18,
                minWidth: 18,
              }
            }}
          >
            <IconButton 
              onClick={() => setCartOpen(true)}
              sx={{ 
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.2),
                }
              }}
            >
              <ShoppingCartIcon color="primary" />
            </IconButton>
          </Badge>
        </Toolbar>
      </AppBar>
  
      {/* Search and Filter Bar */}
      <Container maxWidth="lg">
        <Box
          sx={{
            py: 2,
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: 'center',
            gap: 2,
            mb: 1
          }}
        >
          {/* Search Bar */}
          <Paper
            elevation={0}
            sx={{
              display: 'flex',
              alignItems: 'center',
              px: 2,
              py: 1,
              flex: isMobile ? 'auto' : 2,
              width: isMobile ? '100%' : 'auto',
              borderRadius: 2,
              border: '1px solid',
              borderColor: alpha(theme.palette.primary.main, 0.2)
            }}
          >
            <SearchIcon sx={{ color: 'action.active', mr: 1 }} />
            <InputBase
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ flex: 1 }}
              fullWidth
            />
            {searchTerm && (
              <IconButton size="small" onClick={() => setSearchTerm('')}>
                <CloseIcon fontSize="small" />
              </IconButton>
            )}
          </Paper>
    
          {/* Category Filter */}
          <FormControl
            variant="outlined"
            size="small"
            sx={{
              flex: isMobile ? 'auto' : 1,
              width: isMobile ? '100%' : 'auto',
            }}
          >
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              displayEmpty
              sx={{
                borderRadius: 2,
                bgcolor: 'white',
                '& .MuiSelect-select': { display: 'flex', alignItems: 'center' }
              }}
              startAdornment={<CategoryIcon sx={{ mr: 1, color: 'action.active' }} />}
            >
              <MenuItem value="">All Categories</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category.uuid} value={category.namakategori}>
                  {category.namakategori}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Container>

      {/* Categories Chips - horizontal scrollable */}
      <Container maxWidth="lg" sx={{ mb: 3 }}>
        <Box
          sx={{
            display: 'flex',
            overflowX: 'auto',
            pb: 1,
            '&::-webkit-scrollbar': {
              height: '4px',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: alpha(theme.palette.common.black, 0.05),
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: alpha(theme.palette.primary.main, 0.2),
              borderRadius: '2px',
            },
          }}
        >
          <Chip
            label="All"
            clickable
            color={selectedCategory === "" ? "primary" : "default"}
            onClick={() => setSelectedCategory("")}
            sx={{ mx: 0.5, my: 0.5 }}
          />
          {categories.map((category) => (
            <Chip
              key={category.uuid}
              label={category.namakategori}
              clickable
              color={selectedCategory === category.namakategori ? "primary" : "default"}
              onClick={() => setSelectedCategory(category.namakategori)}
              sx={{ mx: 0.5, my: 0.5 }}
            />
          ))}
        </Box>
      </Container>
      
      {/* Menu Grid */}
      <Container maxWidth="lg">
        {filteredProducts.length === 0 ? (
          <Paper 
            elevation={0}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              py: 6,
              px: 2,
              borderRadius: 2,
              bgcolor: 'white',
              textAlign: 'center'
            }}
          >
            <SearchIcon sx={{ fontSize: 60, color: alpha(theme.palette.text.primary, 0.2), mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No items found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Try changing your search or selecting a different category
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={2} sx={{ mb: 4 }}>
            {filteredProducts.map((product) => (
               <Grid item xs={6} sm={6} md={3} lg={3} key={product.uuid}>
           <Card
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        height: '100%',
                        boxShadow: 1,
                        borderRadius: 2,
                        overflow: 'hidden'
                      }}
                  >
                  <Box sx={{ position: 'relative' }}>
                    <CardMedia
                      component="img"
                      height={180}
                      image={`${getApiBaseUrl()}/uploads/${product?.Barang?.gambar || product?.gambar}`}
                      alt={product.namabarang}
                      sx={{ objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/300x180?text=Food+Item";
                      }}
                    />
                    {product.stok <= 0 && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        }}
                      >
                        <Typography
                          variant="h6"
                          sx={{
                            color: 'white',
                            textTransform: 'uppercase',
                            fontWeight: 'bold',
                            textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
                            transform: 'rotate(-5deg)',
                          }}
                        >
                          Out of Stock
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  <CardContent sx={{ flexGrow: 1, pt: 2 }}>
                    <Typography variant="subtitle1" component="div" fontWeight="bold" gutterBottom>
                      {product.namabarang}
                    </Typography>

                  

                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-end',
                        mt: 'auto',
                      }}
                    >
                      <Typography variant="h6" fontWeight="bold" color="primary.main">
                        Rp {parseFloat(product.harga).toLocaleString()}
                      </Typography>
                      <Chip 
                        size="small" 
                        label={`Stock: ${product.stok}`}
                        color={product.stok > 5 ? "success" : product.stok > 0 ? "warning" : "error"}
                        sx={{ fontSize: '0.7rem' }}
                      />
                    </Box>
                  </CardContent>

                  <Box sx={{ p: 2, pt: 0 }}>
                  <IconButton
                      size="small"
                      onClick={() => addToCart(product)}
                      disabled={product.stok <= 0}
                      sx={{
                        backgroundColor: theme.palette.primary.main,
                        color: 'white',
                        '&:hover': {
                          backgroundColor: theme.palette.primary.dark,
                        },
                        width: 24,
                        height: 24,
                        '&.Mui-disabled': {
                          backgroundColor: '#e0e0e0',
                          color: '#9e9e9e'
                        }
                      }}
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      {/* Bottom Navigation Bar - for mobile */}
      {isMobile && cartItems.length > 0 && (
        <AppBar 
          position="fixed" 
          color="default" 
          sx={{ 
            top: 'auto', 
            bottom: 0,
            bgcolor: 'white',
            boxShadow: '0px -2px 10px rgba(0,0,0,0.1)'
          }}
        >
          <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                {cartItems.reduce((sum, item) => sum + item.quantity, 0)} Items
              </Typography>
              <Typography variant="subtitle1" fontWeight="bold" color="primary">
                Rp {calculateTotal().toLocaleString()}
              </Typography>
            </Box>
            
            <Button
              variant="contained"
              onClick={() => setCartOpen(true)}
              startIcon={<ShoppingCartIcon />}
              sx={{ 
                borderRadius: 2,
                px: 3,
                textTransform: 'none',
                fontWeight: 'bold',
                boxShadow: 2
              }}
            >
              View Cart
            </Button>
          </Toolbar>
        </AppBar>
      )}

      {/* Cart Drawer */}
      <CartDrawer />

      {/* Checkout Dialog */}
      <CheckoutDialog />

      {/* Midtrans Script */}
      <Script
       // src="https://app.sandbox.midtrans.com/snap/snap.js"
       src="https://app.midtrans.com/snap/snap.js"
        data-client-key={process.env.REACT_APP_MIDTRANS_CLIENT_KEY}
      />
    </Box>
  );
};

const Script = ({ src, "data-client-key": clientKey }) => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = src;
    script.setAttribute('data-client-key', clientKey);
    script.async = true;
    
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, [src, clientKey]);
  
  return null;
};

export default TableMenu;