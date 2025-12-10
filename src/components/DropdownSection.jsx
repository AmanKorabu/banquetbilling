// components/DropdownSection.jsx
import React from "react";

function DropdownSection({
  title,
  name,
  icon,
  value,
  onChange,
  options = [], // Provide default empty array
  optionKey = "id",
  optionValue = "name",
  optionLabel = "name",
  required = false,
  ref,
  onKeyDown,
  loading = false, // Add loading prop
}) {
  return (
    <div id={name} className="dropdown-section">
      <h3 style={{ alignItems: "center", display: "flex", gap: "8px" }}>{icon} {title}</h3>
      <select
        name={name}
        value={value}
        onChange={onChange}
        ref={ref}
        required={required}
        onKeyDown={onKeyDown}
        disabled={loading}
        className="colored-select"
      >
        <option hidden>
          {loading ? `Loading ${title}...` : `Select ${title}`}
        </option>
        {options.map((option) => (
          <option key={option[optionKey]} value={option[optionValue]}>
            {option[optionLabel]}
          </option>
        ))}
      </select>
      {loading && <div className="loading-spinner">Loading...</div>}
    </div>
  );
}

export default DropdownSection;