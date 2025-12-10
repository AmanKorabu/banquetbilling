import React, { useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdLibraryAdd } from "react-icons/md";
import { TbReportSearch } from "react-icons/tb";
import { RiDeleteBin6Fill } from "react-icons/ri";
import useEscapeNavigate from '../hooks/EscapeNavigate';


function MakeBooking() {
  const navigate = useNavigate();
  useEscapeNavigate('/dashboard')
  useEffect(() => {
    // Fixed keyboard shortcut handler
    const handleKeyPress = (event) => {
      // Check for Shift+N (Shift + N)
      if (event.key === 'F1') {
        event.preventDefault();
        navigate('/new-booking');
      }
      if (event.key === 'F2') {
        event.preventDefault();
        navigate('/quote-list');

      }
      if (event.key === 'F3') {
        event.preventDefault();
        navigate('/deleted-quotes');

      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyPress);

    // Clean up event listener
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [navigate]); // Added navigate dependency

  const btnContainer = useMemo(() => [
    {
      symbol: <MdLibraryAdd className="button-icon" />,
      title: 'New Booking',
      url: '/new-booking',
      variant: 'primary',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      glow: '0 12px 40px rgba(102, 126, 234, 0.25)'
    },
    {
      symbol: <TbReportSearch className="button-icon" />,
      title: 'Quotes List',
      url: '/quote-list',
      variant: 'secondary',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      glow: '0 12px 40px rgba(79, 172, 254, 0.25)'
    },
    {
      symbol: <RiDeleteBin6Fill className="button-icon" />,
      title: 'Deleted',
      url: '/deleted-quotes',
      variant: 'danger',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      glow: '0 12px 40px rgba(245, 87, 108, 0.25)'
    }
  ], []);

  const handleButtonClick = useCallback((url) => navigate(url), [navigate]);

  return (
    <>

      <div className="container">
        {/* Minimal Background */}
        <div className="minimal-bg">
          <div className="bg-grid"></div>
        </div>

        {/* Unified Button Grid - Responsive Layout */}
        <div className="button-grid-container">
          <div className="button-grid">
            {btnContainer.map((btn, index) => (
              <div
                key={index}
                className={`action-button ${btn.variant}`}
                onClick={() => handleButtonClick(btn.url)}
                style={{ '--button-glow': btn.glow }}
              >
                {/* Background Layer */}
                <div className="button-bg" style={{ background: btn.gradient }}></div>

                {/* Border Effect */}
                <div className="button-border"></div>

                {/* Content */}
                <div className="button-content">
                  <div className="icon-container">
                    <div className="icon-wrapper">
                      {btn.symbol}
                    </div>
                    <div className="icon-halo"></div>
                  </div>

                  <div className="text-container">
                    <h3 className="button-title">{btn.title}</h3>
                    <p className="button-description">{btn.description}</p>
                  </div>

                  <div className="action-indicator">
                    <div className="indicator-dots">
                      <span></span>
                      <span></span>
                    </div>
                    <svg className="arrow" width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>

                {/* Hover Effects */}
                <div className="button-shine"></div>
                <div className="particle-effect"></div>
              </div>
            ))}
          </div>
        </div>

      </div>

      <style>{`
        .container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 1rem;
          width: 100%;
          box-sizing: border-box;
          position: relative;
         
        }

        /* Minimal Background */
        .minimal-bg {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
        }

        .bg-grid {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: 
            linear-gradient(rgba(102, 126, 234, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(102, 126, 234, 0.02) 1px, transparent 1px);
          background-size: 50px 50px;
          opacity: 0.5;
        }

        /* Button Grid Container */
        .button-grid-container {
          position: relative;
          z-index: 1;
          margin: 0.5rem 0;
          width: 100%;
        }

        .button-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          width: 100%;
          max-width: 1000px;
          margin: 0 auto;
        }

        .action-button {
          position: relative;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 16px;
          padding: 0.5rem 0.5rem;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          border: 1px solid rgba(24, 20, 20, 0.4);
          box-shadow: 
            0 4px 20px rgba(0, 0, 0, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.8),
            0 0 0 1px rgba(255, 255, 255, 0.1);
          overflow: hidden;
          min-height: 40px;
          display: flex;
          align-items: center;
        }

        .button-bg {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          opacity: 0;
          transition: opacity 0.4s ease;
          z-index: -1;
        }

        .button-border {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 16px;
          padding: 1px;
          background: linear-gradient(135deg, transparent, transparent);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          transition: all 0.4s ease;
        }

        .button-content {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          width: 100%;
          position: relative;
          z-index: 2;
        }

        .icon-container {
          position: relative;
          flex-shrink: 0;
        }

        .icon-wrapper {
          padding: 1.5rem;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          position: relative;
          z-index: 2;
        }

        .action-button.primary .icon-wrapper {
          background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
          color: #667eea;
        }

        .action-button.secondary .icon-wrapper {
          background: linear-gradient(135deg, #4facfe15 0%, #00f2fe15 100%);
          color: #4facfe;
        }

        .action-button.danger .icon-wrapper {
          background: linear-gradient(135deg, #f093fb15 0%, #f5576c15 100%);
          color: #f5576c;
        }

        .icon-halo {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 60px;
          height: 60px;
          border-radius: 12px;
          opacity: 0;
          transition: all 0.4s ease;
        }

        .text-container {
          flex: 1;
          min-width: 0;
        }

        .button-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #1f2937;
          line-height: 1.3;
          /* Remove text truncation */
          white-space: normal;
          overflow: visible;
          text-overflow: unset;
        }

      
        .action-indicator {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          opacity: 0;
          transform: translateX(-8px);
          transition: all 0.3s ease;
          flex-shrink: 0;
        }

        .indicator-dots {
          display: flex;
          gap: 3px;
        }

        .indicator-dots span {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: currentColor;
          opacity: 0.6;
          animation: dotBounce 1.4s ease-in-out infinite both;
        }

        .indicator-dots span:nth-child(2) { animation-delay: 0.2s; }

        .arrow {
          color: #9ca3af;
          transition: transform 0.3s ease;
        }

        /* Hover Effects */
        .action-button:hover {
          transform: translateY(-3px);
          box-shadow: 
            var(--button-glow),
            0 12px 30px rgba(0, 0, 0, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.9);
        }

        .action-button:hover .button-bg {
          opacity: 0.05;
        }

        .action-button:hover .button-border {
          background: linear-gradient(135deg, #667eea, #4facfe, #f5576c);
        }

        .action-button:hover .icon-wrapper {
          transform: scale(1.05);
        }

        .action-button:hover .icon-halo {
          opacity: 0.3;
          width: 65px;
          height: 65px;
        }

        .action-button.primary:hover .icon-halo {
          background: #667eea;
        }

        .action-button.secondary:hover .icon-halo {
          background: #4facfe;
        }

        .action-button.danger:hover .icon-halo {
          background: #f5576c;
        }

        .action-button:hover .action-indicator {
          opacity: 1;
          transform: translateX(0);
        }

        .action-button:hover .arrow {
          transform: translateX(2px);
          color: #374151;
        }

        .button-shine {
          position: absolute;
          top: 0;
          left: -100%;
          width: 50%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          transition: left 0.6s ease;
          transform: skewX(-15deg);
        }

        .action-button:hover .button-shine {
          left: 150%;
        }

        .particle-effect {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at var(--x, 50%) var(--y, 50%), 
            rgba(255,255,255,0.15) 0%, transparent 50%);
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }

        .action-button:hover .particle-effect {
          opacity: 1;
        }

        /* Animations */
        @keyframes slideIn {
          from { transform: scaleX(0); opacity: 0; }
          to { transform: scaleX(1); opacity: 1; }
        }

        @keyframes dotBounce {
          0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
          40% { transform: scale(1.1); opacity: 1; }
        }

        /* ===== ULTRA-RESPONSIVE DESIGN ===== */

        /* Large Desktop (1440px+) */
        @media (min-width: 1440px) {
          .button-grid {
            max-width: 1200px;
            gap: 2rem;
          }

          .action-button {
            padding: 1.5rem 1rem;
            min-height: 90px;
          }

          .button-title {
            font-size: 1.2rem;
          }

          .button-description {
            font-size: 0.85rem;
          }
        }

        /* Standard Desktop (1025px - 1439px) */
        @media (min-width: 1025px) {
          .button-grid {
            gap: 1.75rem;
          }
        }

        /* Tablet Landscape (769px - 1024px) */
        @media (max-width: 1024px) and (min-width: 769px) {
          .container {
            padding: 0 1rem;
          }

          .button-grid-container {
            margin: 1rem 0;
          }

          .button-grid {
            gap: 1.25rem;
            max-width: 800px;
          }

          .action-button {
            padding: 0.5rem 0.5rem;
            min-height: 70px;
            border-radius: 14px;
          }

          .button-content {
            gap: 1rem;
          }

          .icon-wrapper {
            padding: 0.875rem;
          }

          .button-title {
            font-size: 1rem;
          }

          .button-description {
            font-size: 0.75rem;
          }
        }

        /* Tablet Portrait & Mobile Landscape (481px - 768px) */
        @media (max-width: 768px) {
          .container {
            padding: 0 1rem;
          }

          .button-grid-container {
            margin: 1rem 0;
          }

          .button-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
            max-width: 600px;
          }

          .action-button {
            padding: 1rem 0.5rem;
            min-height: 70px;
            border-radius: 12px;
          }

          .button-content {
            gap: 0.875rem;
          }

          .icon-wrapper {
            padding: 0.75rem;
            border-radius: 10px;
          }

          .button-title {
            font-size: 0.95rem;
          }

          .button-description {
            font-size: 0.7rem;
          }

          .action-indicator {
            gap: 0.5rem;
          }

          .arrow {
            width: 14px;
            height: 14px;
          }
        }

        /* Mobile Portrait (320px - 480px) */
        @media (max-width: 480px) {
          .container {
            padding: 0 0.75rem;
          }

          .button-grid-container {
            margin: 1rem 0;
          }

          .button-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 0.75rem;
          }

          /* Make the third button span full width on mobile */
          .action-button:nth-child(3) {
            grid-column: 1 / -1;
            max-width: calc(50% - 0.375rem);
            margin: 0 auto;
          }

          .action-button {
            padding: 1rem 0.5rem;
            min-height: 60px;
            border-radius: 10px;
          }

          .button-content {
            gap: 0.75rem;
          }

          .icon-wrapper {
            padding: 0.625rem;
            border-radius: 8px;
          }

          .icon-halo {
            width: 50px;
            height: 50px;
          }

          .action-button:hover .icon-halo {
            width: 55px;
            height: 55px;
          }

          .button-title {
            font-size: 0.9rem;
          }

          .button-description {
            font-size: 0.65rem;
          }

          .action-indicator {
            gap: 0.4rem;
          }

          .indicator-dots span {
            width: 2px;
            height: 2px;
          }

          .arrow {
            width: 12px;
            height: 12px;
          }
        }

        /* Small Mobile (320px and below) */
        @media (max-width: 320px) {
          .container {
            padding: 0 0.5rem;
          }

          .button-grid {
            gap: 0.5rem;
          }

          .action-button:nth-child(3) {
            max-width: calc(50% - 0.25rem);
          }

          .action-button {
            padding: 1rem 0.5rem;
            min-height: 70px;
          }

          .button-content {
            gap: 0.5rem;
          }

          .icon-wrapper {
            padding: 0.5rem;
          }

          .button-title {
            font-size: 0.85rem;
          }

          .button-description {
            font-size: 0.6rem;
          }
        }

        /* Touch Device Optimizations */
        @media (hover: none) and (pointer: coarse) {
          .action-button:hover {
            transform: none;
          }

          .action-button:active {
            transform: scale(0.98);
          }

          .action-button:active .button-bg {
            opacity: 0.08;
          }
        }

        /* Reduced Motion Support */
        @media (prefers-reduced-motion: reduce) {
          .button-shine,
          .particle-effect,
          .indicator-dots span {
            animation: none;
          }

          .action-button {
            transition: none;
          }
        }
      `}</style>

    </>
  );
}

export default MakeBooking;