import React, { useState, useEffect } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Card,
  TableContainer,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  TextField,
  Stack,
  Pagination,
  Tabs,
  Tab
} from "@mui/material";
import { format } from "date-fns";

const getApiBaseUrl = () => {
  const protocol = window.location.protocol === "https:" ? "https" : "http";
  const baseUrl = process.env.REACT_APP_URL.replace(/^https?:\/\/+/, "");
  return `${protocol}://${baseUrl}`;
};

const GetJurnal = () => {
  const apiBaseUrl = getApiBaseUrl();
  
  // State variables
  const [balanceData, setBalanceData] = useState(null);
  const [transactionSummary, setTransactionSummary] = useState(null);
  const [journalData, setJournalData] = useState([]);
  const [transactionData, setTransactionData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [transactionType, setTransactionType] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  
  // Pagination states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalTransactions, setTotalTransactions] = useState(0);
  
  // Date filter states - initialize with current month
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
  const lastDayOfMonth = new Date(currentYear, now.getMonth() + 1, 0).getDate();
  const [startDate, setStartDate] = useState(`${currentYear}-${currentMonth}-01`);
  const [endDate, setEndDate] = useState(`${currentYear}-${currentMonth}-${lastDayOfMonth}`);
  
  // State to track if initial search has been performed
  const [hasSearched, setHasSearched] = useState(false);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(amount);
  };

  const fetchJournalData = async (start, end, type) => {
    let url = `${apiBaseUrl}/getjurnal?start_date=${start}&end_date=${end}`;

    if (type) {
      url += `&jenis_transaksi=${type}`;
    }

    const response = await axios.get(url);
    return response.data.data || [];
  };

  const fetchBalanceData = async (start, end) => {    
    const response = await axios.get(
      `${apiBaseUrl}/getsaldodandebit?startDate=${start}&endDate=${end}`
    );
    
    return response.data;
  };

  const fetchTransactionsData = async (start, end, currentPage, pageLimit) => {
    const url = `${apiBaseUrl}/getsaldotransaksi?startDate=${start}&endDate=${end}&page=${currentPage}&limit=${pageLimit}`;
    const response = await axios.get(url);
    return response.data;
  };

  const fetchData = async () => {
    if (!startDate || !endDate) {
      setError("Please select both start and end dates");
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Fetch data from both API endpoints
      const [balanceResponse, journalResponse, transactionsResponse] = await Promise.all([
        fetchBalanceData(startDate, endDate),
        fetchJournalData(startDate, endDate, transactionType),
        fetchTransactionsData(startDate, endDate, page, limit)
      ]);

      // Store both balance data and transaction summary
      setBalanceData(balanceResponse);
      setTransactionSummary(transactionsResponse);
      
      setJournalData(journalResponse);
      
      // Set transactions data
      setTransactionData(transactionsResponse.transaksi.data || []);
      setTotalTransactions(transactionsResponse.transaksi.total || 0);
      
      // Set expense/journal data if available
      if (transactionsResponse.jurnal && transactionsResponse.jurnal.data) {
        setExpenseData(transactionsResponse.jurnal.data || []);
      }
      
      setHasSearched(true);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to fetch data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = async (event, value) => {
    setPage(value);
    try {
      setLoading(true);
      const transactionsResponse = await fetchTransactionsData(startDate, endDate, value, limit);
      setTransactionData(transactionsResponse.transaksi.data || []);
      setTotalTransactions(transactionsResponse.transaksi.total || 0);
      
      if (transactionsResponse.jurnal && transactionsResponse.jurnal.data) {
        setExpenseData(transactionsResponse.jurnal.data || []);
      }
    } catch (err) {
      console.error("Error fetching page data:", err);
      setError("Failed to fetch page data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionTypeChange = (event) => {
    setTransactionType(event.target.value);
  };

  const handleStartDateChange = (event) => {
    setStartDate(event.target.value);
  };

  const handleEndDateChange = (event) => {
    setEndDate(event.target.value);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    
    // Set title based on active tab
    const reportTitle = activeTab === 0 ? "Journal Entries Report" : "Transactions Report";
    doc.text(reportTitle, 14, 10);
    doc.setFontSize(12);
    doc.text(`Period: ${format(new Date(startDate), "dd MMM yyyy")} - ${format(new Date(endDate), "dd MMM yyyy")}`, 14, 18);
    doc.text(`Generated on: ${format(new Date(), "dd MMM yyyy")}`, 14, 26);

    if (activeTab === 0) {
      // Journal entries
      const tableColumn = ["Date", "Transaction Type", "Branch", "Item Name", "Quantity", "Unit Price", "Total Price", "Description"];
      const tableRows = [];

      journalData.forEach((entry) => {
        const rowData = [
          format(new Date(entry.createdAt), "dd MMM yyyy"),
          entry.jenis_transaksi,
          entry.Cabang?.namacabang || "Tidak tersedia",
          entry.Barang?.namabarang || "Tidak tersedia",
          entry.jumlah,
          formatCurrency(parseFloat(entry.harga_satuan)),
          formatCurrency(parseFloat(entry.total_harga)),
          entry.deskripsi || "-",
        ];
        tableRows.push(rowData);
      });

      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 32,
        theme: "grid",
      });
      
      doc.save(`Journal_Report_${format(new Date(), "yyyy-MM-dd")}.pdf`);
    } else {
      // Transactions
      const tableColumn = ["Date", "Order ID", "Amount", "Payment Method", "Branch", "Cashier"];
      const tableRows = [];

      transactionData.forEach((entry) => {
        const rowData = [
          format(new Date(entry.createdAt), "dd MMM yyyy"),
          entry.order_id,
          formatCurrency(parseFloat(entry.totaljual)),
          entry.pembayaran === "qris" ? "QRIS" : entry.pembayaran === "cash" ? "Cash" : entry.pembayaran,
          entry.User?.Cabang?.namacabang || "Tidak tersedia",
          entry.User?.username || "Tidak tersedia",
        ];
        tableRows.push(rowData);
      });

      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 32,
        theme: "grid",
      });
      
      doc.save(`Transactions_Report_${format(new Date(), "yyyy-MM-dd")}.pdf`);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Financial Summary
      </Typography>

      {/* Date Filter Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Filter Period
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
          <TextField
            label="Start Date"
            type="date"
            value={startDate}
            onChange={handleStartDateChange}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            label="End Date"
            type="date"
            value={endDate}
            onChange={handleEndDateChange}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel id="transaction-type-label">Transaction Type</InputLabel>
            <Select 
              labelId="transaction-type-label" 
              value={transactionType} 
              label="Transaction Type" 
              onChange={handleTransactionTypeChange}
            >
              <MenuItem value="">All Transactions</MenuItem>
              <MenuItem value="pembelian">Pembelian</MenuItem>
              <MenuItem value="penjualan">Penjualan</MenuItem>
            </Select>
          </FormControl>
          <Button 
            variant="contained" 
            onClick={fetchData}
            sx={{ minWidth: 120 }}
            disabled={loading}
          >
            {loading ? "Loading..." : "Search"}
          </Button>
        </Stack>
      </Paper>
      
      {loading && (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Financial Summary Cards - only show after search */}
      {hasSearched && !loading && !error && transactionSummary && (
        <>
          <Typography variant="h6" gutterBottom>
            Financial Summary
          </Typography>
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 2, bgcolor: "#e3f2fd" }}>
                <Typography variant="subtitle2">Total Income</Typography>
                <Typography variant="h6">
                  {formatCurrency(parseFloat(transactionSummary.ringkasan?.total_pemasukan || 0))}
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 2, bgcolor: "#fbe9e7" }}>
                <Typography variant="subtitle2">Total Expenses</Typography>
                <Typography variant="h6">
                  {formatCurrency(parseFloat(transactionSummary.ringkasan?.total_pengeluaran || 0))}
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 2, bgcolor: "#e8f5e9" }}>
                <Typography variant="subtitle2">Running Balance</Typography>
                <Typography variant="h6">
                  {formatCurrency(parseFloat(transactionSummary.ringkasan?.saldo_berjalan || 0))}
                </Typography>
              </Card>
            </Grid>
          </Grid>
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={12}>
              <Card sx={{ p: 2, bgcolor: "#f9fbe7" }}>
                <Typography variant="subtitle2">Period</Typography>
                <Typography variant="h6">
                  {format(new Date(transactionSummary.periode?.tanggal_mulai), "dd MMM yyyy")} - {format(new Date(transactionSummary.periode?.tanggal_akhir), "dd MMM yyyy")}
                </Typography>
              </Card>
            </Grid>
          </Grid>
        </>
      )}

      {/* Tabs for Journal & Transactions */}
      {hasSearched && !loading && !error && (
        <>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={activeTab} onChange={handleTabChange} aria-label="finance tabs">
              <Tab label="Journal Entries" />
              <Tab label="Transactions" />
            </Tabs>
          </Box>
          
          {/* Tab Content */}
          <Box sx={{ mb: 3, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Typography variant="h6">{activeTab === 0 ? "Journal Entries" : "Transactions"}</Typography>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={downloadPDF}
              disabled={(activeTab === 0 && journalData.length === 0) || 
                        (activeTab === 1 && transactionData.length === 0)}
            >
              Download PDF
            </Button>
          </Box>
          
          {/* Journal Entries Tab */}
          {activeTab === 0 && (
            <>
              {journalData.length === 0 ? (
                <Alert severity="info" sx={{ mt: 2 }}>
                  No journal entries found for the selected period.
                </Alert>
              ) : (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                        <TableCell>Date</TableCell>
                        <TableCell>Transaction Type</TableCell>
                        <TableCell>Branch Name</TableCell>
                        <TableCell>Item Name</TableCell>
                        <TableCell>Quantity</TableCell>
                        <TableCell>Unit Price</TableCell>
                        <TableCell>Total Price</TableCell>
                        <TableCell>Description</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {journalData.map((entry) => (
                        <TableRow key={entry.uuid}>
                          <TableCell>{format(new Date(entry.createdAt), "dd MMM yyyy")}</TableCell>
                          <TableCell>{entry.jenis_transaksi}</TableCell>
                          <TableCell>{entry.Cabang?.namacabang || 'Tidak tersedia'}</TableCell>
                          <TableCell>{entry.Barang?.namabarang || 'Tidak tersedia'}</TableCell>
                          <TableCell>{entry.jumlah}</TableCell>
                          <TableCell>{formatCurrency(parseFloat(entry.harga_satuan))}</TableCell>
                          <TableCell>{formatCurrency(parseFloat(entry.total_harga))}</TableCell>
                          <TableCell>{entry.deskripsi || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}
          
          {/* Transactions Tab */}
          {activeTab === 1 && (
            <>
              {transactionData.length === 0 ? (
                <Alert severity="info" sx={{ mt: 2 }}>
                  No transactions found for the selected period.
                </Alert>
              ) : (
                <>
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                          <TableCell>Date</TableCell>
                          <TableCell>Order ID</TableCell>
                          <TableCell>Amount</TableCell>
                          <TableCell>Payment Method</TableCell>
                          <TableCell>Table</TableCell>
                          <TableCell>Branch</TableCell>
                          <TableCell>Cashier</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {transactionData.map((entry) => (
                          <TableRow key={entry.uuid}>
                            <TableCell>{format(new Date(entry.createdAt), "dd MMM yyyy")}</TableCell>
                            <TableCell>{entry.order_id}</TableCell>
                            <TableCell>{formatCurrency(parseFloat(entry.totaljual))}</TableCell>
                            <TableCell>
                              {entry.pembayaran === "qris" ? "QRIS" : 
                               entry.pembayaran === "cash" ? "Cash" : entry.pembayaran}
                            </TableCell>
                            <TableCell>{entry.tableId ? `Table ${entry.tableId}` : "-"}</TableCell>
                            <TableCell>{entry.User?.Cabang?.namacabang || 'Tidak tersedia'}</TableCell>
                            <TableCell>{entry.User?.username || 'Tidak tersedia'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  
                  {/* Pagination */}
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <Pagination 
                      count={Math.ceil(totalTransactions / limit)} 
                      page={page} 
                      onChange={handlePageChange} 
                      color="primary" 
                    />
                  </Box>
                </>
              )}
            </>
          )}
        </>
      )}
    </Box>
  );
};

export default GetJurnal;