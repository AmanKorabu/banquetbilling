import React, { forwardRef } from "react";
import dayjs from "dayjs";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
  Divider,
  Chip,
  Box,
  LinearProgress,
  Slide,
} from "@mui/material";
import { HiPrinter } from "react-icons/hi2";
import { LuReceiptIndianRupee } from "react-icons/lu";
import { FaFileInvoice, FaEdit } from "react-icons/fa";

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const LabelValue = ({ label, value }) => (
  <Box>
    <Typography
      variant="caption"
      sx={{
        color: "text.secondary",
        textTransform: "uppercase",
        letterSpacing: 0.6,
      }}
    >
      {label}
    </Typography>
    <Typography variant="body2" sx={{ fontWeight: 600 }}>
      {value ?? "—"}
    </Typography>
  </Box>
);

const fmtDate = (v) =>
  v && dayjs(v).isValid() ? dayjs(v).format("DD MMM YYYY") : "—";
const fmtTime = (v) =>
  v && dayjs(v).isValid() ? dayjs(v).format("hh:mm A") : "—";
const inr = (n) =>
  Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function MakeInvoiceDialog({
  open,
  onClose,
  onConfirm,
  onConfirmWithPrint,
  loading = false,
  data = {},
  isEditMode = false, // Add this new prop
}) {
  const canConfirm = Number(data.billAmount || 0) > 0 && !loading;

  // Determine titles and labels based on edit mode
  const dialogTitle = isEditMode ? "Modify Invoice" : "Create Invoice";

  const amountLabel = isEditMode ? "Invoice Amount" : "Amount to invoice";
  const description = isEditMode
    ? "Choose how you want to proceed with invoice modification"
    : "Choose how you want to proceed with invoice creation";

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      TransitionComponent={Transition}
      maxWidth="sm"
      fullWidth
      keepMounted
      PaperProps={{
        elevation: 0,
        sx: {
          borderRadius: 3,
          overflow: "hidden",
          border: "1px solid #e9dfc6",
          boxShadow:
            "0 10px 30px rgba(0,0,0,.08), inset 0 1px 0 rgba(255,255,255,.6)",
          bgcolor: "#fff",
        },
      }}
    >
      {loading && <LinearProgress />}
      <DialogTitle sx={{ py: 2.25 }}>
        <Stack direction="row" gap={1.5} alignItems="center">
          {isEditMode ? <FaEdit size={22} /> : <HiPrinter size={22} />}
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {dialogTitle}
          </Typography>
          <Chip
            label={isEditMode ? "Update Option" : "Choose Option"}
            size="small"
            sx={{
              ml: "auto",
              bgcolor: "#faf7ef",
              border: "1px solid #e9dfc6",
              color: isEditMode ? "#d35400" : "inherit"
            }}
          />
        </Stack>
      </DialogTitle>

      <DialogContent dividers sx={{ borderColor: "#f1ead7" }}>
        <Stack gap={2}>
          {/* Party / Event quick facts */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 2,
            }}
          >
            <LabelValue label="Party" value={data.partyName} />
            <LabelValue label="Company" value={data.companyName} />
            <LabelValue label="Venue" value={data.venueName} />
            <LabelValue label="Serving" value={data.servingName} />
            <LabelValue
              label="Date"
              value={
                data.toDate
                  ? `${fmtDate(data.fromDate)} → ${fmtDate(data.toDate)}`
                  : fmtDate(data.fromDate)
              }
            />
            <LabelValue
              label="Time"
              value={`${fmtTime(data.fromTime)} - ${fmtTime(data.toTime)}`}
            />
          </Box>

          <Divider />

          {/* Totals Card */}
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: "#faf7ef",
              border: "1px solid #e9dfc6",
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography
                variant="subtitle2"
                sx={{ color: "#6e5b2b", letterSpacing: 0.3 }}
              >
                {amountLabel}
              </Typography>
              <Chip
                icon={<LuReceiptIndianRupee size={16} />}
                label={`₹ ${inr(data.billAmount ?? 0)}`}
                variant="outlined"
                sx={{
                  fontWeight: 700,
                  "& .MuiChip-label": { px: 1 },
                  borderColor: "#d7c9a1",
                  backgroundColor: isEditMode ? "#fff3e0" : undefined,
                }}
              />
            </Stack>
          </Box>

          <Typography variant="body2" color="text.secondary" textAlign="center">
            {description}
          </Typography>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1, flexDirection: 'column' }}>
        <Stack width="100%" gap={1}>
          {/* Modify/Save Invoice Only Button */}
          <Button
            variant="outlined"
            onClick={onConfirm}
            startIcon={isEditMode ? <FaEdit /> : <FaFileInvoice />}
            disabled={!canConfirm}
            fullWidth
            sx={{
              borderColor: isEditMode ? '#ff9800' : '#4caf50',
              color: isEditMode ? '#ff9800' : '#4caf50',
              '&:hover': {
                borderColor: isEditMode ? '#f57c00' : '#388e3c',
                backgroundColor: isEditMode ? 'rgba(255, 152, 0, 0.04)' : 'rgba(76, 175, 80, 0.04)'
              },
              textTransform: 'none',
              fontWeight: 600,
              py: 1.5
            }}
          >
            {loading
              ? (isEditMode ? "Updating..." : "Creating...")
              : (isEditMode ? "Modify Invoice Only" : "Make Invoice Only")
            }
          </Button>

          {/* Modify/Save Invoice & Print Button */}
          <Button
            variant="contained"
            onClick={onConfirmWithPrint}
            startIcon={<HiPrinter />}
            disabled={!canConfirm}
            fullWidth
            sx={{
              bgcolor: isEditMode ? '#ff9800' : '#2196f3',
              '&:hover': {
                bgcolor: isEditMode ? '#f57c00' : '#1976d2'
              },
              textTransform: 'none',
              fontWeight: 600,
              py: 1.5
            }}
          >
            {loading
              ? (isEditMode ? "Updating..." : "Creating...")
              : (isEditMode ? "Modify & Print Invoice" : "Make Invoice & Print")
            }
          </Button>
        </Stack>

        {/* Cancel Button */}
        <Button
          onClick={onClose}
          disabled={loading}
          fullWidth
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            mt: 1
          }}
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}