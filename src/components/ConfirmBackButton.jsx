import React from "react";
import { IoIosArrowBack } from "react-icons/io";

function ConfirmBackButton({ onClick, title = "New Booking" }) {
  return (
    <div className="back-button">
      <button type="button" onClick={onClick}>
        <IoIosArrowBack size={30} />
      </button>
      <h3>{title}</h3>
    </div>
  );
}

export default ConfirmBackButton;