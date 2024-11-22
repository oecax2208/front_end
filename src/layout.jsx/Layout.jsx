import React, { useState } from 'react';
import Box from '@mui/material/Box';
import { Navbar } from '../componen/Navbar';
import Sidebar from '../componen/Sidebar';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';

export const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex', height: '95vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <Box
        sx={{
          display: { xs: isSidebarOpen ? 'block' : 'none', lg: 'block' },
          position: { xs: 'fixed', lg: 'relative' },
          zIndex: 1200,
          width: 300,
          flexShrink: 0,
        }}
      >
        <Sidebar />
      </Box>

      {/* Main Content Area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Navbar */}
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 1100,
            backgroundColor: 'white',
            boxShadow: 1,
          }}
        >
          <Navbar>
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              sx={{ display: { lg: 'none' } }}
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <MenuIcon />
            </IconButton>
          </Navbar>
        </Box>

        {/* Content */}
        <Box
          component="main"
          sx={{
            flex: 1,
            overflowY: 'auto', // Hanya bagian ini yang dapat di-scroll
            height: '100%',
            backgroundColor: 'var(--mui-palette-background-default)',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};
