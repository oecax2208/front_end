import React, { useState } from "react";
import useSWR, { mutate } from "swr";
import {
  Box,
  Button,
  Card,
  Modal,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  MenuItem,
  TableContainer,
  Paper,
} from "@mui/material";
import { useSelector } from "react-redux";
import axios from "axios";
const getApiBaseUrl = () => {
  const protocol = window.location.protocol === "https:" ? "https" : "http";
  const baseUrl = process.env.REACT_APP_URL.replace(/^https?:\/\/+/, "");
  return `${protocol}://${baseUrl}`;
};

const fetcher = (url) => axios.get(url,{withCredentials: true}).then((res) => res.data.data);

export const Category = () => {
    const {data : categorys, error: CategoryError, mutate} = useSWR(`${getApiBaseUrl()}/kategori`,fetcher, {withCredentials: true});
    const { user, isAuthenticated } = useSelector((state) => state.auth);
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({namakategori: ""});
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const handleOpen = () => setOpen(true);
    const handleClose = () => {
    setOpen(false);
    setFormData({ namakategori: ""});
    setIsEditing(false);
  };
    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData((prev) => ({...prev, [name]: value}))
    }
    const handleSubmit = async () => {
        const formDataToSend = new FormData();
        formDataToSend.append("namakategori", formData.namakategori)
        try {
            if(isEditing)
            {
                await axios.put(`${getApiBaseUrl()}/updatekategori/${editId}`, formData, {withCredentials: true})
            }else{
              await axios.post(`${getApiBaseUrl()}/createkategori`, { namakategori: formData.namakategori }, { withCredentials: true });
            }
            mutate();
            handleClose();
        } catch (error) {
            console.error("error submitting form", error)
        }
    }
    const handleEdit = (kategori) => {
        setFormData({
            namakategori: kategori.namakategori
        })
        setEditId(kategori.uuid)
        setIsEditing(true);
        handleOpen();
    }
    const handleDelete = async (id) => {
        try {
            await axios.delete(`${getApiBaseUrl()}/deletekategori/${id}`,{withCredentials: true})
            mutate()
        } catch (error) {
            console.error("error deleting data", error)
        }
    }
    if(CategoryError){
        return <Typography color="error">Failed to load Category{CategoryError.message}</Typography>
    }
    if(!categorys){
    return <Typography>Loading...</Typography>;
  }
  return (
    <Box sx={{ padding: 2 ,overflowX: 'auto'}}>
      <Typography variant="h6" gutterBottom>
        Kategori List
      </Typography>
      {user?.role === 'superadmin' && (
      <Button variant="contained" color="primary" onClick={handleOpen}>
        Add New
      </Button>
      )}

      <Card>
  <Box sx={{ overflowX: 'auto' }}> {/* Wrapper untuk scroll horizontal */}
    <Table sx={{ minWidth: 800 }}> {/* Atur minWidth agar tabel tidak terlalu kecil */}
      <TableHead>
        <TableRow>
          <TableCell>No</TableCell>
          <TableCell>Nama Kategori</TableCell>
           {user?.role === 'superadmin' && (
                         <TableCell>Actions</TableCell>
                      )}
        </TableRow>
      </TableHead>
      <TableBody>
        {categorys.map((kategori, index) => (
          <TableRow key={kategori.uuid}>
            <TableCell>{index + 1}</TableCell>
            <TableCell>{kategori.namakategori}</TableCell>
            {user?.role === 'superadmin' && (
            <TableCell>
              <Button size="small" color="primary" onClick={() => handleEdit(kategori)}>
                Edit
              </Button>
              <Button size="small" color="secondary" onClick={() => handleDelete(kategori.uuid)}>
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
            {isEditing ? "Edit kategori" : "Add kategori"}
          </Typography>
          <TextField
            label="Nama Kategori"
            name="namakategori"
            value={formData.namakategori}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
        
          <Button variant="contained" color="primary" onClick={handleSubmit} fullWidth>
            {isEditing ? "Update" : "Create"}
          </Button>
        </Box>
      </Modal>
    </Box>
  );
};
