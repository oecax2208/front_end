import React, { useState, useEffect } from "react";
import useSWR from "swr";
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
  Modal,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Pagination,
  IconButton,
  Chip,
  TableContainer,
  Paper,
  Grid,
  Divider,
  CircularProgress,
  Alert,
  Tooltip,
  Snackbar,
  Autocomplete
} from "@mui/material";
import { styled, alpha } from '@mui/material/styles';
import axios from "axios";
import { useSelector } from "react-redux";
import { UploadProduk } from "./uploadProduk";
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import RefreshIcon from '@mui/icons-material/Refresh';
import InventoryIcon from '@mui/icons-material/Inventory';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FilterListIcon from '@mui/icons-material/FilterList';
import jsPDF from "jspdf";
import "jspdf-autotable";

const getApiBaseUrl = () => {
  const protocol = window.location.protocol === "https:" ? "https" : "http";
  const baseUrl = process.env.REACT_APP_URL.replace(/^https?:\/\/+/, "");
  return `${protocol}://${baseUrl}`;
};

const fetcher = (url) => axios.get(url).then((res) => res.data.data);

const StyledSearchBox = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    width: 'auto',
  },
  border: `1px solid ${theme.palette.divider}`,
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: theme.palette.text.secondary,
}));

const StyledInputBase = styled(TextField)(({ theme }) => ({
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    width: '100%',
  },
  width: '100%',
}));

const StyledModal = styled(Modal)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const ModalContent = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[5],
  padding: theme.spacing(4),
  width: '500px',
  maxWidth: '90vw',
  maxHeight: '90vh',
  overflow: 'auto',
}));

export const Wearhouse = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [openFilterModal, setOpenFilterModal] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [formData, setFormData] = useState({
    baranguuid: "",
    stok_gudang: ""
  });
  const [filterOptions, setFilterOptions] = useState({
    minStock: "",
    maxStock: "",
    category: "",
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success"
  });

  const { 
    data: warehouseStock, 
    error: warehouseError, 
    mutate, 
    isValidating 
  } = useSWR(
    `${getApiBaseUrl()}/getdatawearhouse`,
    fetcher,
    { withCredentials: true }
  );

  const { 
    data: products, 
    error: productsError 
  } = useSWR(
    `${getApiBaseUrl()}/barang`,
    fetcher,
    { withCredentials: true }
  );

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(1);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilterOptions(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearFilters = () => {
    setFilterOptions({
      minStock: "",
      maxStock: "",
      category: "",
    });
    handleCloseFilterModal();
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Add title and date
    doc.setFontSize(16);
    doc.text("Warehouse Stock Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 25);
    
    // Add filter information if filters are applied
    let yPos = 30;
    if (Object.values(filterOptions).some(value => value !== "")) {
      doc.text("Applied Filters:", 14, yPos);
      yPos += 7;
      if (filterOptions.minStock) {
        doc.text(`Minimum Stock: ${filterOptions.minStock}`, 20, yPos);
        yPos += 5;
      }
      if (filterOptions.maxStock) {
        doc.text(`Maximum Stock: ${filterOptions.maxStock}`, 20, yPos);
        yPos += 5;
      }
      if (filterOptions.category) {
        doc.text(`Category: ${filterOptions.category}`, 20, yPos);
        yPos += 5;
      }
      yPos += 5;
    }

    const tableColumn = ["No", "Product Name", "Category", "Stock Quantity", "Last Updated"];
    const tableRows = filteredStock.map((item, index) => [
      index + 1,
      item.Barang?.namabarang || getProductNameByUuid(item.baranguuid),
      item.Barang?.Kategori?.namakategori || "-",
      item.stok_gudang,
      new Date(item.updatedAt).toLocaleString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: yPos,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [66, 66, 66],
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });

    doc.save("warehouse-stock-report.pdf");
  };

  const filteredStock = warehouseStock ? warehouseStock.filter(item => {
    const productName = item.Barang?.namabarang?.toLowerCase() || '';
    const matchesSearch = productName.includes(searchTerm.toLowerCase());
    const matchesMinStock = filterOptions.minStock === "" || Number(item.stok_gudang) >= Number(filterOptions.minStock);
    const matchesMaxStock = filterOptions.maxStock === "" || Number(item.stok_gudang) <= Number(filterOptions.maxStock);
    const matchesCategory = filterOptions.category === "" || item.Barang?.Kategori?.namakategori === filterOptions.category;
    
    return matchesSearch && matchesMinStock && matchesMaxStock && matchesCategory;
  }) : [];

  const itemsPerPage = 10;
  const paginatedStock = filteredStock.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const handleOpenModal = (item = null) => {
    if (item) {
      setCurrentItem(item);
      setFormData({
        baranguuid: item.baranguuid,
        stok_gudang: item.stok_gudang
      });
    } else {
      setCurrentItem(null);
      setFormData({
        baranguuid: "",
        stok_gudang: ""
      });
    }
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleOpenFilterModal = () => setOpenFilterModal(true);
  const handleCloseFilterModal = () => setOpenFilterModal(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleProductChange = (event, newValue) => {
    if (newValue) {
      setFormData({ ...formData, baranguuid: newValue.uuid });
    } else {
      setFormData({ ...formData, baranguuid: "" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentItem) {
        await axios.put(
          `${getApiBaseUrl()}/updatewearhouse/${currentItem.uuid}`,
          formData,
          { withCredentials: true }
        );
        setSnackbar({
          open: true,
          message: "Stock updated successfully!",
          severity: "success"
        });
      } else {
        await axios.post(
          `${getApiBaseUrl()}/createwearhouse`,
          formData,
          { withCredentials: true }
        );
        setSnackbar({
          open: true,
          message: "Stock added successfully!",
          severity: "success"
        });
      }
      mutate();
      handleCloseModal();
    } catch (error) {
      console.error("Error submitting form:", error);
      setSnackbar({
        open: true,
        message: `Error: ${error.response?.data?.message || "Something went wrong"}`,
        severity: "error"
      });
    }
  };

  const handleDelete = async (uuid) => {
    if (window.confirm("Are you sure you want to delete this stock entry?")) {
      try {
        await axios.delete(
          `${getApiBaseUrl()}/deletewearhouse/${uuid}`,
          { withCredentials: true }
        );
        mutate();
        setSnackbar({
          open: true,
          message: "Stock entry deleted successfully!",
          severity: "success"
        });
      } catch (error) {
        console.error("Error deleting stock:", error);
        setSnackbar({
          open: true,
          message: `Error: ${error.response?.data?.message || "Something went wrong"}`,
          severity: "error"
        });
      }
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getProductNameByUuid = (uuid) => {
    if (!products) return "Loading...";
    const product = products.find(p => p.uuid === uuid);
    return product ? product.namabarang : "Unknown Product";
  };

  if (warehouseError) {
    return (
      <Box p={4} textAlign="center">
        <Alert severity="error">
          Error loading warehouse stock data. Please refresh and try again.
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Card sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Grid item xs={12} md={8}>
            <Box display="flex" alignItems="center">
              <InventoryIcon fontSize="large" color="primary" sx={{ mr: 2 }} />
              <Typography variant="h6">
                Warehouse Stock Management
              </Typography>
            </Box>
            <Typography variant="subtitle1" color="text.secondary" mt={1}>
              Manage your product inventory levels across warehouses
            </Typography>
          </Grid>
          <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleOpenModal()}
              sx={{ borderRadius: 2, py: 1.2, px: 3, fontWeight: 'bold' }}
            >
              Add Stock Entry
            </Button>
          </Grid>
        </Grid>

        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <StyledSearchBox>
              <SearchIconWrapper>
                <SearchIcon />
              </SearchIconWrapper>
              <StyledInputBase
                placeholder="Search by product name..."
                fullWidth
                value={searchTerm}
                onChange={handleSearch}
                variant="standard"
                InputProps={{ disableUnderline: true }}
              />
            </StyledSearchBox>
          </Grid>
          <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={handleOpenFilterModal}
              sx={{ borderRadius: 2 }}
            >
              Filters
              {Object.values(filterOptions).some(value => value !== "") && (
                <Chip
                  size="small"
                  label={Object.values(filterOptions).filter(value => value !== "").length}
                  color="primary"
                  sx={{ ml: 1 }}
                />
              )}
            </Button>
            <Button
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={exportToPDF}
              sx={{ borderRadius: 2 }}
            >
              Export PDF
            </Button>
            <Tooltip title="Refresh Data">
              <IconButton onClick={() => mutate()} color="primary">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>

        <TableContainer component={Paper} sx={{ boxShadow: 2, borderRadius: 2 }}>
          <Table sx={{ minWidth: 650 }} aria-label="warehouse stock table">
            <TableHead sx={{ backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1) }}>
              <TableRow>
              <TableCell width="5%" sx={{ fontWeight: 'bold' }}>No</TableCell>
                <TableCell width="40%" sx={{ fontWeight: 'bold' }}>Product Name</TableCell>
                <TableCell width="15%" sx={{ fontWeight: 'bold' }}>Stock Quantity</TableCell>
                <TableCell width="20%" sx={{ fontWeight: 'bold' }}>Last Updated</TableCell>
                <TableCell width="20%" align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isValidating && !warehouseStock ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={40} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                      Loading stock data...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : paginatedStock.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1">
                      No stock data found {searchTerm && `matching "${searchTerm}"`}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedStock.map((item, index) => (
                  <TableRow 
                    key={item.uuid}
                    sx={{ '&:hover': { backgroundColor: alpha('#000', 0.03) } }}
                  >
                    <TableCell>{(page - 1) * itemsPerPage + index + 1}</TableCell>
                    <TableCell>
                      <Typography fontWeight="medium">
                        {item.Barang?.namabarang || getProductNameByUuid(item.baranguuid)}
                      </Typography>
                      {item.Barang?.Kategori?.namakategori && (
                        <Chip 
                          label={item.Barang.Kategori.namakategori} 
                          size="small" 
                          sx={{ mt: 0.5, borderRadius: 1 }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography
                        fontWeight="medium"
                        color={parseInt(item.stok_gudang) < 5 ? "error.main" : "inherit"}
                      >
                        {item.stok_gudang}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {new Date(item.updatedAt).toLocaleString('id-ID', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Edit Stock">
                        <IconButton 
                          size="small"
                          color="primary"
                          onClick={() => handleOpenModal(item)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Entry">
                        <IconButton 
                          size="small"
                          color="error"
                          onClick={() => handleDelete(item.uuid)}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {filteredStock.length > itemsPerPage && (
          <Box display="flex" justifyContent="center" mt={3}>
            <Pagination
              count={Math.ceil(filteredStock.length / itemsPerPage)}
              page={page}
              onChange={handleChangePage}
              color="primary"
              shape="rounded"
            />
          </Box>
        )}
      </Card>

      {/* Add/Edit Modal */}
      <StyledModal
        open={openModal}
        onClose={handleCloseModal}
        aria-labelledby="stock-modal-title"
      >
        <ModalContent>
          <Typography id="stock-modal-title" variant="h5" fontWeight="bold" mb={3}>
            {currentItem ? 'Edit Stock Entry' : 'Add New Stock Entry'}
          </Typography>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Autocomplete
                  id="product-select"
                  options={products || []}
                  getOptionLabel={(option) => option.namabarang}
                  // value={(products || []).find(product => product.uuid === formData.baranguuid) || null}
                  value={Array.isArray(products) ? products.find(product => product.uuid === formData.baranguuid) || null : null}
                  onChange={handleProductChange}
                  disabled={Boolean(currentItem)}
                  loading={!products}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Product"
                      required
                      variant="outlined"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <React.Fragment>
                            {!products ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </React.Fragment>
                        ),
                      }}
                    />
                  )}
                />
                {currentItem && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    Product cannot be changed once stock is created. Create a new entry if needed.
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Stock Quantity"
                  name="stok_gudang"
                  type="number"
                  value={formData.stok_gudang}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  variant="outlined"
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid>
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                <Button 
                  variant="outlined" 
                  onClick={handleCloseModal}
                  sx={{ borderRadius: 2, px: 3 }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary"
                  disabled={!formData.baranguuid || !formData.stok_gudang}
                  sx={{ borderRadius: 2, px: 3 }}
                >
                  {currentItem ? 'Update Stock' : 'Add Stock'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </ModalContent>
      </StyledModal>

      {/* Filter Modal */}
      <StyledModal
        open={openFilterModal}
        onClose={handleCloseFilterModal}
        aria-labelledby="filter-modal-title"
      >
        <ModalContent>
          <Typography id="filter-modal-title" variant="h6" component="h2" mb={3}>
            Filter Stock Data
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Minimum Stock"
                type="number"
                name="minStock"
                value={filterOptions.minStock}
                onChange={handleFilterChange}
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Maximum Stock"
                type="number"
                name="maxStock"
                value={filterOptions.maxStock}
                onChange={handleFilterChange}
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  name="category"
                  value={filterOptions.category}
                  onChange={handleFilterChange}
                  label="Category"
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {Array.from(new Set(warehouseStock?.map(item => item.Barang?.Kategori?.namakategori)
                    .filter(Boolean)))
                    .map(category => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))
                  }
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
              <Button onClick={clearFilters} variant="outlined">
                Clear Filters
              </Button>
              <Button onClick={handleCloseFilterModal} variant="contained">
                Apply Filters
              </Button>
            </Grid>
          </Grid>
        </ModalContent>
      </StyledModal>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};