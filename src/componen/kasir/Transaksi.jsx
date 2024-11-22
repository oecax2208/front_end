import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import useSWR from 'swr';
import axios from 'axios';
import { format } from 'date-fns';

const getApiBaseUrl = () => {
  const protocol = window.location.protocol === 'https:' ? 'https' : 'http';
  const baseUrl = process.env.REACT_APP_URL.replace(/^https?:\/\/+/, '');
  return `${protocol}://${baseUrl}`;
};

const fetcher = (url) => axios.get(url, { withCredentials: true }).then((res) => res.data);

const statusMap = {
  settlement: { label: 'Success', color: 'success' },
  pending: { label: 'Pending', color: 'warning' },
  failure: { label: 'Failed', color: 'error' },
  cancel: { label: 'Canceled', color: 'error' },
};

export const Transaksi = () => {
  const [tanggal, setTanggal] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    setTanggal(today);
  }, []);

  const { data: rekapData, error: rekapError, isValidating } = useSWR(
    `${getApiBaseUrl()}/rekapharianuser?tanggal=${tanggal}`,
    fetcher
  );

  const SalesSummaryCard = () => {
    if (!rekapData) return null;

    const formatCurrency = (value) => {
      return `Rp ${parseFloat(value).toLocaleString('id-ID', { minimumFractionDigits: 0 })}`;
    };

    const SummaryItem = ({ label, value, highlightColor }) => (
      <Box sx={{ 
        p: 2, 
        borderRadius: 1,
        backgroundColor: highlightColor || 'background.paper',
        boxShadow: 1
      }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          {label}
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          {formatCurrency(value)}
        </Typography>
      </Box>
    );

    return (
      <Card sx={{ mb: 3 }}>
        <CardHeader 
          title="Rekap Penjualan Hari Ini" 
          subheader={`Tanggal: ${format(new Date(tanggal), 'dd MMMM yyyy')}`}
        />
        <Divider />
        <Box sx={{ p: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <SummaryItem 
                label="Total Penjualan Success"
                value={rekapData.totalPenjualanSuccess}
                highlightColor="#e3f2fd"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                Pembayaran Cash
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <SummaryItem 
                    label="Cash Success"
                    value={rekapData.totalPenjualanCashSuccess}
                  />
                </Grid>
                <Grid item xs={12}>
                  <SummaryItem 
                    label="Cash Pending"
                    value={rekapData.totalPenjualanCashPending}
                  />
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                Pembayaran QRIS
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <SummaryItem 
                    label="QRIS Success"
                    value={rekapData.totalPenjualanQrisSuccess}
                  />
                </Grid>
                <Grid item xs={12}>
                  <SummaryItem 
                    label="QRIS Pending"
                    value={rekapData.totalPenjualanQrisPending}
                  />
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12}>
              <SummaryItem 
                label="Total Penjualan Pending"
                value={rekapData.totalPenjualanPending}
                highlightColor="#fff3e0"
              />
            </Grid>
          </Grid>
        </Box>
      </Card>
    );
  };

  const handlePrint = () => {
    if (rekapData) {
      const transaksiPertama = rekapData.data.transaksiSuccess[0];
      const username = transaksiPertama?.User?.username || 'Tidak diketahui';
      const namacabang = transaksiPertama?.User?.Cabang?.namacabang || 'Tidak diketahui';

      const printWindow = window.open('', '_blank');
      const content = `
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                font-size: 12px;
                margin: 0;
                padding: 0;
                width: 58mm;
              }
              .container {
                padding: 10px;
                text-align: center;
              }
              h1 {
                font-size: 14px;
                margin-bottom: 5px;
              }
              p {
                margin: 5px 0;
              }
              .line {
                border-top: 1px dashed #000;
                margin: 10px 0;
              }
              .footer {
                margin-top: 10px;
                font-size: 10px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Rekap Harian</h1>
              <div class="line"></div>
              <p><strong>Nama Kasir:</strong> ${username}</p>
              <p><strong>Cabang:</strong> ${namacabang}</p>
              <p><strong>Tanggal Rekap:</strong> ${format(new Date(tanggal), 'dd/MM/yyyy')}</p>
              <div class="line"></div>
              <p><strong>Total Penjualan Success:</strong>Rp.${parseFloat(rekapData.totalPenjualanSuccess).toLocaleString()}</p>
              <p><strong>Total Penjualan Pending:</strong>Rp.${parseFloat(rekapData.totalPenjualanPending).toLocaleString()}</p>
              <div class="line"></div>
              <p><strong>Penjualan Detail:</strong></p>
              <p>- Cash Success:Rp.${parseFloat(rekapData.totalPenjualanCashSuccess).toLocaleString()}</p>
              <p>- QRIS Success:Rp. ${parseFloat(rekapData.totalPenjualanQrisSuccess).toLocaleString()}</p>
              <p>- Cash Pending:Rp.${parseFloat(rekapData.totalPenjualanCashPending).toLocaleString()}</p>
              <p>- QRIS Pending:Rp.${parseFloat(rekapData.totalPenjualanQrisPending).toLocaleString()}</p>
              <div class="line"></div>
              <p class="footer">*Terima kasih atas kerja keras Anda!*</p>
            </div>
          </body>
        </html>
      `;
      printWindow.document.write(content);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleRowClick = (transaction) => {
    setSelectedTransaction(transaction);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <TextField
          label="Tanggal"
          type="date"
          value={tanggal}
          onChange={(e) => setTanggal(e.target.value)}
          InputLabelProps={{ shrink: true }}
          fullWidth
          sx={{ flex: 1, minWidth: '200px' }}
        />
        <Button
          variant="contained"
          onClick={handlePrint}
          disabled={!rekapData || isValidating}
          sx={{ minWidth: '150px' }}
        >
          Print Rekap
        </Button>
      </Box>

      {isValidating ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <CircularProgress />
        </Box>
      ) : rekapError ? (
        <Typography color="error" sx={{ my: 3 }}>
          Gagal memuat data rekap
        </Typography>
      ) : (
        <SalesSummaryCard />
      )}

      <Card>
        <CardHeader title="Rekap Harian" />
        <Divider />
        <Box sx={{ overflowX: 'auto', width: '100%' }}>
  <Table>
    <TableHead>
      <TableRow>
        <TableCell>Order ID</TableCell>
        <TableCell>Total Jual</TableCell>
        <TableCell>Status Pembayaran</TableCell>
        <TableCell>Pembayaran</TableCell>
        <TableCell>Tanggal</TableCell>
        <TableCell>Dibuat</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {rekapError ? (
        <TableRow>
          <TableCell colSpan={6} align="center">
            <Typography color="error">Gagal memuat data rekap harian.</Typography>
          </TableCell>
        </TableRow>
      ) : isValidating || !rekapData ? (
        <TableRow>
          <TableCell colSpan={6} align="center">
            <CircularProgress size={24} />
          </TableCell>
        </TableRow>
      ) : (
        rekapData?.data?.transaksiSuccess.map((transaction) => (
          <TableRow
            key={transaction.uuid}
            hover
            style={{ cursor: 'pointer' }}
            onClick={() => handleRowClick(transaction)}
          >
            <TableCell>{transaction.order_id}</TableCell>
            <TableCell>{transaction.totaljual}</TableCell>
            <TableCell>
              <Chip
                label={statusMap[transaction.status_pembayaran]?.label || 'Unknown'}
                color={statusMap[transaction.status_pembayaran]?.color || 'default'}
              />
            </TableCell>
            <TableCell>{transaction.pembayaran}</TableCell>
            <TableCell>{format(new Date(transaction.tanggal), 'dd/MM/yyyy')}</TableCell>
            <TableCell>{format(new Date(transaction.createdAt), 'HH:mm:ss')}</TableCell>
          </TableRow>
        ))
      )}
    </TableBody>
  </Table>
</Box>

      </Card>

      {selectedTransaction && (
        <Card sx={{ mt: 3 }}>
          <CardHeader title={`Detail Transaksi: ${selectedTransaction.order_id}`} />
          <Divider />
          <Box sx={{ p: 2 }}>
            <Typography variant="body1">
              <strong>Nama Kasir:</strong> {selectedTransaction.User?.username || 'Tidak diketahui'}
            </Typography>
            <Typography variant="body1">
              <strong>Cabang:</strong> {selectedTransaction.User?.Cabang?.namacabang || 'Tidak diketahui'}
            </Typography>
            <Typography variant="body1">
              <strong>Tanggal:</strong> {format(new Date(selectedTransaction.tanggal), 'dd/MM/yyyy')}
            </Typography>
            <Typography variant="body1">
              <strong>Status Pembayaran:</strong> {selectedTransaction.status_pembayaran}
            </Typography>
            <Typography variant="body1">
              <strong>Pembayaran:</strong> {selectedTransaction.pembayaran}
            </Typography>
            <Typography variant="body1">
              <strong>Total:</strong> {selectedTransaction.totaljual}
            </Typography>
            <Divider sx={{ my: 2 }} />
            {selectedTransaction.TransaksiDetails.map((detail) => {
              return (
                <Box key={detail.uuid} sx={{ mb: 1 }}>
                  <Typography variant="body2">
                    {detail.Barang?.namabarang || 'Barang tidak diketahui'} - Jumlah: {detail.jumlahbarang} - Harga: Rp {detail.harga} - Total: Rp {detail.total}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Card>
      )}

      {selectedTransaction && (
        <Button
          variant="contained"
          sx={{ mt: 2 }}
          onClick={() => {
            const printWindow = window.open('', '_blank');
            const content = `
              <html>
                <head>
                  <style>
                    body {
                      font-family: Arial, sans-serif;
                      font-size: 12px;
                      margin: 0;
                      padding: 0;
                      width: 58mm;
                    }
                    .container {
                      padding: 10px;
                      text-align: center;
                    }
                    h1, h3 {
                      font-size: 14px;
                      margin-bottom: 5px;
                    }
                    p {
                      margin: 5px 0;
                      text-align: left;
                    }
                    .line {
                      border-top: 1px dashed #000;
                      margin: 10px 0;
                    }
                    .footer {
                      margin-top: 10px;
                      font-size: 10px;
                      text-align: center;
                    }
                    .details {
                      margin-top: 10px;
                      text-align: left;
                    }
                    .total-row {
                      font-weight: bold;
                    }
                    .total {
                      text-align: right;
                    }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <h1>Detail Transaksi</h1>
                    <div class="line"></div>
                    <p><strong>Order ID:</strong> ${selectedTransaction.order_id}</p>
                    <p><strong>Nama Kasir:</strong> ${selectedTransaction.User?.username || 'Tidak diketahui'}</p>
                    <p><strong>Cabang:</strong> ${selectedTransaction.User?.Cabang?.namacabang || 'Tidak diketahui'}</p>
                    <p><strong>Tanggal:</strong> ${format(new Date(selectedTransaction.tanggal), 'dd/MM/yyyy')}</p>
                    <p><strong>Di buat:</strong> ${format(new Date(selectedTransaction.createdAt), 'HH:mm')}</p>
                    <div class="line"></div>
                    <h3>Barang</h3>
                    <div class="details">
                      ${selectedTransaction.TransaksiDetails.map((detail) => `
                        <div>
                          <strong>${detail.Barang?.namabarang || 'Tidak diketahui'}</strong> - Jumlah: ${detail.jumlahbarang} - Harga: Rp ${detail.harga} - Total: Rp ${detail.total}
                        </div>
                      `).join('')}
                    </div>
                    <div class="line"></div>
                    <div class="total-row">
                      <p><strong>Total:</strong></p>
                      <p class="total">Rp ${parseFloat(selectedTransaction.totaljual).toLocaleString()}</p>
                    </div>
                    <div class="line"></div>
                    <p class="footer">*Terima kasih atas transaksi Anda!*</p>
                  </div>
                </body>
              </html>
            `;
            printWindow.document.write(content);
            printWindow.document.close();
            printWindow.print();
          }}
        >
          Cetak Detail
        </Button>
      )}
    </Box>
  );
};