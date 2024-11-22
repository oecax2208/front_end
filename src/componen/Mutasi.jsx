import React, { useState } from 'react'; 
import { Box, Button, Card, CardHeader, Chip, CircularProgress, Divider, Table, TableBody, TableCell, TableHead, TableRow, TableContainer, TextField, Paper } from '@mui/material';
import dayjs from 'dayjs';
import useSWR from 'swr';
import axios from 'axios';
import { useSelector } from "react-redux";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const getApiBaseUrl = () => {
  const protocol = window.location.protocol === 'https:' ? 'https' : 'http';
  const baseUrl = process.env.REACT_APP_URL.replace(/^https?:\/\/+/, '');
  return `${protocol}://${baseUrl}`;
};

const fetcher = (url) => axios.get(url, { withCredentials: true }).then((res) => res.data);

export const Mutasi = ({ userRole }) => {
  const [startDate, setStartDate] = useState(dayjs().subtract(30, 'day').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs().format('YYYY-MM-DD'));
  const { user } = useSelector((state) => state.auth);
  const endpoint = `${getApiBaseUrl()}${user?.role === "superadmin" ? "/getmutasi" : "/getmutasitracking"}?startDate=${startDate}&endDate=${endDate}`;

  const { data, error, isLoading } = useSWR(endpoint, fetcher);

  const handleStartDateChange = (event) => setStartDate(event.target.value);
  const handleEndDateChange = (event) => setEndDate(event.target.value);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Mutasi Stok", 14, 10);
    autoTable(doc, {
      startY: 20,
      head: [['Nama Barang', 'Cabang', 'Jenis Mutasi', 'Jumlah', 'Dibuat', 'Diperbarui', 'Keterangan']],
      body: data?.data?.map(item => [
        item.Barang?.namabarang,
        item.Cabang?.namacabang || '-',
        item.jenis_mutasi,
        item.jumlah,
        dayjs(item.createdAt).format('DD/MM/YYYY HH:mm'),
        dayjs(item.updatedAt).format('DD/MM/YYYY HH:mm'),
        item.keterangan,
      ]),
    });
    doc.save("mutasi_stok.pdf");
  };

  if (error) return <Box p={2}>Error loading data</Box>;
  if (isLoading) return <Box p={2} display="flex" justifyContent="center"><CircularProgress /></Box>;

  return (
    <Card>
      <CardHeader 
        title="Mutasi Stok" 
        action={
          <Box display="flex" gap={2}>
            <TextField label="Start Date" type="date" value={startDate} onChange={handleStartDateChange} InputLabelProps={{ shrink: true }} />
            <TextField label="End Date" type="date" value={endDate} onChange={handleEndDateChange} InputLabelProps={{ shrink: true }} />
            <Button variant="contained" color="primary" onClick={exportPDF}>Export PDF</Button>
          </Box>
        }
      />
      <Divider />
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nama Barang</TableCell>
              <TableCell>Cabang</TableCell>
              <TableCell>Jenis Mutasi</TableCell>
              <TableCell>Jumlah</TableCell>
              <TableCell>Dibuat</TableCell>
              <TableCell>Diperbarui</TableCell>
              <TableCell>Keterangan</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.data?.map((item) => (
              <TableRow key={item.uuid}>
                <TableCell>{item.Barang?.namabarang}</TableCell>
                <TableCell>{item.Cabang?.namacabang || '-'}</TableCell>
                <TableCell>
                  <Chip label={item.jenis_mutasi} color={item.jenis_mutasi === 'masuk' ? 'success' : 'error'} size="small" />
                </TableCell>
                <TableCell>{item.jumlah}</TableCell>
                <TableCell>{dayjs(item.createdAt).format('DD/MM/YYYY HH:mm')}</TableCell>
                <TableCell>{dayjs(item.updatedAt).format('DD/MM/YYYY HH:mm')}</TableCell>
                <TableCell>{item.keterangan}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
};

export default Mutasi;
