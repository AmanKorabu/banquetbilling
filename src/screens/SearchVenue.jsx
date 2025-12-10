import React, { useEffect, useState } from "react";
import { TiArrowBackOutline } from "react-icons/ti";
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { bookingApi } from "../services/bookingApi";

function SearchVenue() {
  const navigate = useNavigate();
  const [venues, setVenues] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openConfirm, setOpenConfirm] = useState(false);

  // 🧠 Fetch venue list from API
  useEffect(() => {
    const fetchVenues = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await bookingApi.getVenues(search);
        console.log("📦 Venue API Response:", response);

        if (Array.isArray(response)) setVenues(response);
        else if (response?.result && Array.isArray(response.result)) setVenues(response.result);
        else setVenues([]);
      } catch (err) {
        console.error("❌ Error fetching venues:", err);
        setError("Failed to fetch venues");
      } finally {
        setLoading(false);
      }
    };

    const timeout = setTimeout(fetchVenues, 400);
    return () => clearTimeout(timeout);
  }, [search]);

  // 🧱 Handle user selecting a venue
  const handleSelect = (venue) => {
    console.log("✅ Selected venue:", venue);

    const venueId = venue.VenueId || venue.id || "";
    const venueName = venue.VenueName || venue.Name || "";

    // ✅ Save to session storage
    sessionStorage.setItem("venueId", venueId);
    sessionStorage.setItem("venueName", venueName);
    sessionStorage.setItem("selectedVenue", JSON.stringify(venue));

    // ✅ Go back to NewBooking with selected venue
    navigate("/new-booking", {
      state: {
        selectedVenue: venue,
        venueData: { venueId, venueName },
      },
    });
  };

  // Go back confirmation
  const handleBackClick = () => setOpenConfirm(true);
  const handleConfirm = () => {
    setOpenConfirm(false);
    navigate("/new-booking");
  };
  const handleCancel = () => setOpenConfirm(false);

  return (
    <>
      <div className="search-header">
        <button type="button" onClick={handleBackClick} className="search-back-btn">
          <TiArrowBackOutline size={24} color="white" />
        </button>
        <h1 className="search-title">Search Venue</h1>
      </div>

      <Dialog open={openConfirm} onClose={handleCancel}>
        <DialogTitle>Go Back?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to go back? Unsaved changes will be lost.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel}>Cancel</Button>
          <Button onClick={handleConfirm} color="error">Yes, Go Back</Button>
        </DialogActions>
      </Dialog>

      <div className="search-container">
        <form onSubmit={(e) => e.preventDefault()}>
          <div className="search-form">
            <input
              type="text"
              placeholder="Search Venue..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              className="search-input"
            />
          </div>
        </form>

        {loading && <p style={{ textAlign: "center" }}>🔍 Searching venues...</p>}
        {error && <p style={{ color: "red", textAlign: "center" }}>❌ {error}</p>}

        <div className="search-table-container">
          <table className="search-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>Venue Name</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {venues.map((venue, index) => (
                <tr key={venue.VenueId || index}>
                  <td>{index + 1}</td>
                  <td>{venue.VenueName || venue.Name}</td>
                  <td>
                    <button
                      onClick={() => handleSelect(venue)}
                      style={{ cursor: "pointer", color: "blue" }}
                    >
                      Select
                    </button>
                  </td>
                </tr>
              ))}
              {venues.length === 0 && !loading && (
                <tr>
                  <td colSpan="3" style={{ textAlign: "center" }}>
                    No venues found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default SearchVenue;
