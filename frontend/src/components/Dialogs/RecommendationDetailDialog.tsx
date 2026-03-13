import React from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';

interface RecommendationDetailDialogProps {
  open: boolean;
  rowLabel: string;
  text: string;
  onClose: () => void;
}

export function RecommendationDetailDialog({ open, rowLabel, text, onClose }: RecommendationDetailDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          bgcolor: 'background.paper',
          border: (theme) => `1px solid ${theme.palette.divider}`,
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 800, fontSize: '1rem', borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>
        Recommendation Details
        {rowLabel ? (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            {rowLabel}
          </Typography>
        ) : null}
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
          {text}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2, borderTop: (theme) => `1px solid ${theme.palette.divider}` }}>
        <Button variant="contained" onClick={onClose} sx={{ textTransform: 'none', borderRadius: 99 }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
