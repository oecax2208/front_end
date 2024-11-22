import React, { useState, useEffect } from 'react';
import { Box, Grid, Card, CardContent, Typography, FormControl, Select, MenuItem  } from '@mui/material';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  ArcElement,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import '../componen/css/Dashboard.css';
import axios from 'axios';
import useSWR from 'swr';
import ChartComponent from './Chart';
import MonitorStock from './MonitorStock';
import { MonitorGudang } from './MonitorGudang';
import {  useSelector } from "react-redux";
import { DashboardJurnal } from './DashboardJurnal';

ChartJS.register(CategoryScale, LinearScale, ArcElement, BarElement, Tooltip, Legend);

const getApiBaseUrl = () => {
  const protocol = window.location.protocol === "https:" ? "https" : "http";
  const baseUrl = process.env.REACT_APP_URL.replace(/^https?:\/\//, "");
  return `${protocol}://${baseUrl}`;
};


const fetcher = (url) => axios.get(url, { withCredentials: true }).then((res) => res.data);

export const Dashboard = () => {
  // State
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });
  const [totalPenjualanSuccess, setTotalPenjualanSuccess] = useState(0);
  const [totalCabang, setTotalCabang] = useState(0);
  const [totalTransaksi, setTotalTransaksi] = useState(0);
  const [todayPenjualanSuccess, setTodayPenjualanSuccess] = useState(0);
  const [monthRange, setMonthRange] = useState('12');
  const { user } = useSelector((state) => state.auth);
  const [rawMonthlyData, setRawMonthlyData] = useState({});
  const [doughnutChartData, setDoughnutChartData] = useState({
    labels: [],
    datasets: [],
  })
  const { data, error, req } = useSWR(`${getApiBaseUrl()}/gettransaksi`, fetcher);

  useEffect(() => {
    if (data && Array.isArray(data.transaksi)) {
      const filteredData =
        req?.user?.role === "admin"
          ? data.transaksi.filter((trans) => trans.User.Cabang.uuid === req.user.cabanguuid)
          : data.transaksi;

      processTransactionData(filteredData);
      setTotalPenjualanSuccess(data.totalPenjualanSuccess || 0);
      setTotalTransaksi(data.totalTransaksi || 0);
    }
  }, [data]);

  useEffect(() => {
    fetchCabangData();
    fetchLaporanDetail();
  }, []);
  // useEffect(() => {
  //   if (data && Array.isArray(data.transaksi)) {
  //     const today = new Date();
  //     const todayString = today.toISOString().split('T')[0];

  //     const { totalSuccess, todaySuccess } = data.transaksi.reduce(
  //       (acc, trans) => {
  //         if (trans.status_pembayaran === 'settlement') {
  //           acc.totalSuccess += parseFloat(trans.totaljual);

  //           if (trans.tanggal === todayString) {
  //             acc.todaySuccess += parseFloat(trans.totaljual);
  //           }
  //         }
  //         return acc;
  //       },
  //       { totalSuccess: 0, todaySuccess: 0 }
  //     );

  //     setTotalPenjualanSuccess(totalSuccess);
  //     setTodayPenjualanSuccess(todaySuccess);
  //   }
  // }, [data]);
  useEffect(() => {
    if (data && Array.isArray(data.transaksi)) {
      // Get today's date (local timezone)
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const todayDateString = `${year}-${month}-${day}`;
      
      console.log("Today's date string:", todayDateString);
      
      // Calculate today's sales
      const todaySales = data.transaksi.reduce((total, trans) => {
        if (trans.status_pembayaran === 'settlement' && trans.tanggal === todayDateString) {
          console.log(`Found today's transaction: ${trans.order_id}, Amount: ${trans.totaljual}`);
          return total + parseFloat(trans.totaljual);
        }
        return total;
      }, 0);
      
      console.log("Final today's sales calculation:", todaySales);
      setTodayPenjualanSuccess(todaySales);
    }
  }, [data]);
  const fetchCabangData = async () => {
    try {
      const response = await axios.get(`${getApiBaseUrl()}/cabang`);
      if (response.status === 200) {
        setTotalCabang(response.data.totalcabang || 0);
      } else {
        console.error("Invalid API response format:", response.data);
      }
    } catch (error) {
      console.error("Error fetching cabang data:", error);
    }
  };

  const fetchLaporanDetail = async () => {
    try {
      const response = await axios.get(`${getApiBaseUrl()}/laporandetail`, {
        withCredentials: true,
      });
      if (response.status === 200) {
        const { totalPenjualanSuccess, monthlyData } = response.data;
        setTotalPenjualanSuccess(totalPenjualanSuccess || 0);
        processChartData(monthlyData);
      } else {
        console.error("Invalid API response format:", response.data);
      }
    } catch (error) {
      console.error("Error fetching laporan detail:", error);
    }
  };

  const processTransactionData = (transaksiData) => {
    const monthlySales = {};
    transaksiData.forEach((transaksi) => {
      const month = new Date(transaksi.tanggal).toLocaleString("en-US", {
        month: "short",
      });
      if (!monthlySales[month]) {
        monthlySales[month] = 0;
      }
      monthlySales[month] += parseFloat(transaksi.totaljual || 0);
    });
    setChartData((prev) => ({
      ...prev,
      labels: Object.keys(monthlySales),
      datasets: [
        {
          label: "Total Sales",
          backgroundColor: "rgba(63, 81, 181, 0.6)",
          borderColor: "#3f51b5",
          borderWidth: 1,
          hoverBackgroundColor: "rgba(63, 81, 181, 0.8)",
          hoverBorderColor: "#3f51b5",
          data: Object.values(monthlySales),
        },
      ],
    }));
  };
  useEffect(() => {
    
    if (rawMonthlyData) {
      processChartData(rawMonthlyData);
      console.log("Month Range Changed:", monthRange);
      console.log("Processed Raw Monthly Data:", rawMonthlyData);
    }
  }, [rawMonthlyData, monthRange]);
  const processChartData = (monthlyData) => {
    setRawMonthlyData(monthlyData);
    const monthsToShow = parseInt(monthRange);
  
    const dataArray = Object.entries(monthlyData).map(([month, values]) => ({
      month,
      ...values,
    }));
  
    const monthMap = {
      Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
      Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
    };
  
    dataArray.sort((a, b) => {
      const [monthA, yearA] = a.month.split(' ');
      const [monthB, yearB] = b.month.split(' ');
      return (
        new Date(yearA, monthMap[monthA]) - new Date(yearB, monthMap[monthB])
      );
    });
  
    const filteredData = dataArray.slice(-monthsToShow);
  
    const labels = filteredData.map((item) => item.month);
    const cashData = filteredData.map((item) => item.cash || 0);
    const qrisData = filteredData.map((item) => item.qris || 0);
  
    setChartData({
      labels,
      datasets: [
        {
          label: "Cash Sales",
          backgroundColor: "rgba(63, 81, 181, 0.6)",
          borderColor: "#3f51b5",
          data: cashData,
        },
        {
          label: "QRIS Sales",
          backgroundColor: "rgba(255, 152, 0, 0.6)",
          borderColor: "#ff9800",
          data: qrisData,
        },
      ],
    });
  
    console.log("Updated Chart Data:", { labels, datasets: [cashData, qrisData] });
  };
  

  const handleMonthRangeChange = (event) => {
    const newRange = event.target.value;
    setMonthRange(newRange);
  };
  const fetchBarangData = async () => {
    try {
      const response = await axios.get(`${getApiBaseUrl()}/barang`, { withCredentials: true });
      return response.data;
    } catch (error) {
      console.error("Error fetching barang data:", error);
      return null;
    }
  };
  
  const fetchKategoriData = async () => {
    try {
      const response = await axios.get(`${getApiBaseUrl()}/kategori`, { withCredentials: true });
      return response.data;
    } catch (error) {
      console.error("Error fetching kategori data:", error);
      return null;
    }
  };
  useEffect(() => {
    const loadDoughnutData = async () => {
      const barangData = await fetchBarangData();
      const kategoriData = await fetchKategoriData();
  
      if (barangData && kategoriData) {
        // Hitung jumlah barang berdasarkan kategori
        const kategoriCount = kategoriData.data.map((kategori) => ({
          label: kategori.namakategori,
          count: barangData.data.filter((barang) => barang.kategoriuuid === kategori.uuid).length,
        }));
  
        setDoughnutChartData({
          labels: kategoriCount.map((item) => item.label),
          datasets: [
            {
              data: kategoriCount.map((item) => item.count),
              backgroundColor: ['#3f51b5', '#ff9800', '#4caf50', '#e91e63', '#9c27b0'],
              hoverBackgroundColor: ['#5c6bc0', '#ffb74d', '#66bb6a', '#f06292', '#ba68c8'],
            },
          ],
        });
      }
    };
  
    loadDoughnutData();
  }, []);
    
  

  return (
    <Box sx={{ flexGrow: 1, p: 3, backgroundColor: '#f4f6f8', minHeight: '100vh' }}>
      {/* Header */}
      <Typography variant="h4" sx={{ mb: 3 }}>
    
      </Typography>

      {/* Statistik */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" color="textSecondary">
                Total Sales
              </Typography>
              <Typography variant="h4" sx={{ color: '#3f51b5' }}>
                Rp.{totalPenjualanSuccess.toLocaleString("id-ID")}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Updated just now
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" color="textSecondary">
                Branch
              </Typography>
              <Typography variant="h4" sx={{ color: '#4caf50' }}>
                {totalCabang}
              </Typography>
              <Typography variant="body2" color="error.main">
                All Branch
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" color="textSecondary">
                All Transactions
              </Typography>
              <Typography variant="h4" sx={{ color: '#ff9800' }}>
                {totalTransaksi}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Updated just now
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" color="textSecondary">
                Today Transactions
              </Typography>
              <Typography variant="h4" sx={{ color: '#ff9800' }}>
              Rp.{todayPenjualanSuccess.toLocaleString("id-ID")}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Updated just now
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        {user && user.role === "superadmin" && (
        <DashboardJurnal />
        )}
       
        <ChartComponent />
      </Grid>

          {/* Chart Section */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Monthly Sales
                </Typography>
                <FormControl sx={{ minWidth: 120 }} size="small">
                  <Select
                    value={monthRange}
                    onChange={handleMonthRangeChange}
                    displayEmpty
                  >
                    <MenuItem value="3">3 Months</MenuItem>
                    <MenuItem value="6">6 Months</MenuItem>
                    <MenuItem value="12">12 Months</MenuItem>
                    <MenuItem value="24">24 Months</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <div className="chart-container">
                <Bar
                key={monthRange}
                  data={chartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      x: {
                        title: {
                          display: true,
                          text: "Bulan",
                        },
                      },
                      y: {
                        title: {
                          display: true,
                          text: "Total Penjualan",
                        },
                        beginAtZero: true,
                      },
                    },
                    plugins: {
                      legend: {
                        display: true,
                        position: "top",
                      },
                    },
                  }}
                />
              </div>
             
              {user && user.role === "superadmin" && (
                <MonitorGudang />
              )}
              
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
  <Card>
    <CardContent>
      <Typography variant="h6" gutterBottom>
        Kategori Barang
      </Typography>
      <div className="chart-container">
        <Doughnut
          data={doughnutChartData}
          options={{ responsive: true, maintainAspectRatio: false }}
        />
      </div>
      <MonitorStock />
           
    </CardContent>
  </Card>
</Grid>



      </Grid>
    </Box>
  );
};
