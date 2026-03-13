import React from 'react';
import { Box, Pagination, PaginationItem } from '@mui/material';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface PaginationControlProps {
    count: number;
    page: number;
    onChange: (event: React.ChangeEvent<unknown>, value: number) => void;
    sx?: any;
}

export const PaginationControl: React.FC<PaginationControlProps> = ({ count, page, onChange, sx }) => {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 2, ...sx }}>
            <Pagination
                count={count}
                page={page}
                onChange={onChange}
                renderItem={(item) => (
                    <PaginationItem
                        slots={{ previous: () => <ArrowLeft size={16} />, next: () => <ArrowRight size={16} /> }}
                        {...item}
                        sx={{
                            color: '#94a3b8',
                            '&.Mui-selected': {
                                bgcolor: 'rgba(56, 189, 248, 0.1)',
                                color: '#38bdf8',
                                border: '1px solid rgba(56, 189, 248, 0.3)',
                                '&:hover': {
                                    bgcolor: 'rgba(56, 189, 248, 0.2)',
                                }
                            }
                        }}
                    />
                )}
                sx={{
                    '& .MuiPagination-ul': { gap: 1 }
                }}
            />
        </Box>
    );
};
