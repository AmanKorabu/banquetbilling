import { IoIosAddCircleOutline } from "react-icons/io";
import { LiaFileInvoiceSolid } from "react-icons/lia";
import { CiCalendar } from "react-icons/ci";
import { GiReceiveMoney } from "react-icons/gi";
import { PiCalendarStar } from "react-icons/pi";
import { PiWalletLight } from "react-icons/pi";
import { useNavigate } from 'react-router-dom';
import { IoNewspaperOutline, IoChevronForward } from "react-icons/io5";
import Header from './Header';
import { useEffect } from "react";

function MainDashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    // Fixed keyboard shortcut handler
    const handleKeyPress = (event) => {
      // Check for Shift+N (Shift + N)
      if (event.key === 'F1') {
        event.preventDefault();
        navigate('/select-dashboard');
      }
      if ( event.key === 'F2') {
        event.preventDefault();
        navigate('/bill-list');

      }
      if ( event.key === 'F3') {
        event.preventDefault();
        navigate('/calender-view');

      }
      if ( event.key === 'F4') {
        event.preventDefault();
        navigate('/unsettled-bill');

      }
      if (event.key === '1') {
        event.preventDefault();
        navigate('/enquiry-dashboard');

      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyPress);

    // Clean up event listener
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [navigate]); // Added navigate dependency

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
      shortcut: "F5"
    },
    {
      id: 6,
      name: "Balance Amount",
      img: <PiWalletLight size={24} color='white' />,
      iconBg: 'linear-gradient(135deg, #91ebe7ff 0%, #fbaac4ff 100%)',
      borderLeft: '4px solid #80e6e1ff',
      amount: 100000,
      navigate: '/balance-amount',
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

  return (
    <>
      <Header />

      {/* Compact Enquiry Section with Same Effects */}
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
                        ₹{event.amount.toLocaleString("en-IN")}
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
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
  /* =========================================
    COMPACT ENQUIRY SECTION WITH SAME EFFECTS
  ========================================= */
  .enquiry-section {
    background: transparent;
    padding: 16px;
    position: relative;
    display: flex;
    justify-content: center;
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
    border-radius: 16px;
    padding: 18px 20px;
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
    background: #f8fafc;
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
  `}</style>
    </>
  );
}

export default MainDashboard;