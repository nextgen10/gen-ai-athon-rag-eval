import React from 'react';
import { Box, Paper, Typography, Avatar, alpha } from '@mui/material';
import { motion } from 'framer-motion';

const MotionPaper = motion(Paper);

interface GlassCardProps {
    title: string;
    value: React.ReactNode;
    color: string;
    icon: React.ReactNode;
    subtitle?: string;
    trend?: string | null;
}

export const GlassCard: React.FC<GlassCardProps> = ({ title, value, color: initialColor, icon, subtitle, trend }) => {
    const color = (initialColor === '#ffffff' || initialColor === '#fff')
        ? (initialColor === '#ffffff' ? (initialColor === '#ffffff' ? '#ffffff' : '#ffffff') : '#ffffff')
        : initialColor;

    // Actually, let's just use the current theme context to decide
    return (
        <MotionPaper
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            sx={{
                pl: 3,
                pr: 2,
                py: 2,
                height: '100%',
                background: (theme) => {
                    const displayColor = (initialColor === '#ffffff' || initialColor === '#fff')
                        ? (theme.palette.mode === 'dark' ? '#ffffff' : '#2563eb')
                        : initialColor;
                    return theme.palette.mode === 'dark'
                        ? `linear-gradient(135deg, ${alpha(displayColor, 0.05)} 0%, ${alpha('#0f172a', 0.4)} 100%)`
                        : `linear-gradient(135deg, ${alpha(displayColor, 0.05)} 0%, ${alpha('#ffffff', 0.95)} 100%)`;
                },
                backdropFilter: 'blur(30px)',
                position: 'relative',
                overflow: 'hidden',
                border: (theme) => `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                boxShadow: (theme) => {
                    const displayColor = (initialColor === '#ffffff' || initialColor === '#fff')
                        ? (theme.palette.mode === 'dark' ? '#ffffff' : '#2563eb')
                        : initialColor;
                    return `0 10px 30px ${theme.palette.mode === 'dark' ? alpha(displayColor, 0.35) : alpha(displayColor, 0.1)}`;
                },
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Box sx={{ minWidth: 0, ml: 0.5 }}>
                    <Typography
                        variant="overline"
                        sx={{
                            color: 'text.secondary',
                            fontWeight: 800,
                            fontSize: '0.65rem',
                            lineHeight: 1.2,
                            mb: 0.5,
                            display: 'block'
                        }}
                    >
                        {title}
                    </Typography>
                    <Typography
                        sx={{
                            fontWeight: 900,
                            color: 'text.primary',
                            letterSpacing: '-0.02em',
                            fontSize: '1.25rem',
                            lineHeight: 1.2,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}
                        title={typeof value === 'string' ? value : ''}
                    >
                        {value}
                    </Typography>
                </Box>
                <Avatar sx={{
                    bgcolor: (theme) => {
                        const displayColor = (initialColor === '#ffffff' || initialColor === '#fff')
                            ? (theme.palette.mode === 'dark' ? '#ffffff' : '#2563eb')
                            : initialColor;
                        return alpha(displayColor, 0.1);
                    },
                    color: (theme) => (initialColor === '#ffffff' || initialColor === '#fff')
                        ? (theme.palette.mode === 'dark' ? '#ffffff' : '#2563eb')
                        : initialColor,
                    width: 36,
                    height: 36,
                    border: (theme) => {
                        const displayColor = (initialColor === '#ffffff' || initialColor === '#fff')
                            ? (theme.palette.mode === 'dark' ? '#ffffff' : '#2563eb')
                            : initialColor;
                        return `1px solid ${alpha(displayColor, 0.2)}`;
                    },
                    boxShadow: (theme) => {
                        const displayColor = (initialColor === '#ffffff' || initialColor === '#fff')
                            ? (theme.palette.mode === 'dark' ? '#ffffff' : '#2563eb')
                            : initialColor;
                        return `0 0 10px ${alpha(displayColor, 0.2)}`;
                    },
                    ml: 1
                }}>
                    {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 18 }) : icon}
                </Avatar>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 0.5 }}>
                {trend && (
                    <Typography
                        variant="caption"
                        sx={{
                            color: (theme) => (initialColor === '#ffffff' || initialColor === '#fff')
                                ? (theme.palette.mode === 'dark' ? '#ffffff' : '#2563eb')
                                : initialColor,
                            fontWeight: 900,
                            fontSize: '0.7rem',
                            bgcolor: (theme) => {
                                const displayColor = (initialColor === '#ffffff' || initialColor === '#fff')
                                    ? (theme.palette.mode === 'dark' ? '#ffffff' : '#2563eb')
                                    : initialColor;
                                return alpha(displayColor, 0.1);
                            },
                            px: 1,
                            py: 0.2,
                            borderRadius: 1
                        }}
                    >
                        {trend}
                    </Typography>
                )}
                <Typography
                    variant="caption"
                    sx={{
                        color: 'text.secondary',
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }}
                >
                    {subtitle}
                </Typography>
            </Box>
        </MotionPaper>
    );
};
