import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemText,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { NavLink, useNavigate } from "react-router-dom";
import { Logout, reset } from '../../fitur/AuthSlice';
import { useDispatch, useSelector } from "react-redux";
import Button from "@mui/material/Button";
import { LogoutOutlined } from "@mui/icons-material";


const Header = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const dispatch = useDispatch();
  const isMobile = useMediaQuery('(max-width:768px)');
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);

  const handleLogoutClick = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setOpenConfirmDialog(true);
  };

  const handleConfirmLogout = () => {
    dispatch(Logout());
    dispatch(reset());
    navigate("/");
    setOpenConfirmDialog(false);
  };

  const handleCancelLogout = () => {
    setOpenConfirmDialog(false);
  };


  // const logout = () => {
  //   dispatch(Logout());
  //   dispatch(reset());
  //   navigate("/");
  // };

  const toggleDrawer = (open) => () => {
    setDrawerOpen(open);
  };

  return (
    <>
   <AppBar position="static" color="primary" sx={{ margin: 0, padding: 0, width: '100%' }}>
  <Toolbar sx={{ display: 'flex', justifyContent: isMobile ? 'flex-start' : 'space-between' }}>
    <IconButton edge="start" color="inherit" onClick={toggleDrawer(true)}>
      <MenuIcon />
    </IconButton>
    {!isMobile && (
      <Typography variant="h6">
        Point Of Sales
      </Typography>
    )}
  </Toolbar>
</AppBar>
<Dialog
      open={openConfirmDialog}
      onClose={handleCancelLogout}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">
        Konfirmasi Logout
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          Apakah Anda yakin ingin keluar dari sistem?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancelLogout} color="primary">
          Batal
        </Button>
        <Button 
          onClick={handleConfirmLogout} 
          color="error"
          autoFocus
          startIcon={<LogoutOutlined />}
        >
          Ya, Logout
        </Button>
      </DialogActions>
    </Dialog>

      <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
        <List style={{ width: 250 }}>
          <ListItem button
          component={NavLink}
         // to="/order"
         to={"/produkpercabang"}
          >
            <ListItemText primary="Beranda" />
          </ListItem>
         
          <ListItem button
           
           component={NavLink}
           //onClick={logout}
           to="/transaksikasir"
          >
            <ListItemText primary="Transaksi" />
          </ListItem>
          <ListItem button
           
           component={NavLink}
           //onClick={logout}
           to="/detail"
          >
            <ListItemText primary="Detail" />
          </ListItem>
          <ListItem button
           
           component={NavLink}
           //onClick={logout}
           to="/profilekasir"
          >
            <ListItemText primary="Profile" />
          </ListItem>
          <Button
          onClick={handleLogoutClick}
          sx={{
            width: "90%",
            justifyContent: "flex-start",
            color: "#27667B",
            p: 2,
            borderRadius: 1,
            textTransform: "none",
            transition: "all 0.3s ease",
           "&:hover": {
              bgcolor: "#EF4444",
              color: "white",
              transform: "scale(1.05)", 
            },
            minHeight: "48px",
            touchAction: "manipulation",
          }}
          startIcon={<LogoutOutlined />}
        >
          Log Out
        </Button>
        </List>
      </Drawer>
    </>
  );
};

export default Header;
