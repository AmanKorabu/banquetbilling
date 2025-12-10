// components/CustomerInfoSection.js
import React from "react";
import { AiFillEdit } from "react-icons/ai";

const CustomerInfoSection = ({ bookingData, onFieldClick, onAddFunction, refs }) => {
  const { partyNameRef, companyNameRef, functionNameRef } = refs;

  return (
    <>
      {/* Party Name */}
      <div className="customer-info">
        <h3>Party Name</h3>
        <div
          ref={partyNameRef}
          className="party-name clickable"
          onClick={() => onFieldClick("party")}
        >
          <span>{bookingData.customer.partyName || "No Party Selected"}</span>
          <AiFillEdit size={22} color="#847239be" />
        </div>
      </div>

      {/* Company Name */}
      <div className="customer-info">
        <h3>Company Name</h3>
        <div
          ref={companyNameRef}
          className="party-name clickable"
          onClick={() => onFieldClick("company")}
        >
          <span>{bookingData.customer.companyName || "No Company Selected"}</span>
          <AiFillEdit size={22} color="#847239be" />
        </div>
      </div>

      {/* Function Name */}
      <div className="customer-info">
        <h3>Function Name</h3>
        <div
          ref={functionNameRef}
          className="party-name clickable"
          onClick={() => onFieldClick("function")}
        >
          <span>{bookingData.customer.functionName || "No Function Selected"}</span>
          <AiFillEdit size={22} color="#847239be" />
          <span
            className="add-more"
            onClick={(e) => {
              e.stopPropagation();
              onAddFunction();
            }}
          >
            more
          </span>
        </div>
      </div>
    </>
  );
};

export default CustomerInfoSection;
