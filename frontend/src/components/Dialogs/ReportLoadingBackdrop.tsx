import React from 'react';
import { Backdrop, Box, CircularProgress, Typography } from '@mui/material';

interface ReportLoadingBackdropProps {
  open: boolean;
}

export function ReportLoadingBackdrop({ open }: ReportLoadingBackdropProps) {
  return (
    <Backdrop
      sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 2, backdropFilter: 'blur(4px)', bgcolor: 'rgba(0,0,0,0.7)' }}
      open={open}
    >
      <Box sx={{ textAlign: 'center' }}>
        <CircularProgress color="secondary" size={60} thickness={4} />
        <Typography variant="h6" sx={{ mt: 3, fontWeight: 700 }}>
          Loading Full Report...
        </Typography>
      </Box>
    </Backdrop>
  );
}
