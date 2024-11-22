import React, { useState, useEffect } from "react";
import axios from "axios";
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

export const DashboardJurnal = () => {
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

      // Automatic date range calculation
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
      const currentDay = String(now.getDate()).padStart(2, "0");
      
      // Default start date is the first day of the current month
      const defaultStartDate = `${currentYear}-${currentMonth}-01`;
      
      // Default end date is the current date
      const defaultEndDate = `${currentYear}-${currentMonth}-${currentDay}`;

      const [startDate, setStartDate] = useState(defaultStartDate);
      const [endDate, setEndDate] = useState(defaultEndDate);
      
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
            fetchTransactionsData(startDate, endDate, 1, 10)
          ]);
    
          // Store both balance data and transaction summary
          setBalanceData(balanceResponse);
          setTransactionSummary(transactionsResponse);
          
          setJournalData(journalResponse);
          
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
      
      // Automatically fetch data when component mounts
      useEffect(() => {
        fetchData();
      }, []);

      const handleStartDateChange = (event) => {
        setStartDate(event.target.value);
      };

      const handleEndDateChange = (event) => {
        setEndDate(event.target.value);
      };

      return (
        <Box 
             sx={{
               p: { xs: 1, sm: 2, md: 3 },
               width: '100%',
               overflowX: 'auto'
             }}
           >
          <Typography variant="h5" gutterBottom>
          
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
        </Box>
      );
};