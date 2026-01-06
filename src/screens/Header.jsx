import React, { useEffect, useRef, useState } from "react";
import { RxHamburgerMenu, RxCross2 } from "react-icons/rx";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { TbLogout2, TbDashboard } from "react-icons/tb";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  IoHomeOutline, IoPeople, IoDocuments, IoSettings,
  IoCube, IoCard, IoAddCircle, IoPricetag, IoFlag,
  IoCalendar, IoGift, IoCubeOutline, IoChevronDown,
  IoChevronForward, IoSearch, IoNotifications,
  IoPersonCircle
} from "react-icons/io5";
import { PiTreeStructureThin } from "react-icons/pi";
import { DiJenkins } from "react-icons/di";
import { menus } from "../components/menuData";

function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState({});
  const [ismobile12, setIsmobile12] = useState(window.innerWidth < 768);
  const [istablet12, setIstablet12] = useState(window.innerWidth >= 768 && window.innerWidth < 1024);
  const sidebarRef = useRef(null);
  const buttonRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleSidebar = () => setIsOpen((p) => !p);

  const toggleMenu = (menuId) => {
    setOpenMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId]
    }));
  };

  // Initialize open menus based on current path
  useEffect(() => {
    const findAndOpenParentMenus = (items, targetPath) => {
      const openSet = new Set();

      const findPathToTarget = (items, targetPath, path = []) => {
        for (const item of items) {
          const currentPath = [...path, item.id];

          if (item.url === targetPath) {
            return currentPath.slice(0, -1);
          }

          if (item.children && item.children.length > 0) {
            const found = findPathToTarget(item.children, targetPath, currentPath);
            if (found) {
              return found;
            }
          }
        }
        return null;
      };

      const parentPath = findPathToTarget(items, targetPath);

      if (parentPath) {
        parentPath.forEach(id => openSet.add(id));
      }

      return openSet;
    };

    const openMenuIds = findAndOpenParentMenus(menus, location.pathname);
    const openState = {};
    openMenuIds.forEach(id => {
      openState[id] = true;
    });
    setOpenMenus(openState);
  }, [location.pathname]);

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsmobile12(width < 768);
      setIstablet12(width >= 768 && width < 1024);

      if (width >= 1024 && isOpen) {
        setIsOpen(false);
      }
    };

    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target) &&
        buttonRef.current && !buttonRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    toast.success("Logged out successfully");
    navigate("/");
  };

  const closeAll = () => {
    setIsOpen(false);
  };

  // Handle Escape key
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && isOpen) {
        closeAll();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen]);

  const isActivePath = (path) => location.pathname === path;

  const getIconForMenu = (label, level = 0) => {
    const lowerLabel = label.toLowerCase();
    const iconSize = ismobile12 ? 14 : 16;

    if (level > 0) {
      if (lowerLabel.includes('section')) return <IoDocuments size={iconSize} />;
      if (lowerLabel.includes('item')) return <IoCube size={iconSize} />;
      if (lowerLabel.includes('room')) return <IoCubeOutline size={iconSize} />;
      if (lowerLabel.includes('serving')) return <IoAddCircle size={iconSize} />;
      if (lowerLabel.includes('category')) return <IoSettings size={iconSize} />;
      if (lowerLabel.includes('sub')) return <IoSettings size={iconSize} />;
      if (lowerLabel.includes('sales')) return <IoPricetag size={iconSize} />;
      if (lowerLabel.includes('paymode')) return <IoCard size={iconSize} />;
      if (lowerLabel.includes('extra')) return <IoAddCircle size={iconSize} />;
      if (lowerLabel.includes('rate')) return <IoPricetag size={iconSize} />;
      if (lowerLabel.includes('status')) return <IoFlag size={iconSize} />;
      if (lowerLabel.includes('event')) return <IoCalendar size={iconSize} />;
      if (lowerLabel.includes('function')) return <IoPeople size={iconSize} />;
      if (lowerLabel.includes('package')) return <IoGift size={iconSize} />;
      return <IoSettings size={iconSize} />;
    }

    if (lowerLabel.includes('dashboard')) return <TbDashboard size={iconSize} />;
    if (lowerLabel.includes('master')) return <PiTreeStructureThin size={iconSize} />;
    return <PiTreeStructureThin size={iconSize} />;
  };

  const renderMenuItems = (items, level = 0) => {
    return items.map((item) => {
      const isOpen = openMenus[item.id];
      const hasChildren = item.children && item.children.length > 0;
      const nestedPadding = ismobile12 ? 16 + (level * 16) : 20 + (level * 20);

      if (hasChildren) {
        return (
          <li key={item.id} className="nav-group">
            <button
              onClick={() => toggleMenu(item.id)}
              aria-expanded={isOpen}
              className="nav-dropdown12"
              style={{ paddingLeft: `${nestedPadding}px` }}
            >
              <div className="nav-icon">
                {getIconForMenu(item.label, level)}
              </div>
              <span className="nav-text">{item.label}</span>
              <div className="nav-arrow">
                {isOpen ? <IoChevronDown size={ismobile12 ? 10 : 12} /> : <IoChevronForward size={ismobile12 ? 10 : 12} />}
              </div>
            </button>

            <ul className={`submenu ${isOpen ? "open" : ""}`}>
              {renderMenuItems(item.children, level + 1)}
            </ul>
          </li>
        );
      }

      return (
        <li key={item.id} className={isActivePath(item.url) ? "active" : ""}>
          <NavLink
            to={item.url}
            onClick={closeAll}
            className="nav-link12"
            style={{ paddingLeft: `${nestedPadding}px` }}
          >
            <div className="nav-icon">
              {getIconForMenu(item.label, level)}
            </div>
            <span className="nav-text">{item.label}</span>
            {isActivePath(item.url) && <div className="active-indicator"></div>}
          </NavLink>
        </li>
      );
    });
  };

  const hotelName = localStorage.getItem('hotel_name') || 'User';

  return (
    <>
      {/* Responsive Header */}
      <header className="responsive-header12">
        <div className="header-wrapper12">
          {/* Left Section - Menu toggle and Brand */}
          <div className="header-left-section12">
            <button
              className="menu-toggle-btn12"
              ref={buttonRef}
              onClick={toggleSidebar}
              aria-label="Toggle menu"
            >
              {isOpen ? <RxCross2 size={ismobile12 ? 18 : 20} /> : <RxHamburgerMenu size={ismobile12 ? 18 : 20} />}
            </button>

            <div className="brand-container">
              {!ismobile12 && (
                <div className="brand-logo">
                  <div className="logo-text">BQ</div>
                </div>
              )}
              <div className="brand-content">
                <h1 className="app-title">BanQuet</h1>
                <p className="user-info-display">
                  User: <span className="user-name-highlight">{hotelName}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Right Section - Home button */}
          <div className="header-right-section12">
            <NavLink to="/dashboard" className="home-action-btn" aria-label="Dashboard">
              <IoHomeOutline size={ismobile12 ? 18 : 20} />
              {!ismobile12 && <span className="btn-text">Home</span>}
            </NavLink>
          </div>
        </div>
      </header>

      {/* Responsive Sidebar */}
      <aside
        ref={sidebarRef}
        className={`responsive-sidebar12 ${isOpen ? 'open' : ''} ${ismobile12 ? 'mobile12' : istablet12 ? 'tablet12' : 'desktop12'}`}
      >
        <div className="sidebar-top-section12">
          <div className="sidebar-header12">
            <div className="sidebar-branding">
              <div className="sidebar-logo">
                <DiJenkins size={ismobile12 ? 28 : 32} />
              </div>
              <div className="sidebar-brand-details">
                <h2 className="sidebar-title">Banquet Billing</h2>
                <p className="sidebar-subtitle">Management System</p>
                <span className="version-badge">v0.1</span>
              </div>
            </div>
            <button className="sidebar-close-btn" onClick={closeAll} aria-label="Close sidebar">
              <RxCross2 size={ismobile12 ? 18 : 20} />
            </button>
          </div>

          {/* Quick Stats - Only show on tablet12 and desktop12 */}

        </div>

        {/* Scrollable Menu Area */}
        <div className="sidebar-scroll-area">
          <nav className="sidebar-navigation">
            <div className="navigation-section">
              <h3 className="section-label">MAIN NAVIGATION</h3>
              <ul className="navigation-list">
                {renderMenuItems(menus)}
              </ul>
            </div>
          </nav>
        </div>

        {/* Fixed Bottom Section */}
        <div className="sidebar-bottom-section">
          <div className="current-user-info">
            <div className="user-avatar">
              <IoPersonCircle size={ismobile12 ? 20 : 24} />
            </div>
            <div className="user-details">
              <span className="user-display-name">{hotelName}</span>
              <span className="user-status-indicator">● Active</span>
            </div>
          </div>

          <button onClick={handleLogout} className="logout-action-btn">
            <TbLogout2 size={ismobile12 ? 16 : 18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile12/tablet12 */}
      {(ismobile12 || istablet12) && isOpen && (
        <div className="sidebar-backdrop" onClick={closeAll}></div>
      )}

      <style jsx>{`
        /* Base Styles */
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        /* Responsive Header */
        .responsive-header12 {
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          position: sticky;
          top: 0;
          z-index: 1000;
          height: auto;
          min-height: 70px;
          border-radius: 0 0 20px 20px;
          padding: 0;
          width: 100%;
        }

        .header-wrapper12 {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 100%;
          padding: 0.75rem 1.5rem;
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
          gap: 1rem;
        }

        /* Left Section */
        .header-left-section12 {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex: 1;
          min-width: 0;
        }

        .menu-toggle-btn12 {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .menu-toggle-btn12:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
        }

        .brand-container {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex: 1;
          min-width: 0;
        }

        .brand-logo {
          width: 2.75rem;
          height: 2.75rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
          flex-shrink: 0;
        }

        .logo-text {
          font-size: 1rem;
          font-weight: 800;
          color: white;
        }

        .brand-content {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-width: 0;
        }

        .app-title {
          font-size: clamp(1.125rem, 2vw, 1.25rem);
          font-weight: 700;
          color: white;
          margin: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-info-display {
          color: #ff0000;
          font-size: clamp(0.6875rem, 1.5vw, 0.75rem);
          margin: 0.125rem 0 0 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-name-highlight {
          color: #4be912;
          font-family: sans-serif;
          font-size: clamp(0.75rem, 1.5vw, 0.8125rem);
        }

        /* Right Section */
        .header-right-section12 {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 0.75rem;
          flex-shrink: 0;
        }

        .home-action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          height: 2.5rem;
          min-width: 2.5rem;
        }

        .home-action-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
        }

        .btn-text {
          font-size: 0.875rem;
          font-weight: 500;
        }

        /* Responsive Sidebar */
        .responsive-sidebar12 {
          position: fixed;
          top: 0;
          left: -100%;
          width: 100%;
          max-width: 320px;
          height: 100vh;
          background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
          color: #f8fafc;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 1100;
          box-shadow: 4px 0 30px rgba(0, 0, 0, 0.3);
          border-right: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .responsive-sidebar12.open {
          left: 0;
        }

        .responsive-sidebar12.mobile12 {
          max-width: 280px;
        }

        .responsive-sidebar12.tablet12 {
          max-width: 300px;
        }

        .responsive-sidebar12.desktop12 {
          max-width: 320px;
        }

        .sidebar-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 1099;
          backdrop-filter: blur(4px);
        }

        .sidebar-top-section12 {
          flex-shrink: 0;
        }

        .sidebar-header12 {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(15, 23, 42, 0.8);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .sidebar-branding {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex: 1;
          min-width: 0;
        }

        .sidebar-logo {
          width: 3rem;
          height: 3rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
          flex-shrink: 0;
        }

        .sidebar-brand-details {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-width: 0;
        }

        .sidebar-title {
          font-size: clamp(0.9375rem, 2vw, 1rem);
          font-weight: 700;
          color: white;
          margin: 0 0 0.125rem 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sidebar-subtitle {
          font-size: clamp(0.625rem, 1.5vw, 0.6875rem);
          color: rgba(255, 255, 255, 0.6);
          margin: 0 0 0.25rem 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .version-badge {
          color: red;
          font-size: clamp(0.5625rem, 1.5vw, 0.625rem);
        }

        .sidebar-close-btn {
          width: 2.25rem;
          height: 2.25rem;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .sidebar-close-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .sidebar-quick-stats {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(15, 23, 42, 0.6);
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 1rem;
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.2s ease;
        }

        .stat-card:hover {
          border-color: #667eea;
          background: rgba(102, 126, 234, 0.1);
          transform: translateY(-2px);
        }

        .stat-icon-wrapper {
          width: 2.25rem;
          height: 2.25rem;
          background: rgba(102, 126, 234, 0.2);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #667eea;
          flex-shrink: 0;
        }

        .stat-content {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-width: 0;
        }

        .stat-number {
          font-size: 1rem;
          font-weight: 700;
          color: white;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .stat-description {
          font-size: 0.6875rem;
          color: rgba(255, 255, 255, 0.7);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Scrollable Menu Area */
        .sidebar-scroll-area {
          flex: 1;
          overflow-y: auto;
          min-height: 0;
          padding: 1rem 0;
        }

        .sidebar-scroll-area::-webkit-scrollbar {
          width: 6px;
        }

        .sidebar-scroll-area::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }

        .sidebar-scroll-area::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }

        .sidebar-scroll-area::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .sidebar-navigation {
          height: 100%;
        }

        .navigation-section {
          margin-bottom: 1.5rem;
        }

        .section-label {
          font-size: 0.6875rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 0 1.5rem 0.75rem 1.5rem;
          margin: 0;
        }

        .navigation-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .nav-link12, .nav-dropdown12 {
          display: flex;
          align-items: center;
          width: 100%;
          padding: 0.875rem 1.5rem;
          color: #cbd5e1;
          text-decoration: none;
          border: none;
          background: none;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          text-align: left;
          font-size: 0.875rem;
        }

        .nav-icon {
          width: 1.25rem;
          height: 1.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 0.75rem;
          color: #94a3b8;
          flex-shrink: 0;
        }

        .nav-text {
          flex: 1;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .nav-arrow {
          color: #94a3b8;
          transition: transform 0.2s ease;
          margin-left: 0.5rem;
          flex-shrink: 0;
        }

        .active-indicator {
          width: 6px;
          height: 1.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 3px;
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
        }

        /* Hover and Active States */
        .nav-link12:hover, .nav-dropdown12:hover {
          background: rgba(255, 255, 255, 0.05);
          color: white;
        }

        .nav-link12:hover .nav-icon, .nav-dropdown12:hover .nav-icon {
          color: #667eea;
        }

        .nav-link12.active {
          background: linear-gradient(90deg, rgba(102, 126, 234, 0.15) 0%, transparent 100%);
          color: #667eea;
          border-right: 3px solid #667eea;
          font-weight: 600;
        }

        .nav-link12.active .nav-icon {
          color: #667eea;
        }

        /* Submenu Styles */
        .submenu {
          list-style: none;
          padding: 0;
          margin: 0;
          background: rgba(15, 23, 42, 0.5);
          border-left: 2px solid rgba(102, 126, 234, 0.3);
          margin-left: 1.5rem;
        }

        .submenu:not(.open) {
          display: none;
        }

        .submenu.open {
          display: block;
        }

        /* Sidebar Bottom Section */
        .sidebar-bottom-section {
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(15, 23, 42, 0.9);
          padding: 5px 1.5rem;
          flex-shrink: 0;
        }

        .current-user-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .user-avatar {
          color: #667eea;
          flex-shrink: 0;
        }

        .user-details {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-width: 0;
        }

        .user-display-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: white;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-status-indicator {
          font-size: 0.6875rem;
          color: #10b981;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .logout-action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.875rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .logout-action-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
        }

        /* Responsive Breakpoints */
        @media (max-width: 1024px) {
          .header-wrapper12 {
            padding: 0.75rem 1rem;
          }

          .sidebar-header12,
          .sidebar-quick-stats,
          .sidebar-bottom-section {
            padding: 1rem;
          }

          .section-label,
          .nav-link12,
          .nav-dropdown12 {
            padding-left: 1rem;
            padding-right: 1rem;
          }

          .submenu {
            margin-left: 1rem;
          }
        }

        @media (max-width: 768px) {
          .responsive-header12 {
            min-height: 64px;
            border-radius: 0 0 16px 16px;
          }

          .header-wrapper12 {
            padding: 0.5rem 0.75rem;
            gap: 0.5rem;
          }

          .header-left-section12 {
            gap: 0.75rem;
          }

          .menu-toggle-btn12 {
            width: 2.25rem;
            height: 2.25rem;
          }

          .brand-logo {
            display: none;
          }

          .home-action-btn {
            padding: 0.5rem;
          }

          .btn-text {
            display: none;
          }

          .sidebar-header12 {
            padding: 1rem;
          }

          .sidebar-logo {
            width: 2.5rem;
            height: 2.5rem;
          }

          .sidebar-quick-stats {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .header-wrapper12 {
            padding: 0.5rem;
          }

          .app-title {
            font-size: 1rem;
          }

          .user-info-display {
            font-size: 0.625rem;
          }

          .user-name-highlight {
            font-size: 0.6875rem;
          }

          .responsive-sidebar12.mobile12 {
            max-width: 100%;
            width: 85vw;
          }

          .sidebar-header12,
          .sidebar-quick-stats,
           {
            padding: 0.75rem;
          }
            .sidebar-bottom-section{
            padding: 4rem 2rem;}

          .nav-link12, .nav-dropdown12 {
            padding: 0.75rem;
            font-size: 0.8125rem;
          }

          .section-label {
            padding-left: 0.75rem;
            padding-right: 0.75rem;
          }
        }

        @media (max-width: 360px) {
          .brand-content {
            min-width: 120px;
          }

          .app-title {
            font-size: 0.9375rem;
          }

          .menu-toggle-btn12 {
            width: 2rem;
            height: 2rem;
          }

          .home-action-btn {
            width: 2rem;
            height: 2rem;
            padding: 0;
          }
        }
      `}</style>
    </>
  );
}

export default Header;