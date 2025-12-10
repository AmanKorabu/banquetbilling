import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../../public/CalenderView.css';
import useEscapeNavigate from '../hooks/EscapeNavigate';

const localizer = momentLocalizer(moment);


const VENUE_ID = 0;
const STATUS_ID = 0;

// Convert JS Date -> "dd-mm-yyyy" (01-11-2025) for API
const formatDateForApi = (date) => {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
};

// Parse "03-11-2025" + "03:18 pm" -> JS Date
const parseApiDateTime = (eventDate, timeStr) => {
  if (!eventDate) return null;

  const [dayStr, monthStr, yearStr] = eventDate.split('-');
  const day = Number(dayStr);
  const monthIndex = Number(monthStr) - 1;
  const year = Number(yearStr);

  let hour = 0;
  let minute = 0;

  if (timeStr && timeStr.trim()) {
    const [timePart, ampmRaw] = timeStr.trim().split(' ');
    if (timePart) {
      const [hourStr, minuteStr] = timePart.split(':');
      hour = Number(hourStr) || 0;
      minute = Number(minuteStr) || 0;

      const ampm = (ampmRaw || '').toLowerCase();
      if (ampm === 'pm' && hour !== 12) hour += 12;
      if (ampm === 'am' && hour === 12) hour = 0;
    }
  }

  const d = new Date(year, monthIndex, day, hour, minute);
  if (isNaN(d.getTime())) return null;
  return d;
};

// Map API booking to Calendar event object for React Big Calendar
const mapApiBookingToEvent = (booking) => {
  if (!booking.EventDate) return null;

  const start =
    parseApiDateTime(booking.EventDate, booking.TimeFrom) ||
    parseApiDateTime(booking.EventDate, '12:00 am');
  if (!start) return null;

  let end =
    parseApiDateTime(booking.EventDate, booking.TimeTo) || start;

  if (booking.EventEndDate) {
    end =
      parseApiDateTime(booking.EventEndDate, booking.TimeTo) ||
      end;
  }

  const partyName = booking.PartyName || '';
  let priority = 'low';
  if (partyName.includes('CONFIRMED')) priority = 'high';
  else if (partyName.includes('WAITLISTED')) priority = 'medium';

  return {
    id: booking.QuotationEventId,
    title: partyName || 'Banquet Event',
    start,
    end,
    location: booking.VanueName || '',
    attendees: [],
    category: 'banquet',
    priority,
    hasReminder: false,
    description: booking.EventName || '',
    raw: booking,
  };
};

// Custom Event Component
const CustomEvent = ({ event }) => {
  return (
    <div className={`rbc-custom-event rbc-custom-event--${event.priority}`}>
      <div className="rbc-custom-event-title">{event.title}</div>
      <div className="rbc-custom-event-time">
        {moment(event.start).format('HH:mm')} -{' '}
        {moment(event.end).format('HH:mm')}
      </div>
      {event.location && (
        <div className="rbc-custom-event-location">
          {event.location}
        </div>
      )}
    </div>
  );
};

// Custom Toolbar
const CustomToolbar = (props) => {
  const { label, onNavigate, onView, view } = props;

  const customLabel = label;

  return (
    <div className="rbc-custom-toolbar">
      <div className="rbc-custom-toolbar-left">
        <div className="rbc-custom-toolbar-nav">
          <button
            className="rbc-custom-toolbar-btn"
            onClick={() => onNavigate('PREV')}
          >
            ‹
          </button>
          <button
            className="rbc-custom-toolbar-btn rbc-custom-toolbar-today"
            onClick={() => onNavigate('TODAY')}
          >
            Today
          </button>
          <button
            className="rbc-custom-toolbar-btn"
            onClick={() => onNavigate('NEXT')}
          >
            ›
          </button>
        </div>
        <h2 className="rbc-custom-toolbar-label">{customLabel}</h2>
      </div>

      <div className="rbc-custom-toolbar-right">
        <div className="rbc-custom-toolbar-views">
          {['month', 'week', 'day', 'agenda'].map((viewType) => (
            <button
              key={viewType}
              className={`rbc-custom-toolbar-view-btn ${view === viewType ? 'rbc-custom-toolbar-view-btn--active' : ''
                }`}
              onClick={() => onView(viewType)}
            >
              {viewType.charAt(0).toUpperCase() + viewType.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Pie Chart Component
const PieChart = ({ data, size = 80 }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let accumulatedPercentage = 0;

  return (
    <div className="pie-chart" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {data.map((item, index) => {
          const percentage = total > 0 ? (item.value / total) * 100 : 0;
          const circumference = 2 * Math.PI * (size / 2 - 5);
          const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
          const strokeDashoffset = (-accumulatedPercentage * circumference) / 100;

          accumulatedPercentage += percentage;

          return (
            <circle
              key={index}
              cx={size / 2}
              cy={size / 2}
              r={size / 2 - 5}
              fill="none"
              stroke={item.color}
              strokeWidth="10"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              className="pie-segment"
            />
          );
        })}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 15}
          fill="white"
        />
        <text
          x={size / 2}
          y={size / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          className="pie-chart-total"
        >
          {total}
        </text>
      </svg>
    </div>
  );
};

// Status Card Component
const StatusCard = ({ title, count, color, percentage, isActive, onClick }) => {
  return (
    <div
      className={`status-card ${isActive ? 'status-card--active' : ''}`}
      onClick={onClick}
    >
      <div className="status-card-chart">
        <div
          className="status-card-progress"
          style={{
            background: `conic-gradient(${color} 0% ${percentage}%, #f3f4f6 ${percentage}% 100%)`,
          }}
        >
          <div className="status-card-inner">
            <span className="status-card-count">{count}</span>
          </div>
        </div>
      </div>
      <div className="status-card-content">
        <span className="status-card-title">{title}</span>
        <span className="status-card-percentage">{percentage}%</span>
      </div>
    </div>
  );
};

/**
 * Formats that change ONLY the Agenda view.
 */
const formats = {
  agendaDateFormat: (date, culture, loc) =>
    loc.format(date, 'DD/MM/YYYY', culture),

  agendaTimeRangeFormat: ({ start, end }, culture, loc) =>
    `${loc.format(start, 'hh:mm a', culture)} – ${loc.format(
      end,
      'hh:mm a',
      culture
    )}`,

  agendaHeaderFormat: ({ start, end }, culture, loc) =>
    `${loc.format(start, 'DD/MM/YYYY', culture)} – ${loc.format(
      end,
      'DD/MM/YYYY',
      culture
    )}`,
};

const CalendarView = () => {
  const navigate = useNavigate();
  useEscapeNavigate('/dashboard')
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month');
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [hotelId, setHotelId] = useState();
  const [activeStatus, setActiveStatus] = useState('all');

  // For empty-date popup
  const [emptyDateInfo, setEmptyDateInfo] = useState(null); // { date }
  const [isEmptyDateModalOpen, setIsEmptyDateModalOpen] = useState(false);

  // Read hotel_id from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('hotel_id');
      if (stored) {
        setHotelId(stored);
      }
    } catch (e) {
      console.warn('Could not read hotel_id from localStorage', e);
    }
  }, []);

  // Fetch bookings from API when month / hotel changes
  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        if (!hotelId) {
          setEvents([]);
          setFilteredEvents([]);
          setIsLoading(false);
          return;
        }

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const fromDate = new Date(year, month, 1);
        const toDate = new Date(year, month + 1, 0);

        const fromdateStr = formatDateForApi(fromDate);
        const todateStr = formatDateForApi(toDate);

        const url = `/banquetapi/get_booking_blocks3.php?hotel_id=${hotelId}&fromdate=${fromdateStr}&todate=${todateStr}&venue_id=${VENUE_ID}&status_id=${STATUS_ID}`;

        const res = await fetch(url);
        let data;
        try {
          data = await res.json();
        } catch (jsonErr) {
          console.error('Invalid JSON from API', jsonErr);
          data = { result2: [] };
        }

        const bookings = Array.isArray(data.result2) ? data.result2 : [];
        const apiEvents = bookings.map(mapApiBookingToEvent).filter(Boolean);

        setEvents(apiEvents);
        setFilteredEvents(apiEvents);
      } catch (error) {
        console.error('Error fetching events from API:', error);
        setEvents([]);
        setFilteredEvents([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [currentDate, hotelId]);

  // Search filter
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredEvents(events);
      return;
    }

    const lower = searchQuery.toLowerCase();
    const filtered = events.filter((event) => {
      return (
        (event.title || '').toLowerCase().includes(lower) ||
        (event.location || '').toLowerCase().includes(lower) ||
        (event.description || '').toLowerCase().includes(lower)
      );
    });

    setFilteredEvents(filtered);
  }, [searchQuery, events]);

  // Status filter
  useEffect(() => {
    if (activeStatus === 'all') {
      setFilteredEvents(events);
    } else {
      const filtered = events.filter((event) => {
        if (activeStatus === 'confirmed') {
          return (
            event.priority === 'high' ||
            (event.title || '').includes('CONFIRMED')
          );
        } else if (activeStatus === 'waitlisted') {
          return (
            event.priority === 'medium' ||
            (event.title || '').includes('WAITLISTED')
          );
        } else if (activeStatus === 'tentative') {
          return !(
            event.priority === 'high' ||
            event.priority === 'medium' ||
            (event.title || '').includes('CONFIRMED') ||
            (event.title || '').includes('WAITLISTED')
          );
        }
        return true;
      });
      setFilteredEvents(filtered);
    }
  }, [activeStatus, events]);

  // Calendar handlers
  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
  };

  const handleSelectSlot = (slotInfo) => {
    const { start } = slotInfo;

    // Only react to day clicks in Month view (optional)
    // if (view !== 'month') return;

    const clickedDay = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate()
    ).getTime();

    const hasEvents = filteredEvents.some((event) => {
      const eventDay = new Date(
        event.start.getFullYear(),
        event.start.getMonth(),
        event.start.getDate()
      ).getTime();
      return eventDay === clickedDay;
    });

    if (!hasEvents) {
      setEmptyDateInfo({ date: start });
      setIsEmptyDateModalOpen(true);
    }
  };

  const handleNavigate = (newDate) => {
    setCurrentDate(newDate);
  };

  const handleView = (newView) => {
    setView(newView);
  };

  // Event style getter for different priorities
  const eventStyleGetter = (event) => {
    let backgroundColor, borderColor;

    switch (event.priority) {
      case 'high':
        backgroundColor = '#dcfce7';
        borderColor = '#16a34a';
        break;
      case 'medium':
        backgroundColor = '#fef9c3';
        borderColor = '#eab308';
        break;
      default:
        backgroundColor = '#e5e7eb';
        borderColor = '#6b7280';
    }

    return {
      style: {
        backgroundColor,
        borderLeft: `4px solid ${borderColor}`,
        borderRadius: '6px',
        color: '#111827',
        border: 'none',
        fontSize: '12px',
        padding: '4px 6px',
      },
    };
  };

  // Stats
  const totalEvents = events.length;
  const confirmedEvents = events.filter(
    (e) => e.priority === 'high' || (e.title || '').includes('CONFIRMED')
  ).length;
  const waitlistedEvents = events.filter(
    (e) => e.priority === 'medium' || (e.title || '').includes('WAITLISTED')
  ).length;
  const tentativeEvents = totalEvents - confirmedEvents - waitlistedEvents;

  const statusData = [
    {
      id: 'all',
      title: 'Total',
      count: totalEvents,
      color: '#2563eb',
      percentage: 100,
    },
    {
      id: 'confirmed',
      title: 'Confirmed',
      count: confirmedEvents,
      color: '#16a34a',
      percentage:
        totalEvents > 0
          ? Math.round((confirmedEvents / totalEvents) * 100)
          : 0,
    },
    {
      id: 'waitlisted',
      title: 'Waitlisted',
      count: waitlistedEvents,
      color: '#eab308',
      percentage:
        totalEvents > 0
          ? Math.round((waitlistedEvents / totalEvents) * 100)
          : 0,
    },
    {
      id: 'tentative',
      title: 'Tentative',
      count: tentativeEvents,
      color: '#64748b',
      percentage:
        totalEvents > 0
          ? Math.round((tentativeEvents / totalEvents) * 100)
          : 0,
    },
  ];

  const pieChartData = [
    { value: confirmedEvents, color: '#16a34a' },
    { value: waitlistedEvents, color: '#eab308' },
    { value: tentativeEvents, color: '#64748b' },
  ];

  const venueStats = events.reduce((acc, e) => {
    const v = e.location || 'Unknown venue';
    acc[v] = (acc[v] || 0) + 1;
    return acc;
  }, {});



  const handleStatusFilter = (statusId) => {
    setActiveStatus(statusId);
  };

  // Navigate to NewBooking with the clicked empty date
  const handleCreateFromEmptyDate = () => {
    if (!emptyDateInfo?.date) return;
    setIsEmptyDateModalOpen(false);

    navigate('/new-booking', {
      state: {
        fromCalendarDate: emptyDateInfo.date.toISOString(),
      },
    });
  };

  return (
    <div className="calendar-root">
      <Header />

      {/* Page header / summary */}
      <div className="calendar-page-header">
        <div className="calendar-page-summary">
          <div className="summary-pill">
            <span className="summary-label">Total</span>
            <span className="summary-value">{totalEvents}</span>
          </div>
          <div className="summary-pill">
            <span className="summary-label">Confirmed</span>
            <span className="summary-value summary-value--confirmed">
              {confirmedEvents}
            </span>
          </div>
        </div>
      </div>

      {/* Controls bar */}
      <div className="calendar-controls-bar">
        <div className="calendar-controls-left">
          <div className="calendar-search">
            <input
              type="text"
              className="calendar-search-input"
              placeholder="Search bookings, venues, parties…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="calendar-controls-right">


          <button
            className="calendar-mobile-menu-btn"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            aria-label="Toggle sidebar"
          >
            ☰
          </button>
        </div>
      </div>

      <main className="calendar-main">
        {isLoading ? (
          <div className="calendar-loading">
            <div className="calendar-loading-spinner" />
            <p className="calendar-loading-text">Loading your bookings…</p>
          </div>
        ) : (
          <>
            {isSidebarOpen && (
              <div
                className="calendar-mobile-overlay"
                onClick={() => setIsSidebarOpen(false)}
              />
            )}

            <div className="calendar-content">
              {/* Sidebar */}
              <aside
                className={
                  'calendar-sidebar' +
                  (isSidebarOpen ? ' calendar-sidebar--mobile-open' : '')
                }
              >
                <div className="calendar-sidebar-inner">
                  <div className="calendar-sidebar-header">
                    <h3>Dashboard</h3>
                    <button
                      className="calendar-sidebar-close-btn"
                      onClick={() => setIsSidebarOpen(false)}
                    >
                      ×
                    </button>
                  </div>

                  <section className="calendar-sidebar-section">
                    <h4 className="calendar-sidebar-section-title">
                      Booking Status
                    </h4>
                    <div className="status-pie-chart-container">
                      <PieChart data={pieChartData} size={120} />
                      <div className="pie-chart-legend">
                        <div className="pie-legend-item">
                          <span
                            className="pie-legend-color"
                            style={{ backgroundColor: '#16a34a' }}
                          />
                          <span className="pie-legend-label">Confirmed</span>
                          <span className="pie-legend-value">
                            {confirmedEvents}
                          </span>
                        </div>
                        <div className="pie-legend-item">
                          <span
                            className="pie-legend-color"
                            style={{ backgroundColor: '#eab308' }}
                          />
                          <span className="pie-legend-label">Waitlisted</span>
                          <span className="pie-legend-value">
                            {waitlistedEvents}
                          </span>
                        </div>
                        <div className="pie-legend-item">
                          <span
                            className="pie-legend-color"
                            style={{ backgroundColor: '#64748b' }}
                          />
                          <span className="pie-legend-label">Tentative</span>
                          <span className="pie-legend-value">
                            {tentativeEvents}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="status-cards-grid">
                      {statusData.map((status) => (
                        <StatusCard
                          key={status.id}
                          title={status.title}
                          count={status.count}
                          color={status.color}
                          percentage={status.percentage}
                          isActive={activeStatus === status.id}
                          onClick={() => handleStatusFilter(status.id)}
                        />
                      ))}
                    </div>
                  </section>

                  <section className="calendar-sidebar-section">
                    <h4 className="calendar-sidebar-section-title">
                      Venues this month
                    </h4>
                    <div className="calendar-categories-list">
                      {Object.keys(venueStats).length > 0 ? (
                        Object.entries(venueStats).map(([venue, count]) => (
                          <div key={venue} className="calendar-category">
                            <span className="calendar-category-name">
                              {venue}
                            </span>
                            <span className="calendar-category-count">
                              ({count})
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="calendar-category">
                          <span className="calendar-category-name">
                            No bookings yet
                          </span>
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              </aside>

              {/* Main calendar pane */}
              <section className="calendar-main-pane">
                <div className="calendar-card">
                  <Calendar
                    localizer={localizer}
                    events={filteredEvents}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: 600 }}
                    onSelectEvent={handleSelectEvent}
                    onSelectSlot={handleSelectSlot}
                    onNavigate={handleNavigate}
                    onView={handleView}
                    view={view}
                    date={currentDate}
                    selectable
                    popup
                    eventPropGetter={eventStyleGetter}
                    components={{
                      event: CustomEvent,
                      toolbar: CustomToolbar,
                    }}
                    formats={formats}
                    messages={{
                      next: 'Next',
                      previous: 'Prev',
                      today: 'Today',
                      month: 'Month',
                      week: 'Week',
                      day: 'Day',
                      agenda: 'Agenda',
                      date: 'Date',
                      time: 'Time',
                      event: 'Event',
                      noEventsInRange: 'No bookings in this date range',
                    }}
                  />
                </div>
              </section>
            </div>
          </>
        )}

        {/* Event details modal */}
        {selectedEvent && (
          <div
            className="calendar-modal-overlay"
            onClick={() => setSelectedEvent(null)}
          >
            <div
              className="calendar-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="calendar-modal-header">
                <h3 className="calendar-modal-title">
                  {selectedEvent.title}
                </h3>
                <button
                  className="calendar-modal-close-btn"
                  onClick={() => setSelectedEvent(null)}
                >
                  ×
                </button>
              </div>
              <div className="calendar-modal-body">
                <div className="calendar-modal-row">
                  <span className="calendar-modal-label">
                    Date &amp; time
                  </span>
                  <span className="calendar-modal-value">
                    {moment(selectedEvent.start).format('ddd, DD/MM/YYYY')} •{' '}
                    {moment(selectedEvent.start).format('HH:mm')} –{' '}
                    {moment(selectedEvent.end).format('HH:mm')}
                  </span>
                </div>
                <div className="calendar-modal-row">
                  <span className="calendar-modal-label">Venue</span>
                  <span className="calendar-modal-value">
                    {selectedEvent.location}
                  </span>
                </div>
                {selectedEvent.description && (
                  <div className="calendar-modal-row">
                    <span className="calendar-modal-label">
                      Description
                    </span>
                    <span className="calendar-modal-value">
                      {selectedEvent.description}
                    </span>
                  </div>
                )}
                <div className="calendar-modal-row">
                  <span className="calendar-modal-label">Priority</span>
                  <span className="calendar-modal-value">
                    <span
                      className="calendar-modal-priority-tag"
                      data-priority={selectedEvent.priority}
                    >
                      {selectedEvent.priority}
                    </span>
                  </span>
                </div>
              </div>
              <div className="calendar-modal-actions">
                <button className="calendar-modal-edit-btn">
                  Edit booking
                </button>
                <button className="calendar-modal-delete-btn">
                  Delete
                </button>
                <button
                  className="calendar-modal-secondary-btn"
                  onClick={() => setSelectedEvent(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty date popup */}
        {isEmptyDateModalOpen && emptyDateInfo && (
          <div
            className="calendar-modal-overlay"
            onClick={() => setIsEmptyDateModalOpen(false)}
          >
            <div
              className="calendar-small-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="calendar-modal-header">
                <h3 className="calendar-modal-title">
                  No bookings on this date
                </h3>
                <button
                  className="calendar-modal-close-btn"
                  onClick={() => setIsEmptyDateModalOpen(false)}
                >
                  ×
                </button>
              </div>
              <div className="calendar-modal-body">
                <p className="calendar-empty-date-text">
                  There are no bookings on{' '}
                  {moment(emptyDateInfo.date).format('ddd, DD/MM/YYYY')}.
                  <br />
                  Do you want to create a new booking for this date?
                </p>
              </div>
              <div className="calendar-modal-actions">
                <button
                  className="calendar-modal-edit-btn"
                  onClick={handleCreateFromEmptyDate}
                >
                  Yes, create booking
                </button>
                <button
                  className="calendar-modal-secondary-btn"
                  onClick={() => setIsEmptyDateModalOpen(false)}
                >
                  No, maybe later
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CalendarView; 