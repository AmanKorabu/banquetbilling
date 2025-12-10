import React from "react";
import { DatePicker, TimePicker } from "@mui/x-date-pickers";

function DateTimeSection({ 
  bookingData, 
  onDateChange, 
  onKeyDown 
}) {
  return (
    <>
      {/* Only Entry Date & Time */}
      <div className="datetime">
        <DatePicker
          label="Entry Date"
          value={bookingData.entryDate}
          onChange={(v) => onDateChange("entryDate", v)}
          format="DD-MM-YYYY"
          onKeyDown={onKeyDown}
          disableMaskedInput
           readOnly
        />
        <TimePicker
          label="Entry Time"
          value={bookingData.entryTime}
          onChange={(v) => onDateChange("entryTime", v)}
          ampm
          onKeyDown={onKeyDown}
          disableMaskedInput
          readOnly
        />
      </div>
      
    </>
  );
}

export default DateTimeSection;