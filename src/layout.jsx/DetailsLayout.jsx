import React from 'react';
import { Grid, Grid2, useMediaQuery } from '@mui/material';
import Header from '../componen/kasir/Header';
import OrderDetails from '../componen/kasir/OrderDetails';

const DetailsLayout = ({userUuid}) => {
  const isMobile = useMediaQuery('(max-width:768px)'); 

  return (
   <>
      <Header />
      <Grid2>
      </Grid2>
      <Grid container>
      
        {!isMobile && (
          <>
            
            <Grid item xs={12}>
              <OrderDetails userUuid={userUuid} />
            </Grid>
           
          </>
        )}
       
        {isMobile && (
          <>
            <Grid item xs={12}>
              <OrderDetails userUuid={userUuid} />
            </Grid>
         
          </>
        )}
      </Grid>
      </>
  );
};

export default DetailsLayout;
