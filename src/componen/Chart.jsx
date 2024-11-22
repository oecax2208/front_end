import React, { useState, useRef, useEffect } from 'react';
import { Box, Card, CardContent, Typography, FormControl, Select, MenuItem } from '@mui/material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import axios from 'axios';
import useSWR from 'swr';
import { useSelector } from "react-redux";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const getApiBaseUrl = () => {
  const protocol = window.location.protocol === "https:" ? "https" : "http";
  const baseUrl = process.env.REACT_APP_URL.replace(/^https?:\/\//, "");
  return `${protocol}://${baseUrl}`;
};

const fetcher = (url) => axios.get(url, { withCredentials: true }).then((res) => res.data);

const ChartComponent = ({ userRole }) => {
  const { user } = useSelector((state) => state.auth);
  const apiUrl = user?.role === "superadmin" ? "/barangcabangsuperadmin" : "/barangcabang";
  const { data, error, isLoading } = useSWR(`${getApiBaseUrl()}${apiUrl}`, fetcher);
  const [selectedCabang, setSelectedCabang] = useState("all");
  const chartRef = useRef(null);
  const [chartHeight, setChartHeight] = useState('400px');

  // Handle responsive sizing
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 600) {
        setChartHeight('300px');
      } else {
        setChartHeight('400px');
      }
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isLoading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">Gagal mengambil data</Typography>;

  const barangData = data?.data || [];
  const cabangList = Array.from(new Set(barangData.map(item => item.Cabang?.namacabang)
  .filter(Boolean)));
  const filteredData = selectedCabang === "all"
    ? barangData
    : barangData.filter(item => item.Cabang?.namacabang === selectedCabang);

  const chartData = {
    labels: filteredData.map(item => item.Barang?.namabarang),
    datasets: [
      {
        label: "Stok Barang",
        data: filteredData.map(item => item.stok),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderWidth: 2,
        tension: 0.3,
      },
    ],
  };

  // Chart options with responsive configuration
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          font: {
            size: window.innerWidth <= 600 ? 10 : 12
          }
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          font: {
            size: window.innerWidth <= 600 ? 10 : 12
          }
        }
      }
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: window.innerWidth <= 600 ? 12 : 14
          },
          boxWidth: window.innerWidth <= 600 ? 30 : 40
        }
      },
      tooltip: {
        titleFont: {
          size: window.innerWidth <= 600 ? 12 : 14
        },
        bodyFont: {
          size: window.innerWidth <= 600 ? 11 : 13
        }
      }
    }
  };

  return (
    <Box 
      sx={{
        p: { xs: 1, sm: 2, md: 3 },
        width: '100%',
        overflowX: 'auto'
      }}
    >
      <Card>
        <CardContent>
          <Typography 
            variant="h6"
            sx={{
              fontSize: { xs: '1rem', sm: '1.25rem' },
              mb: 2
            }}
          >
            Grafik Stok Barang Cabang
          </Typography>

          {user?.role === "superadmin" && (
            <FormControl 
              sx={{ 
                mt: 2, 
                minWidth: { xs: '100%', sm: 200 },
                mb: 2
              }}
            >
              <Select
                value={selectedCabang}
                onChange={(e) => setSelectedCabang(e.target.value)}
                size={window.innerWidth <= 600 ? "small" : "medium"}
              >
                <MenuItem value="all">Semua Cabang</MenuItem>
                {cabangList.map(cabang => (
                  <MenuItem key={cabang} value={cabang}>{cabang}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <Box 
            sx={{
              height: chartHeight,
              width: '100%',
              minWidth: { xs: '300px', sm: 'auto' },
              overflowX: 'auto'
            }}
          >
            <Line 
              ref={chartRef}
              data={chartData}
              options={chartOptions}
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ChartComponent;