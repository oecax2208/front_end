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
  Pagination
} from "@mui/material";
import axios from "axios";
import { useSelector } from "react-redux";
import { UploadProduk } from "./uploadProduk";

const getApiBaseUrl = () => {
  const protocol = window.location.protocol === "https:" ? "https" : "http";
  const baseUrl = process.env.REACT_APP_URL.replace(/^https?:\/\/+/, "");
  return `${protocol}://${baseUrl}`;
};

const fetcher = (url) => axios.get(url).then((res) => res.data.data);

export const Product = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { data: products, error: productError, mutate } = useSWR(
    `${getApiBaseUrl()}/barang`,
    fetcher,
    { withCredentials: true }
  );
  const { data: categories, error: categoryError } = useSWR(
    `${getApiBaseUrl()}/kategori`,
    fetcher,
    { withCredentials: true }
  );

  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    namabarang: "",
    harga: "",
    kategoriuuid: "",
    file: null
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [filters, setFilters] = useState({ kategori: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const itemsPerPage = 5;

  useEffect(() => {
    if (products) {
      const filtered = filters.kategori === ""
        ? products
        : products.filter((product) => {
            console.log('Filtering product:', {
              productKategoriUuid: product.kategoriuuid,
              selectedFilter: filters.kategori,
              match: product.kategoriuuid === filters.kategori
            });
            return product.kategoriuuid === filters.kategori;
          });
      
      console.log('Filtered results:', filtered.length);
      setFilteredProducts(filtered);
      setCurrentPage(1);
    }
  }, [filters.kategori, products]);

  
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  const handleFilterChange = (e) => {
    const { value } = e.target;
    console.log('Filter changed to:', value);
    setFilters({ kategori: value });
  };

  const handleOpen = () => setOpen(true);
  
  const handleClose = () => {
    setOpen(false);
    setFormData({ namabarang: "", harga: "", kategoriuuid: "", file: null });
    setIsEditing(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, file: e.target.files[0] }));
  };

  const handleSubmit = async () => {
    const formDataToSend = new FormData();
    formDataToSend.append("namabarang", formData.namabarang);
    formDataToSend.append("harga", formData.harga);
    formDataToSend.append("kategoriuuid", formData.kategoriuuid);
    if (formData.file) formDataToSend.append("file", formData.file);

    try {
      if (isEditing) {
        await axios.put(
          `${getApiBaseUrl()}/updatebarang/${editId}`,
          formDataToSend,
          { withCredentials: true }
        );
      } else {
        await axios.post(
          `${getApiBaseUrl()}/createbarang`,
          formDataToSend,
          { withCredentials: true }
        );
      }
      mutate();
      handleClose();
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  const handleEdit = (product) => {
    console.log('Editing product:', product);
    setFormData({
      namabarang: product.namabarang,
      harga: product.harga,
      kategoriuuid: product.kategoriuuid,
      file: null,
    });
    setEditId(product.uuid);
    setIsEditing(true);
    handleOpen();
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${getApiBaseUrl()}/deletebarang/${id}`, {
        withCredentials: true,
      });
      mutate();
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };
  if (productError) return <Typography color="error">Failed to load data: {productError.message}</Typography>;
  if (categoryError) return <Typography color="error">Failed to load categories: {categoryError.message}</Typography>;
  if (!products || !categories) return <Typography>Loading...</Typography>;

  console.log('Current products:', products);
  console.log('Current filter:', filters.kategori);
  console.log('Filtered products:', filteredProducts);

  return (
    <Box sx={{ padding: 2, overflowX: "auto" }}>
      <Typography variant="h6" gutterBottom>
        <Typography>
        {user?.role === 'superadmin' && (
               <UploadProduk />
            )}
      
        </Typography>
        Product List
      </Typography>
      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
      {user?.role === 'superadmin' && (
                <Button variant="contained" color="primary" onClick={handleOpen}>
                Add Product
              </Button>
            )}
     
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="filter-kategori-label">Filter Kategori</InputLabel>
          <Select
            labelId="filter-kategori-label"
            value={filters.kategori}
            onChange={handleFilterChange}
            label="Filter Kategori"
          >
            <MenuItem value="">Semua Kategori</MenuItem>
            {categories.map((category) => (
              <MenuItem key={category.uuid} value={category.uuid}>
                {category.namakategori}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Card>
        <Box sx={{ overflowX: "auto" }}>
          <Table sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow>
                <TableCell>No</TableCell>
                <TableCell>Nama Barang</TableCell>
                <TableCell>Harga</TableCell>
                <TableCell>Kategori</TableCell>
                <TableCell>Foto</TableCell>
                <TableCell>Tanggal Dibuat</TableCell>
                {user?.role === 'superadmin' && (
               <TableCell>Actions</TableCell>
            )}
               
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedProducts.map((product, index) => (
                <TableRow key={product.uuid}>
                  <TableCell>
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </TableCell>
                  <TableCell>{product.namabarang}</TableCell>
                  <TableCell>{product.harga}</TableCell>
                  <TableCell>{product.Kategori?.namakategori || "-"}</TableCell>
                  <TableCell>
                    <img
                      src={`${getApiBaseUrl()}/uploads/${product.foto}`}
                      alt={product.namabarang}
                      style={{ width: 50, height: 50, objectFit: "cover" }}
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(product.createdAt).toLocaleString()}
                  </TableCell>
                  {user?.role === 'superadmin' && (
             <TableCell>
             <Button
               size="small"
               color="primary"
               onClick={() => handleEdit(product)}
             >
               Edit
             </Button>
             <Button
               size="small"
               color="secondary"
               onClick={() => handleDelete(product.uuid)}
             >
               Delete
             </Button>
           </TableCell>
            )}
                  
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Card>

      {totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      )}

      <Modal open={open} onClose={handleClose}>
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
          <Typography variant="h6" gutterBottom>
            {isEditing ? "Edit Product" : "Add Product"}
          </Typography>
          <TextField
            label="Nama Barang"
            name="namabarang"
            value={formData.namabarang}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Harga"
            name="harga"
            value={formData.harga}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel id="kategori-label">Kategori</InputLabel>
            <Select
              labelId="kategori-label"
              name="kategoriuuid"
              value={formData.kategoriuuid}
              onChange={handleChange}
              label="Kategori"
            >
              {categories.map((category) => (
                <MenuItem key={category.uuid} value={category.uuid}>
                  {category.namakategori}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <input
            type="file"
            onChange={handleFileChange}
            style={{ margin: "16px 0" }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            fullWidth
          >
            {isEditing ? "Update" : "Create"}
          </Button>
        </Box>
      </Modal>
    </Box>
  );
};