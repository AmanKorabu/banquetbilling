import React from "react";
import { AiFillEdit } from "react-icons/ai";

function EventDetailsSection({
  bookingData,
  venues,
  onVenueChange,        // ✅ add this
  onServingNameClick,
  onFieldChange,
  refs,
  onKeyDown,
}) {
  const getVenueLabel = (venue) =>
    venue.LedgerName || venue.VenueName || venue.Name || "";

  const getVenueKey = (venue) =>
    venue.LedgerId || venue.VenueId || venue.Id || getVenueLabel(venue);

  return (
    <div className="event-details-container">
      <h1>Event Details</h1>
      <h4>Venue Status</h4>

      <div id="venue">
        <h3>Venue</h3>

        <select
          name="eventDetails.venue"
          value={bookingData.eventDetails.venue || ""}  // ✅ bound to name
          onChange={onVenueChange}                      // ✅ let parent handle it
          ref={refs.venueRef}                           // ✅ ref on select, better for focus/highlight
          required
          onKeyDown={onKeyDown}
        >
          <option value="" hidden>
            Select Venue
          </option>

          {venues.length > 0 ? (
            venues.map((venue) => {
              const label = getVenueLabel(venue);
              return (
                <option key={getVenueKey(venue)} value={label}>
                  {label}
                </option>
              );
            })
          ) : (
            <option disabled>No venues available</option>
          )}
        </select>
      </div>

      <div className="serving">
        <h3>Serving Name</h3>
        <div
          ref={refs.servingNameRef}
          className="serving-name"
          onClick={onServingNameClick}
        >
          <span>{bookingData.eventDetails.servingName || "No Serving Selected"}</span>
          <AiFillEdit color="#847239be" size={22} />
        </div>

        <div className="serving-address">
          <h3>Serving Address</h3>
          <textarea
            name="eventDetails.servingAddress"
            value={bookingData.eventDetails.servingAddress || ""}
            onChange={onFieldChange}
            onKeyDown={onKeyDown}
          />
        </div>
      </div>

      <div className="min-maxppl">
        <div className="min">
          <h3>MIN PEOPLE</h3>
          <input
            type="text"
            name="eventDetails.minPeople"
            value={bookingData.eventDetails.minPeople || ""}
            onChange={onFieldChange}
            ref={refs.minPeopleRef}
            required
            onKeyDown={onKeyDown}
          />
        </div>

        <div className="max">
          <h3>MAX PEOPLE</h3>
          <input
            type="number"
            name="eventDetails.maxPeople"
            value={bookingData.eventDetails.maxPeople || ""}
            onChange={onFieldChange}
            ref={refs.maxPeopleRef}
            required
            onKeyDown={onKeyDown}
          />
        </div>
      </div>
    </div>
  );
}

export default EventDetailsSection;
