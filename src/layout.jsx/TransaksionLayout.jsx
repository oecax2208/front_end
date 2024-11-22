import React from 'react';
import { Grid, Grid2, useMediaQuery } from '@mui/material';
import Header from '../componen/kasir/Header';
//import Sidebar from '../componen/kasir/Sidebar';
import { Transaksi } from '../componen/kasir/Transaksi';
//import OrderList from '../componen/kasir/OrderList';

const TransactionsLayout = ({ userUuid }) => {
  const isMobile = useMediaQuery('(max-width:768px)'); // Deteksi jika perangkat mobile (width <= 768px)

  return (
   <>
      {/* Header tetap di atas */}
      <Header />
      <Grid2>
      </Grid2>
      <Grid container>
        {/* Untuk perangkat desktop, gunakan grid 3-6-3 */}
        {!isMobile && (
          <>
            {/* <Grid item xs={3}>
              <Sidebar />
            </Grid> */}
            <Grid item xs={12}>
              <Transaksi userUuid={userUuid} />
            </Grid>
            {/* <Grid item xs={3}>
              <OrderList />
            </Grid> */}
          </>
        )}
        {/* Untuk perangkat mobile, sidebar dan daftar pesanan akan di bawah grid */}
        {isMobile && (
          <>
            <Grid item xs={12}>
              <Transaksi userUuid={userUuid} />
            </Grid>
            {/* <Grid item xs={12}>
              <Sidebar />
            </Grid>
            <Grid item xs={12}>
              <OrderList />
            </Grid> */}
          </>
        )}
      </Grid>
      </>
  );
};

export default TransactionsLayout;
