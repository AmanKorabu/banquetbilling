import { IoIosAddCircleOutline } from "react-icons/io";
import { LiaFileInvoiceSolid } from "react-icons/lia";
import { CiCalendar } from "react-icons/ci";
import { GiReceiveMoney } from "react-icons/gi";
import { PiCalendarStar } from "react-icons/pi";
import { PiWalletLight } from "react-icons/pi";
import { useNavigate } from 'react-router-dom';
import { IoNewspaperOutline, IoChevronForward } from "react-icons/io5";
import CountUp from 'react-countup';
import Header from './Header';
import { useEffect, useRef, useState } from "react";
import { BellIcon } from "lucide-react";
import { message } from "antd";

function MainDashboard() {
  const navigate = useNavigate();
  const [notificationCounts, setNotificationCounts] = useState({
    todayEvents: 0,
    upcomingEvents: 0
  });
  const prevUpcomingRef = useRef(0);
  const prevAmountRef = useRef(null);
  const hasNotifiedRef = useRef(false); // Track if notification was shown in current session
  const isMountedRef = useRef(false); // Prevent initial notification

  const [loading, setLoading] = useState(true);
  const hotel_id = localStorage.getItem('hotel_id');
  
  // Fetch notification counts from API
  const fetchNotificationCounts = async () => {
    try {
      const response = await fetch(
        `/banquetapi/get_notification_counts.php?hotel_id=${hotel_id}`
      );
      const data = await response.json();

      if (data.result && data.result.length > 0) {
        const counts = data.result[0];
        const upcoming = parseInt(counts.next_15_days_events) || 0;

        // Get the last known count from localStorage
        const lastKnownCount = parseInt(localStorage.getItem('last_upcoming_count') || '0');
        const notificationTimestamp = parseInt(localStorage.getItem('notification_timestamp') || '0');
        const currentTime = Date.now();

        // SMART NOTIFICATION LOGIC:
        // 1. Only show if count increased AND we haven't notified for this count yet
        // 2. Check if notification was shown in the last 5 seconds (cooldown)
        // 3. Store the count when we notify
        if (upcoming > lastKnownCount) {
          // Check if we already notified for this count
          const lastNotifiedCount = parseInt(localStorage.getItem('last_notified_count') || '0');
          
          // Only notify if:
          // - We haven't notified for this specific count yet, AND
          // - It's been at least 5 seconds since last notification, OR this is a different count
          if (upcoming !== lastNotifiedCount && 
              (currentTime - notificationTimestamp > 5000 || upcoming > lastNotifiedCount)) {
            
            if (isMountedRef.current) { // Don't show notification on initial mount
              message.success("🔔 New Upcoming Event Added!");
              hasNotifiedRef.current = true;
              
              // Store the count we just notified for
              localStorage.setItem('last_notified_count', upcoming.toString());
              localStorage.setItem('notification_timestamp', currentTime.toString());
            }
          }
        } else if (upcoming < lastKnownCount) {
          // If count decreased, reset notification flag
          hasNotifiedRef.current = false;
        }

        // Always update the last known count
        localStorage.setItem('last_upcoming_count', upcoming.toString());
        prevUpcomingRef.current = upcoming;

        setNotificationCounts({
          todayEvents: parseInt(counts.today_events) || 0,
          upcomingEvents: upcoming
        });
      }
    } catch (error) {
      console.error("Error fetching notification counts", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Set mounted flag after initial render
    const timer = setTimeout(() => {
      isMountedRef.current = true;
    }, 1000);

    // First fetch
    fetchNotificationCounts();

    // 🔁 fetch every 5 seconds instead of 2 seconds to reduce frequency
    const interval = setInterval(() => {
      fetchNotificationCounts();
    }, 5000);

    // Cleanup
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === 'F1') {
        event.preventDefault();
        navigate('/select-dashboard');
      }
      if (event.key === 'F2') {
        event.preventDefault();
        navigate('/bill-list');
      }
      if (event.key === 'F3') {
        event.preventDefault();
        navigate('/calender-view');
      }
      if (event.key === 'F4') {
        event.preventDefault();
        navigate('/unsettled-bill');
      }
      if (event.key === '1') {
        event.preventDefault();
        navigate('/enquiry-dashboard');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [navigate]);

  const allEvents = [
    {
      id: 1,
      name: "Make Booking",
      img: <IoIosAddCircleOutline size={24} color='white' />,
      iconBg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderLeft: '4px solid #667eea',
      navigate: '/select-dashboard',
      stats: "New Event",
      shortcut: "F1"
    },
    {
      id: 2,
      name: "Bills",
      img: <LiaFileInvoiceSolid size={24} color='white' />,
      iconBg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      borderLeft: '4px solid #f5576c',
      navigate: '/bill-list',
      stats: "Manage",
      shortcut: "F2"
    },
    {
      id: 3,
      name: "Calendar View",
      img: <CiCalendar size={24} color='white' />,
      iconBg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      borderLeft: '4px solid #4facfe',
      navigate: '/calender-view',
      stats: "View All",
      shortcut: "F3"
    },
    {
      id: 4,
      name: "Unsettled Bills",
      img: <GiReceiveMoney size={24} color='white' />,
      iconBg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      borderLeft: '4px solid #43e97b',
      navigate: '/unsettled-bill',
      stats: "Pending",
      shortcut: "F4"
    },
    {
      id: 5,
      name: "Upcoming Events",
      img: <PiCalendarStar size={24} color='#f5bc20ff' />,
      iconBg: 'linear-gradient(135deg, #ffff9aff 0%, #f2c782ff 100%)',
      borderLeft: '4px solid #ffe925ff',
      navigate: '/upcoming-events',
      stats: "Schedule",
      shortcut: "F5",
      count: notificationCounts.upcomingEvents
    },
    {
      id: 6,
      name: "Balance Amount",
      img: <PiWalletLight size={24} color='white' />,
      iconBg: 'linear-gradient(135deg, #91ebe7ff 0%, #fbaac4ff 100%)',
      borderLeft: '4px solid #80e6e1ff',
      amount: 100000,
      navigate: '/upcoming-events',
      stats: "Available",
      shortcut: null
    },
  ];

  const handlePage = (event) => {
    if (event && event.navigate) {
      navigate(event.navigate);
    }
  };

  const GoToEnq = () => {
    navigate('/enquiry-dashboard');
  };

  const formatIndianCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <>
      <Header />

      {/* Today Events Count with SUPER BLINK ANIMATION - Moved to top */}
      <div className="today-events-header">
        <div className="today-container">
          <div className="today-pulse-ring"></div>
          <div className="today-pulse-ring delay-1"></div>
          <div className="today-pulse-ring delay-2"></div>

          <span className="today-text">
            <svg className="today-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Today's Events
          </span>
          <span className="today-count-badge">
            {loading ? (
              <span className="loading-dots">
                <span className="dot">.</span>
                <span className="dot">.</span>
                <span className="dot">.</span>
              </span>
            ) : (
              <CountUp
                start={0}
                end={notificationCounts.todayEvents}
                duration={2.5}
                onEnd={() => {
                  // Trigger confetti effect when count completes
                  if (notificationCounts.todayEvents > 0) {
                    const event = new CustomEvent('todayCountComplete', {
                      detail: { count: notificationCounts.todayEvents }
                    });
                    window.dispatchEvent(event);
                  }
                }}
              />
            )}
          </span>
          <div className="today-sparkle"></div>
          <div className="today-sparkle delay-1"></div>
          <div className="today-sparkle delay-2"></div>
        </div>
      </div>

      {/* Compact Enquiry Section */}
      <div className="enquiry-section">
        <div className="enquiry-container">
          <div className="enquiry-card" onClick={GoToEnq}>
            <div className="enquiry-background-glow"></div>
            <div className="enquiry-content">
              <div className="enquiry-icon-main">
                <div className="icon-orb">
                  <IoNewspaperOutline size={18} color='#fff' />
                </div>
                <div className="icon-pulse"></div>
              </div>

              <div className="enquiry-text-content">
                <div className="enquiry-badge desktop-only">Quick Access press 1</div>
                <div className="enquiry-badge mobile-only">Quick Access</div>
                <h3 className="enquiry-title">Enquiry Dashboard</h3>
                <p className="enquiry-subtitle">Manage customer inquiries & track leads</p>
              </div>

              <div className="enquiry-action">
                <span className="enquiry-cta desktop-only">View</span>
                <span className="enquiry-cta mobile-only">View</span>
                <div className="enquiry-arrow">
                  <IoChevronForward size={14} color='#fff' />
                </div>
              </div>
            </div>

            <div className="enquiry-sparkle"></div>
            <div className="enquiry-hover-effect"></div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="dashboard-container">
        <div className="metrics-grid">
          {allEvents.map(event => (
            <div
              key={event.id}
              className="metric-card"
              onClick={() => handlePage(event)}
              style={{ borderLeft: event.borderLeft }}
            >
              <div className="metric-content">
                <div className="metric-icon-container">
                  <div
                    className="metric-icon"
                    style={{ background: event.iconBg }}
                  >
                    {event.img}
                  </div>
                </div>

                <div className="metric-info">
                  <h3 className="metric-name">{event.name}</h3>
                  <div className="metric-stats">
                    {event.amount ? (
                      <span className="metric-amount">
                        {prevAmountRef.current === null ? (
                          <CountUp
                            start={0}
                            end={event.amount}
                            duration={1.2}
                            formattingFn={formatIndianCurrency}
                            onEnd={() => {
                              prevAmountRef.current = event.amount;
                            }}
                          />
                        ) : (
                          <span>{formatIndianCurrency(event.amount)}</span>
                        )}

                      </span>
                    ) : (
                      <div className="metric-label-container">
                        <span className="metric-label">{event.stats}</span>
                        {event.shortcut && (
                          <>
                            <span className="metric-shortcut desktop-only"> {event.shortcut}</span>
                            <span className="metric-shortcut mobile-only"></span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="metric-arrow">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>

                {event.count !== undefined && event.count > 0 && (
                  <div className="bell-shine">
                    <div className="bell-icon-container">
                      <BellIcon size={16} />
                      <div className="notification-count">
                        {loading ? (
                          <span>...</span>
                        ) : (
                          <CountUp
                            duration={2}
                            end={event.count}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>


      <style>{`
  /* =========================================
    SUPER BLINKING TODAY EVENTS COUNT
  ========================================= */
  .today-events-header {
    position: relative;

    width: 100%;
    padding: 12px 16px;
    display: flex;
    justify-content: center;
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.1) 100%);
    border-bottom: 1px solid rgba(16, 185, 129, 0.1);
    margin-bottom: 10px;
  }

  .today-container {
    display: flex;
    align-items: center;
    gap: 15px;
    background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%);
    padding: 12px 24px;
    border-radius: 50px;
    box-shadow: 
      0 10px 25px rgba(16, 185, 129, 0.15),
      0 0 0 1px rgba(16, 185, 129, 0.2),
      0 0 30px rgba(16, 185, 129, 0.3);
    position: relative;
    overflow: visible;
    backdrop-filter: blur(10px);
    border: 2px solid #10b981;
    transform: translateY(0);
    animation: float 3s ease-in-out infinite;
    z-index: 10;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-5px); }
  }

  .today-text {
    font-size: 18px;
    font-weight: 800;
    color: #047857;
    display: flex;
    align-items: center;
    gap: 10px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    letter-spacing: 0.5px;
    position: relative;
    z-index: 2;
  }

  .today-icon {
    width: 22px;
    height: 22px;
    color: #10b981;
    filter: drop-shadow(0 0 5px rgba(16, 185, 129, 0.5));
  }

  .today-count-badge {
    background: linear-gradient(135deg, #10b981 0%, #059669 30%, #047857 100%);
    color: #ffffff;
    font-size: 28px;
    font-weight: 900;
    min-width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    position: relative;
    animation: super-blink 2s ease-in-out infinite, heartbeat 1.5s ease-in-out infinite;
    border: 4px solid #ffffff;
    z-index: 2;
    box-shadow: 
      0 0 40px rgba(16, 185, 129, 0.8),
      0 0 80px rgba(16, 185, 129, 0.6),
      0 0 120px rgba(16, 185, 129, 0.4),
      inset 0 0 20px rgba(255, 255, 255, 0.5);
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    font-family: 'Arial Black', 'Segoe UI', sans-serif;
  }

  /* SUPER BLINK ANIMATION */
  @keyframes super-blink {
    0%, 100% {
      box-shadow: 
        0 0 40px rgba(16, 185, 129, 0.8),
        0 0 80px rgba(16, 185, 129, 0.6),
        0 0 120px rgba(16, 185, 129, 0.4),
        inset 0 0 20px rgba(255, 255, 255, 0.5);
      transform: scale(1);
      background: linear-gradient(135deg, #10b981 0%, #059669 30%, #047857 100%);
    }
    25% {
      box-shadow: 
        0 0 60px rgba(16, 185, 129, 1),
        0 0 100px rgba(16, 185, 129, 0.8),
        0 0 140px rgba(16, 185, 129, 0.6),
        inset 0 0 30px rgba(255, 255, 255, 0.7);
      transform: scale(1.1);
      background: linear-gradient(135deg, #34d399 0%, #10b981 30%, #059669 100%);
    }
    50% {
      box-shadow: 
        0 0 30px rgba(16, 185, 129, 0.6),
        0 0 60px rgba(16, 185, 129, 0.4),
        0 0 90px rgba(16, 185, 129, 0.2),
        inset 0 0 15px rgba(255, 255, 255, 0.4);
      transform: scale(0.95);
      background: linear-gradient(135deg, #059669 0%, #047857 30%, #065f46 100%);
    }
    75% {
      box-shadow: 
        0 0 50px rgba(16, 185, 129, 0.9),
        0 0 90px rgba(16, 185, 129, 0.7),
        0 0 130px rgba(16, 185, 129, 0.5),
        inset 0 0 25px rgba(255, 255, 255, 0.6);
      transform: scale(1.05);
      background: linear-gradient(135deg, #10b981 0%, #059669 30%, #047857 100%);
    }
  }

  /* Heartbeat effect */
  @keyframes heartbeat {
    0%, 100% { transform: scale(1); }
    25% { transform: scale(1.08); }
    50% { transform: scale(1.05); }
    75% { transform: scale(1.03); }
  }

  /* Pulsing rings */
  .today-pulse-ring {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100px;
    height: 100px;
    border: 3px solid rgba(16, 185, 129, 0.3);
    border-radius: 50%;
    animation: pulse-ring 3s cubic-bezier(0.215, 0.610, 0.355, 1) infinite;
    z-index: 1;
  }

  .today-pulse-ring.delay-1 {
    animation-delay: 0.5s;
    border-color: rgba(16, 185, 129, 0.2);
  }

  .today-pulse-ring.delay-2 {
    animation-delay: 1s;
    border-color: rgba(16, 185, 129, 0.1);
  }

  @keyframes pulse-ring {
    0% {
      width: 80px;
      height: 80px;
      opacity: 1;
    }
    100% {
      width: 150px;
      height: 150px;
      opacity: 0;
    }
  }

  /* Sparkle effects */
  .today-sparkle {
    position: absolute;
    width: 6px;
    height: 6px;
    background: #ffffff;
    border-radius: 50%;
    filter: blur(1px);
    animation: sparkle 2s ease-in-out infinite;
    box-shadow: 0 0 10px #ffffff, 0 0 20px #10b981;
  }

  .today-sparkle.delay-1 {
    animation-delay: 0.3s;
  }

  .today-sparkle.delay-2 {
    animation-delay: 0.6s;
  }

  @keyframes sparkle {
    0%, 100% {
      opacity: 0;
      transform: translate(0, 0) scale(1);
    }
    50% {
      opacity: 1;
      transform: translate(10px, -10px) scale(1.5);
    }
  }

  /* Loading dots animation */
  .loading-dots {
    display: flex;
    gap: 4px;
  }

  .dot {
    animation: dot-blink 1.4s infinite both;
    color: #ffffff;
    font-size: 32px;
    font-weight: 900;
  }

  .dot:nth-child(2) {
    animation-delay: 0.2s;
  }

  .dot:nth-child(3) {
    animation-delay: 0.4s;
  }

  @keyframes dot-blink {
    0%, 100% { opacity: 0.2; }
    50% { opacity: 1; }
  }

  /* Responsive design for today count */
  @media (max-width: 768px) {
    .today-events-header {
      padding: 8px 12px;
    }
    
    .today-container {
      padding: 10px 16px;
      gap: 12px;
      border-radius: 30px;
    }
    
    .today-text {
      font-size: 14px;
      gap: 6px;
    }
    
    .today-icon {
      width: 18px;
      height: 18px;
    }
    
    .today-count-badge {
      min-width: 50px;
      height: 50px;
      font-size: 20px;
      border-width: 3px;
    }
    
    .today-pulse-ring {
      width: 70px;
      height: 70px;
    }
  }

  @media (min-width: 769px) and (max-width: 1024px) {
    .today-container {
      padding: 12px 20px;
    }
    
    .today-text {
      font-size: 16px;
    }
    
    .today-count-badge {
      min-width: 60px;
      height: 60px;
      font-size: 24px;
    }
  }

  /* =========================================
    COMPACT ENQUIRY SECTION WITH SAME EFFECTS
  ========================================= */
  .upcoming-event {
    position: absolute;
    top: 8px;
    right: 8px;
    background: #ff4757;
    color: white;
    font-size: 12px;
    font-weight: 700;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
  }
    .upcoming-event:keyframes pulse {
      0%, 100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.2);
      }
    }

  .enquiry-section {
    background: transparent;
    padding: 16px;
    position: relative;
    display: flex;
    justify-content: center;
    margin-top: 5px;
  }

  .enquiry-container {
    width: 100%;
    max-width: 1200px;
    z-index: 2;
  }

  .enquiry-card {
    background: linear-gradient(135deg, 
      rgba(99, 102, 241, 0.95) 0%, 
      rgba(168, 85, 247, 0.95) 50%, 
      rgba(236, 72, 153, 0.9) 100%);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 12px;
    padding: 5px 20px;
    padding-bottom:10px;
    cursor: pointer;
    transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    position: relative;
    overflow: hidden;
    box-shadow: 
      0 15px 30px rgba(99, 102, 241, 0.25),
      0 0 0 1px rgba(255, 255, 255, 0.1) inset;
  }

  .enquiry-card:hover {
    transform: translateY(-3px) scale(1.01);
    box-shadow: 
      0 20px 40px rgba(99, 102, 241, 0.35),
      0 0 0 1px rgba(255, 255, 255, 0.2) inset;
  }

  .enquiry-background-glow {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(
      circle at 30% 50%,
      rgba(255, 255, 255, 0.3) 0%,
      transparent 50%
    );
    opacity: 0;
    transition: opacity 0.4s ease;
  }

  .enquiry-card:hover .enquiry-background-glow {
    opacity: 1;
  }

  .enquiry-content {
    display: flex;
    align-items: center;
    gap: 16px;
    flex: 1;
    position: relative;
    z-index: 2;
  }

  .enquiry-icon-main {
    position: relative;
    flex-shrink: 0;
  }

  .icon-orb {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.4);
    backdrop-filter: blur(10px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
    transition: all 0.3s ease;
  }

  .enquiry-card:hover .icon-orb {
    transform: scale(1.08) rotate(5deg);
    background: rgba(255, 255, 255, 0.25);
  }

  .icon-pulse {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 56px;
    height: 56px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    filter: blur(10px);
    animation: pulse-glow 2s ease-in-out infinite;
  }

  @keyframes pulse-glow {
    0%, 100% { 
      opacity: 0.4; 
      transform: translate(-50%, -50%) scale(1);
    }
    50% { 
      opacity: 0.8; 
      transform: translate(-50%, -50%) scale(1.08);
    }
  }

  .enquiry-text-content {
    flex: 1;
    min-width: 0;
  }

  /* Desktop-only badge */
  .enquiry-badge.desktop-only {
    display: inline-block;
    background: rgba(255, 255, 255, 0.2);
    color: #fff;
    font-size: 9px;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 10px;
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border: 1px solid rgba(255, 255, 255, 0.3);
  }

  /* Mobile-only badge */
  .enquiry-badge.mobile-only {
    display: none;
    background: rgba(255, 255, 255, 0.2);
    color: #fff;
    font-size: 9px;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 10px;
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border: 1px solid rgba(255, 255, 255, 0.3);
  }

  .enquiry-title {
    font-size: 17px;
    font-weight: 800;
    color: #fff;
    margin: 0 0 4px;
    text-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .enquiry-subtitle {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.9);
    margin: 0;
    line-height: 1.3;
    font-weight: 500;
  }

  .enquiry-action {
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(255, 255, 255, 0.2);
    padding: 8px 12px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    transition: all 0.3s ease;
    flex-shrink: 0;
  }

  .enquiry-card:hover .enquiry-action {
    background: rgba(255, 255, 255, 0.3);
    transform: translateX(3px);
  }

  /* Desktop-only CTA */
  .enquiry-cta.desktop-only {
    font-size: 11px;
    font-weight: 700;
    color: #fff;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* Mobile-only CTA */
  .enquiry-cta.mobile-only {
    display: none;
    font-size: 11px;
    font-weight: 700;
    color: #fff;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .enquiry-arrow {
    transition: transform 0.3s ease;
  }

  .enquiry-card:hover .enquiry-arrow {
    transform: translateX(2px);
  }

  .enquiry-sparkle {
    position: absolute;
    top: -8px;
    right: -8px;
    width: 24px;
    height: 24px;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 50%;
    filter: blur(6px);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .enquiry-card:hover .enquiry-sparkle {
    opacity: 0.6;
  }

  .enquiry-hover-effect {
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    transition: left 0.6s ease;
  }

  .enquiry-card:hover .enquiry-hover-effect {
    left: 100%;
  }

  /* =========================================
    DASHBOARD METRICS GRID
  ========================================= */
  .dashboard-container {
    padding: 20px 16px;
    // background: #f8fafc;
    min-height: calc(100vh - 140px);
  }

  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 18px;
    max-width: 1200px;
    margin: 0 auto;
  }

  .metric-card {
    background: #fff;
    border-radius: 14px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    cursor: pointer;
    transition: all 0.3s ease;
    border: 1px solid #e2e8f0;
    position: relative;
    min-height: 150px;
    display: flex;
    align-items: center;
  }

  .metric-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.12);
    border-color: #cbd5e1;
  }

  .metric-content {
    display: flex;
    align-items: center;
    gap: 14px;
    flex: 1;
  }

  .metric-icon {
    width: 50px;
    height: 50px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    flex-shrink: 0;
  }

  .metric-info {
    flex: 1;
    min-width: 0;
  }

  .metric-name {
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 6px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .metric-stats {
    display: flex;
    align-items: center;
  }

  .metric-label-container {
    display: flex;
    align-items: center;
  }

  .metric-amount {
    font-size: 16px;
    font-weight: 700;
    color: #059669;
    background: #d1fae5;
    padding: 4px 10px;
    border-radius: 12px;
  }

  .metric-label {
    font-size: 13px;
    font-weight: 500;
    color: #64748b;
    background: #f1f5f9;
    padding: 4px 10px;
    border-radius: 12px;
   
  }

  .metric-shortcut.desktop-only {
    font-size: 12px;
    font-weight: 600;
    color: #475569;
   
    padding: 4px 8px;
    
   
    margin-left: 1px;
  }

  .metric-shortcut.mobile-only {
    display: none;
  }

  .metric-arrow {
    color: #cbd5e1;
    transition: color 0.2s ease;
    flex-shrink: 0;
  }

  .metric-card:hover .metric-arrow {
    color: #475569;
  }

  /* =========================================
    RESPONSIVE ADAPTATION
  ========================================= */

  /* Tablets */
  @media (min-width: 768px) and (max-width: 1024px) {
    .dashboard-container {
      padding: 24px 32px;
    }

    .metrics-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 18px;
    }

    .metric-card {
      min-height: 180px;
      padding: 20px;
    }

    .metric-name {
      font-size: 15px;
    }
.enquiry-badge.desktop-only,
    .enquiry-cta.desktop-only,
    .metric-shortcut.desktop-only {
      display: none !important;
    }
    .metric-amount,
    .metric-label {
      font-size: 13px;
    }
  }
    
  /* Large Phones - SHORTER MOBILE VERSION */
  @media (max-width: 768px) {
    /* Show mobile-only elements and hide desktop-only */
    .enquiry-badge.desktop-only,
    .enquiry-cta.desktop-only,
    .metric-shortcut.desktop-only {
      display: none !important;
    }
    
    .enquiry-badge.mobile-only,
    .enquiry-cta.mobile-only {
      display: inline-block !important;
    }

    .metric-shortcut.mobile-only {
      display: none;
    }

    .enquiry-section {
      padding: 12px;
    }

    .enquiry-card {
      padding: 14px 16px;
      border-radius: 14px;
    }

    .enquiry-content {
      gap: 12px;
    }

    .enquiry-icon-main {
      display: flex;
      align-items: center;
    }

    .icon-orb {
      width: 40px;
      height: 40px;
      border-radius: 12px;
    }

    .icon-pulse {
      width: 46px;
      height: 46px;
    }

    .enquiry-text-content {
      flex: 1;
      min-width: 0;
    }

    .enquiry-badge.mobile-only {
      font-size: 8px;
      padding: 2px 6px;
      margin-bottom: 4px;
    }

    .enquiry-title {
      font-size: 15px;
      margin: 0 0 2px;
    }

    .enquiry-subtitle {
      font-size: 11px;
      line-height: 1.2;
    }

    .enquiry-action {
      padding: 6px 10px;
      gap: 4px;
    }

    .enquiry-cta.mobile-only {
      font-size: 10px;
    }

    .enquiry-arrow {
      display: flex;
      align-items: center;
    }

    .dashboard-container {
      padding: 12px;
    }

    .metrics-grid {
      grid-template-columns: 1fr;
      gap: 12px;
    }

    .metric-card {
      padding: 16px;
      min-height: 100px;
    }

    .metric-icon {
      width: 42px;
      height: 42px;
    }

    .metric-name {
      font-size: 14px;
    }

    .metric-label {
      border-radius: 12px;
      padding: 4px 8px;
      font-size: 12px;
    }

    .metric-amount {
      font-size: 14px;
      padding: 4px 8px;
    }
  }

  /* Desktop/Laptop styles - show desktop-only elements */
  @media (min-width: 769px) {
    .enquiry-badge.desktop-only,
    .enquiry-cta.desktop-only,
    .metric-shortcut.desktop-only {
      display: inline-block;
    }
    
    .enquiry-badge.mobile-only,
    .enquiry-cta.mobile-only {
      display: none !important;
    }
  }
    /* Notification Badge - Pure CSS (No Tailwind) */

/* Keyframe Animations */
@keyframes shake {
  0%, 100% { 
    transform: rotate(0deg); 
  }
  10%, 30%, 50%, 70%, 90% { 
    transform: rotate(-8deg); 
  }
  20%, 40%, 60%, 80% { 
    transform: rotate(8deg); 
  }
}

@keyframes pulse-scale {
  0%, 100% { 
    transform: scale(1); 
  }
  50% { 
    transform: scale(1.1); 
  }
}

@keyframes bell-ring {
  0% { 
    transform: rotate(0deg); 
  }
  5% { 
    transform: rotate(15deg); 
  }
  10% { 
    transform: rotate(-15deg); 
  }
  15% { 
    transform: rotate(12deg); 
  }
  20% { 
    transform: rotate(-12deg); 
  }
  25% { 
    transform: rotate(8deg); 
  }
  30% { 
    transform: rotate(-8deg); 
  }
  35% { 
    transform: rotate(4deg); 
  }
  40% { 
    transform: rotate(-4deg); 
  }
  45%, 100% { 
    transform: rotate(0deg); 
  }
}

@keyframes glow-pulse {
  0%, 100% { 
    box-shadow: 
      0 0 10px rgba(251, 191, 36, 0.5), 
      0 0 20px rgba(251, 191, 36, 0.3), 
      0 0 30px rgba(251, 191, 36, 0.2);
  }
  50% { 
    box-shadow: 
      0 0 20px rgba(251, 191, 36, 0.8), 
      0 0 30px rgba(251, 191, 36, 0.6), 
      0 0 40px rgba(251, 191, 36, 0.4);
  }
}

/* Notification Container */
.notification-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  animation: shake 0.5s ease-in-out infinite, pulse-scale 1.5s ease-in-out infinite;
}

/* Inner Wrapper */
.notification-badge-inner {
  position: relative;
}

/* Bell Icon Container */
.bell-icon-container {
  background: linear-gradient(135deg, #fffb0dff 0%, #eddf4cff 50%, #e4c34dff 100%);
  border-radius: 50%;
  padding: 8px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  position: relative;
  overflow: visible;
  border: 2px solid #fef3c7;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: bell-ring 2s ease-in-out infinite, glow-pulse 2s ease-in-out infinite;
}

/* Bell Icon (SVG) */
.bell-icon {
  width: 16px;
  height: 16px;
  color: white;
  filter: drop-shadow(0 10px 8px rgba(0, 0, 0, 0.04)) drop-shadow(0 4px 3px rgba(0, 0, 0, 0.1));
}

/* Metallic Shine Effect Overlay */
.bell-shine {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg, transparent 0%, rgba(255, 255, 255, 0.2) 50%, transparent 100%);
  border-radius: 50%;
  pointer-events: none;
}

/* Red Count Badge */
.notification-count {
  position: absolute;
  top: -2px;
  right: -2px;
  background-color: #ef4444;
  color: white;
  font-size: 8px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border: 1px solid white;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
}

  `}</style>
    </>
  );
}

export default MainDashboard;