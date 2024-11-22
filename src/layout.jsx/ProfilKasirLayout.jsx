import React from 'react';
import { Grid, Grid2, useMediaQuery } from '@mui/material';
import Header from '../componen/kasir/Header';
import { ProfileKasir } from '../componen/kasir/ProfileKasir';

const ProfileKasirLayout = ({ userUuid }) => {
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
              <ProfileKasir userUuid={userUuid} />
            </Grid>
            {/* <Grid item xs={3}>
              <OrderList />
            </Grid> */}
          </>
        )}
        {isMobile && (
          <>
            <Grid item xs={12}>
              <ProfileKasir userUuid={userUuid} />
            </Grid>
            
          </>
        )}
      </Grid>
      </>
  );
};

export default ProfileKasirLayout;
