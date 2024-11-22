import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useDispatch, useSelector } from "react-redux";
import { LogoutOutlined } from '@mui/icons-material';
import { Logout, reset } from '../fitur/AuthSlice';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  List, ListItemButton, Collapse
} from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import Button from "@mui/material/Button";

export const Sidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [open, setOpen] = useState(false);

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
  const handleClick = () => {
    setOpen(!open);
  };

  return (
    <Box
      sx={{
        bgcolor: '#1e293b',
        color: 'white',
        display: { xs: 'block', lg: 'flex' },
        flexDirection: 'column',
        height: '100vh',
        width: { xs: 200, lg: 250 },
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 1200,
        overflow: 'auto', // Hide overflow for parent container
      }}
    >
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

      {/* Logo Section - Fixed at top */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 60,
          p: 2,
          borderBottom: '1px solid #374151',
          position: 'sticky',
          top: 0,
          bgcolor: '#1e293b',
          zIndex: 2,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Point Of Sales
        </Typography>
      </Box>

      {/* Scrollable Navigation Links */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          height: 'calc(100vh - 120px)', // Viewport height minus header and footer space
          p: 2,
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: '#1e293b',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#374151',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            backgroundColor: '#4b5563',
          },
          scrollbarWidth: 'thin',
          scrollbarColor: '#374151 #1e293b',
        }}
      >
        <Stack spacing={2}>
          <Typography
            component={NavLink}
            to="/dashboard"
            sx={{
              textDecoration: 'none',
              color: '#cbd5e1',
              p: 1,
              borderRadius: 1,
              display: 'block',
              '&:hover': { bgcolor: '#374151', color: 'white' },
              '&.active': { bgcolor: '#374151', color: 'white' }, 
            }}
          >
            Dashboard
          </Typography>

          <Typography
            component={NavLink}
            to="/userlist"
            sx={{
              textDecoration: 'none',
              color: '#cbd5e1',
              p: 1,
              borderRadius: 1,
              display: 'block',
              '&:hover': { bgcolor: '#374151', color: 'white' },
              '&.active': { bgcolor: '#374151', color: 'white' }, 
            }}
          >
            User List
          </Typography>
          
          <Typography
            component={NavLink}
            to="/transaction"
            sx={{
              textDecoration: 'none',
              color: '#cbd5e1',
              p: 1,
              borderRadius: 1,
              display: 'block',
              '&:hover': { bgcolor: '#374151', color: 'white' },
              '&.active': { bgcolor: '#374151', color: 'white' }, 
            }}
          >
            Transaction
          </Typography>

          <Typography
            component={NavLink}
            to="/product"
            sx={{
              textDecoration: 'none',
              color: '#cbd5e1',
              p: 1,
              borderRadius: 1,
              display: 'block',
              '&:hover': { bgcolor: '#374151', color: 'white' },
              '&.active': { bgcolor: '#374151', color: 'white' }, 
            }}
          >
            Product
          </Typography>
          
          <Typography
            component={NavLink}
            to="/category"
            sx={{
              textDecoration: 'none',
              color: '#cbd5e1',
              p: 1,
              borderRadius: 1,
              display: 'block',
              '&:hover': { bgcolor: '#374151', color: 'white' },
              '&.active': { bgcolor: '#374151', color: 'white' }, 
            }}
          >
            Category
          </Typography>
          
          <Typography
            component={NavLink}
            to="/setprodukpercabang"
            sx={{
              textDecoration: 'none',
              color: '#cbd5e1',
              p: 1,
              borderRadius: 1,
              display: 'block',
              '&:hover': { bgcolor: '#374151', color: 'white' },
              '&.active': { bgcolor: '#374151', color: 'white' }, 
            }}
          >
            Set Produk
          </Typography>
          {user && user.role === "superadmin" && (
            <Typography
              component={NavLink}
              to="/send"
              sx={{
                textDecoration: 'none',
                color: '#cbd5e1',
                p: 1,
                borderRadius: 1,
                display: 'block',
                '&:hover': { bgcolor: '#374151', color: 'white' },
                '&.active': { bgcolor: '#374151', color: 'white' }, 
              }}
            >
              Send Product to Branch
            </Typography>
          )}
          
          {user && user.role === "superadmin" && (
            <Typography
              component={NavLink}
              to="/branch"
              sx={{
                textDecoration: 'none',
                color: '#cbd5e1',
                p: 1,
                borderRadius: 1,
                display: 'block',
                '&:hover': { bgcolor: '#374151', color: 'white' },
                '&.active': { bgcolor: '#374151', color: 'white' }, 
              }}
            >
              Branch
            </Typography>
          )}
          {/* Dropdown Button */}
          <ListItemButton onClick={handleClick} sx={{ color: '#cbd5e1', '&:hover': { bgcolor: '#374151', color: 'white' } }}>
            <Typography variant="body1"> Invoice All</Typography>
            {open ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>

          {/* Dropdown Content */}
          <Collapse in={open} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              <ListItemButton
                component={NavLink}
                to="/laporan"
                sx={{
                  textDecoration: 'none',
                  color: '#cbd5e1',
                  pl: 4,
                  borderRadius: 1,
                  '&:hover': { bgcolor: '#374151', color: 'white' },
                  '&.active': { bgcolor: '#374151', color: 'white' },
                }}
              >
                Invoice
              </ListItemButton>
             
              <ListItemButton
                component={NavLink}
                to="/penjualankategori"
                sx={{
                  textDecoration: 'none',
                  color: '#cbd5e1',
                  pl: 4,
                  borderRadius: 1,
                  '&:hover': { bgcolor: '#374151', color: 'white' },
                  '&.active': { bgcolor: '#374151', color: 'white' },
                }}
              >
                Category Sell Report
              </ListItemButton>
              <ListItemButton
                component={NavLink}
                to="/stockpages"
                sx={{
                  textDecoration: 'none',
                  color: '#cbd5e1',
                  pl: 4,
                  borderRadius: 1,
                  '&:hover': { bgcolor: '#374151', color: 'white' },
                  '&.active': { bgcolor: '#374151', color: 'white' },
                }}
              >
                Stock
              </ListItemButton>
              <ListItemButton
                component={NavLink}
                to="/komprehensif"
                sx={{
                  textDecoration: 'none',
                  color: '#cbd5e1',
                  pl: 4,
                  borderRadius: 1,
                  '&:hover': { bgcolor: '#374151', color: 'white' },
                  '&.active': { bgcolor: '#374151', color: 'white' },
                }}
              >
                Komprehensif
              </ListItemButton>
              
              {user && user.role === "superadmin" && (
                <>
               <ListItemButton
                component={NavLink}
                to="/createjurnal"
                sx={{
                  textDecoration: 'none',
                  color: '#cbd5e1',
                  pl: 4,
                  borderRadius: 1,
                  '&:hover': { bgcolor: '#374151', color: 'white' },
                  '&.active': { bgcolor: '#374151', color: 'white' },
                }}
              >
                Create Pembelian
              </ListItemButton>
              
              <ListItemButton
                component={NavLink}
                to="/getjurnal"
                sx={{
                  textDecoration: 'none',
                  color: '#cbd5e1',
                  pl: 4,
                  borderRadius: 1,
                  '&:hover': { bgcolor: '#374151', color: 'white' },
                  '&.active': { bgcolor: '#374151', color: 'white' },
                }}
              >
                Jurnal
              </ListItemButton>
              </>
              )}
              
            </List>
          </Collapse>
          
        
      

          
          {user && user.role === "admin" && (
            <Typography
              component={NavLink}
              to="/confirm"
              sx={{
                textDecoration: 'none',
                color: '#cbd5e1',
                p: 1,
                borderRadius: 1,
                display: 'block',
                '&:hover': { bgcolor: '#374151', color: 'white' },
                '&.active': { bgcolor: '#374151', color: 'white' }, 
              }}
            >
              Confrim Product
            </Typography>
          )}
            {user && user.role === "admin" && (
          <Typography
            component={NavLink}
            to="/stockcabang"
            sx={{
              textDecoration: 'none',
              color: '#cbd5e1',
              p: 1,
              borderRadius: 1,
              display: 'block',
              '&:hover': { bgcolor: '#374151', color: 'white' },
              '&.active': { bgcolor: '#374151', color: 'white' }, 
            }}
          >
            Stock Product
          </Typography>
            )}
              {user && user.role === "superadmin" && (
          <Typography
            component={NavLink}
            to="/stockallbranch"
            sx={{
              textDecoration: 'none',
              color: '#cbd5e1',
              p: 1,
              borderRadius: 1,
              display: 'block',
              '&:hover': { bgcolor: '#374151', color: 'white' },
              '&.active': { bgcolor: '#374151', color: 'white' }, 
            }}
          >
            Stock Product All Branch
          </Typography>
            )}
          <Typography
            component={NavLink}
            to="/mutasi"
            sx={{
              textDecoration: 'none',
              color: '#cbd5e1',
              p: 1,
              borderRadius: 1,
              display: 'block',
              '&:hover': { bgcolor: '#374151', color: 'white' },
              '&.active': { bgcolor: '#374151', color: 'white' }, 
            }}
          >
            History Product
          </Typography>
          {user && user.role === "admin" && (
          <Typography
            component={NavLink}
            to="/meja"
            sx={{
              textDecoration: 'none',
              color: '#cbd5e1',
              p: 1,
              borderRadius: 1,
              display: 'block',
              '&:hover': { bgcolor: '#374151', color: 'white' },
              '&.active': { bgcolor: '#374151', color: 'white' }, 
            }}
          >
           Data Table
          </Typography>
          )}
        
         
          {user && user.role === "superadmin" && (
            <Typography
              component={NavLink}
              to="/wearhouse"
              sx={{
                textDecoration: 'none',
                color: '#cbd5e1',
                p: 1,
                borderRadius: 1,
                display: 'block',
                '&:hover': { bgcolor: '#374151', color: 'white' },
                '&.active': { bgcolor: '#374151', color: 'white' }, 
              }}
            >
             Warehouse
            </Typography>
          )}
        </Stack>
      </Box>

      {/* Footer with Logout Button - Fixed at bottom */}
      <Box
        sx={{
          p: 2,
          borderTop: '1px solid #374151',
          position: 'sticky',
          bottom: 0,
          bgcolor: '#1e293b',
          zIndex: 2,
        }}
      >
        <Button
          onClick={handleLogoutClick}
          sx={{
            width: "100%",
            justifyContent: "flex-start",
            color: "#cbd5e1",
            p: 1.5,
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
      </Box>
    </Box>
  );
};

export default Sidebar;