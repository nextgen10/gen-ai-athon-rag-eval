"use client";

import React from "react";
import { Box, Button, Typography } from "@mui/material";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: React.ReactNode;
  /** Optional label shown in the fallback (e.g. "Dashboard" or "Experiments view") */
  label?: string;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: unknown): State {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    return { hasError: true, message };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, message: "" });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight={240}
        gap={2}
        p={4}
      >
        <AlertTriangle size={40} color="#f59e0b" />
        <Typography variant="h6" fontWeight={600}>
          {this.props.label ?? "Component"} encountered an error
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          {this.state.message}
        </Typography>
        <Button variant="outlined" size="small" onClick={this.handleReset}>
          Try again
        </Button>
      </Box>
    );
  }
}
