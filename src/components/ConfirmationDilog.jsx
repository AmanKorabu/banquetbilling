import React from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
} from "@mui/material";

function ConfirmationDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Yes",
  cancelText = "Cancel",
  confirmColor = "error",
  showCustomButtons = false,
  customButtons = [],
}) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        {showCustomButtons ? (
          customButtons.map((button, index) => (
            <Button
              key={index}
              onClick={button.onClick}
              color={button.color || "primary"}
              variant={button.variant || "contained"}
              autoFocus={index === 0}
            >
              {button.text}
            </Button>
          ))
        ) : (
          <>
            <Button onClick={onClose} color="primary">
              {cancelText}
            </Button>
            <Button onClick={onConfirm} color={confirmColor} autoFocus variant="contained">
              {confirmText}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default ConfirmationDialog;