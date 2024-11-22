import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Alert,
  Stack
} from '@mui/material';
import useSWR, { mutate } from 'swr';  // ✅ Import mutate untuk auto-refresh
import axios from 'axios';
import { useSelector } from "react-redux";

const fetcher = (url) => axios.get(url, { withCredentials: true }).then((res) => res.data);

const getApiBaseUrl = () => {
  const protocol = window.location.protocol === 'https:' ? 'https' : 'http';
  const baseUrl = process.env.REACT_APP_URL.replace(/^https?:\/\//, '');
  return `${protocol}://${baseUrl}`;
};

export const CreateJurnal = () => {
  const { user } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({
    cabanguuid: user?.cabanguuid || '',
    jenis_transaksi: 'pembelian',
    baranguuid: '',
    jumlah: '',
    harga_satuan: '',
    deskripsi: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // ✅ Fetch barang dengan SWR
  const { data: barangData } = useSWR(`${getApiBaseUrl()}/barang`, fetcher);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    const dataToSend = {
      ...formData,
      cabanguuid: formData.cabanguuid ? formData.cabanguuid : null
    };
    
    try {
      const response = await axios.post(
        `${getApiBaseUrl()}/createjurnal`,
        dataToSend,
        { withCredentials: true }
      );
      
      setSuccess(response.data.message);
      setFormData({
        cabanguuid: '',
        jenis_transaksi: 'pembelian',
        baranguuid: '',
        jumlah: '',
        harga_satuan: '',
        deskripsi: ''
      });

      // ✅ Auto-refresh jurnal setelah menambahkan data
      mutate(`${getApiBaseUrl()}/getjurnal`);

    } catch (err) {
      setError(err.response?.data?.message || 'Terjadi kesalahan pada server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={3}>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Buat Jurnal Baru
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <FormControl fullWidth>
                <InputLabel>Barang</InputLabel>
                <Select
                  name="baranguuid"
                  value={formData.baranguuid}
                  onChange={handleChange}
                  required
                >
                  {barangData?.data?.map((barang) => (
                    <MenuItem key={barang.uuid} value={barang.uuid}>
                      {barang.namabarang}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Jumlah"
                name="jumlah"
                type="number"
                value={formData.jumlah}
                onChange={handleChange}
                required
                inputProps={{ min: 1 }}
              />

              <TextField
                fullWidth
                label="Harga Satuan"
                name="harga_satuan"
                type="number"
                value={formData.harga_satuan}
                onChange={handleChange}
                required
                inputProps={{ min: 0 }}
              />

              <TextField
                fullWidth
                label="Deskripsi"
                name="deskripsi"
                multiline
                rows={3}
                value={formData.deskripsi}
                onChange={handleChange}
              />

              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
                sx={{ mt: 2 }}
              >
                {loading ? 'Menyimpan...' : 'Simpan Jurnal'}
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CreateJurnal;
