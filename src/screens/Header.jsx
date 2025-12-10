import React, { useEffect, useRef, useState } from "react";
import { RxHamburgerMenu } from "react-icons/rx";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { TbLogout2 } from "react-icons/tb";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { IoHomeOutline, IoPeople, IoDocuments, IoSettings } from "react-icons/io5";
import { HiChevronRight, HiChevronDown } from "react-icons/hi";
import { PiTreeStructureThin } from "react-icons/pi";
import { DiJenkins } from "react-icons/di";


function Header() {

    const [isOpen, setIsOpen] = useState(false);
    const [masterOpen, setMasterOpen] = useState(false);
    const [sectionOpen, setSectionOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const sidebarRef = useRef(null);
    const buttonRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();

    const toggleSidebar = () => setIsOpen((p) => !p);
    const toggleMaster = () => setMasterOpen((p) => !p);
    const toggleSection = () => setSectionOpen((p) => !p);

    useEffect(() => {
        // Fixed keyboard shortcut handler
        const handleKeyPress = (event) => {
            // Check for Shift+N (Shift + N)
            if (event.shiftKey && event.key === 'X') {
                event.preventDefault();
                navigate('/dashboard');
            }
          
        };

        // Add event listener
        window.addEventListener('keydown', handleKeyPress);

        // Clean up event listener
        return () => {
            window.removeEventListener('keydown', handleKeyPress);
        };
    }, [navigate]); // Added navigate dependency

    // Handle responsive behavior
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);

            // Auto-close sidebar on mobile when resizing to desktop
            if (!mobile && isOpen) {
                setIsOpen(false);
            }
        };

        const handleClickOutside = (event) => {
            if (
                sidebarRef.current &&
                !sidebarRef.current.contains(event.target) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target)
            ) {
                setIsOpen(false);
                setMasterOpen(false);
                setSectionOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);

        return () => {
            window.removeEventListener('resize', handleResize);
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, [isOpen]);

    const handleLogout = () => {
        localStorage.removeItem("user");
        toast.error(
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <TbLogout2 /> Logged out successfully
            </div>
        );
        navigate("/");
    };

    const closeAll = () => {
        setIsOpen(false);
        setMasterOpen(false);
        setSectionOpen(false);
    };
    // Handle Escape key to close sidebar (with priority)
    useEffect(() => {
        const handleEscapeKey = (event) => {
            if (event.key === 'Escape') {
                // Only close sidebar if it's open and no other modal/dialog is active
                // You can add conditions here if you have other modals
                if (isOpen) {
                    event.preventDefault();
                    event.stopPropagation();
                    closeAll();
                    console.log('Sidebar closed with Escape key');
                }
            }
        };

        // Use capture phase to ensure we catch the event first
        document.addEventListener('keydown', handleEscapeKey, true);

        return () => {
            document.removeEventListener('keydown', handleEscapeKey, true);
        };
    }, [isOpen]);
    const isActivePath = (path) => location.pathname === path;
    const hotelName = localStorage.getItem('hotel_name')
    return (
        <>
            <ToastContainer position="top-right" autoClose={2000} />

            {/* Professional Header */}
            <header className="header">
                <div className="header-content">
                    {/* Left Section - Menu & Brand */}
                    <div className="header-left">
                        <div
                            className="menu-toggle"
                            ref={buttonRef}
                            onClick={toggleSidebar}
                        >
                            <RxHamburgerMenu size={20} />
                        </div>

                        <div className="brand-section">
                            <h1 className="brand-title">BanQuet</h1>
                            <p style={{ color: '#ff0000ff' }}> User- <span style={{ color: '#4be912ff', fontFamily: 'sans-serif' }}>
                                {hotelName}
                            </span>
                            </p>
                        </div>
                    </div>

                    {/* Right Section - Navigation */}
                    <div className="header-right">
                        <NavLink to="/dashboard" className="home-link">
                            <IoHomeOutline size={20} />
                        </NavLink>
                    </div>
                </div>
            </header>

            {/* Professional Sidebar */}
            <aside
                ref={sidebarRef}
                className={`sidebar ${isOpen ? "open" : "close"} ${isMobile ? "mobileV" : "desktop"}`}
            >
                {/* Sidebar Header */}
                <div className="sidebar-header">
                    <div className="sidebar-brand">
                        <div className="brand-logo">
                            <DiJenkins size={32} />
                        </div>
                        <div className="brand-text">
                            <h3 className="brand-name">Banquet Billing</h3>
                            <p className="brand-tagline">Management System </p>
                            <span style={{ color: 'red' }}>Version 0.1</span>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="sidebar-nav">
                    <ul>
                        {/* Dashboard */}
                        <li className={isActivePath("/dashboard") ? "active" : ""}>
                            <NavLink to="/dashboard" onClick={closeAll} className="nav-link">
                                <div className="nav-icon">
                                    <IoHomeOutline size={18} />
                                </div>
                                <span className="nav-text">Dashboard</span>
                                <div className="nav-indicator"></div>
                            </NavLink>
                        </li>

                        {/* MASTER MENU */}
                        <li className="nav-group">
                            <button
                                onClick={toggleMaster}
                                aria-expanded={masterOpen}
                                className="nav-dropdown"
                            >
                                <div className="nav-icon">
                                    <PiTreeStructureThin size={18} />
                                </div>
                                <span className="nav-text">Master</span>
                                <div className="nav-arrow">
                                    {masterOpen ? <HiChevronDown size={14} /> : <HiChevronRight size={14} />}
                                </div>
                            </button>

                            {/* Master Submenu */}
                            <ul className={`submenu ${masterOpen ? "open" : ""}`}>
                                <li className={isActivePath("/company-section") ? "active" : ""}>
                                    <NavLink to="/company-section" onClick={closeAll} className="submenu-link">
                                        <span>Company</span>
                                    </NavLink>
                                </li>

                                {/* SECTION COLLAPSIBLE */}
                                <li className="nested-group">
                                    <button
                                        onClick={toggleSection}
                                        aria-expanded={sectionOpen}
                                        className="submenu-dropdown"
                                    >
                                        <span>Section</span>
                                        <div className="nav-arrow">
                                            {sectionOpen ? <HiChevronDown size={12} /> : <HiChevronRight size={12} />}
                                        </div>
                                    </button>

                                    {/* Nested Section submenu */}
                                    <ul className={`nested-submenu ${sectionOpen ? "open" : ""}`}>
                                        <li className={isActivePath("/section/sectionmaster") ? "active" : ""}>
                                            <NavLink to="/section/sectionmaster" onClick={closeAll} className="nested-link">
                                                Section Master
                                            </NavLink>
                                        </li>
                                    </ul>
                                </li>
                            </ul>
                        </li>

                        {/* Customers */}
                        <li className={isActivePath("/customers") ? "active" : ""}>
                            <NavLink to="/customers" onClick={closeAll} className="nav-link">
                                <div className="nav-icon">
                                    <IoPeople size={18} />
                                </div>
                                <span className="nav-text">Customers</span>
                                <div className="nav-indicator"></div>
                            </NavLink>
                        </li>

                        {/* Reports */}
                        <li className={isActivePath("/reports") ? "active" : ""}>
                            <NavLink to="/reports" onClick={closeAll} className="nav-link">
                                <div className="nav-icon">
                                    <IoDocuments size={18} />
                                </div>
                                <span className="nav-text">Reports</span>
                                <div className="nav-indicator"></div>
                            </NavLink>
                        </li>

                        {/* Settings */}
                        <li className={isActivePath("/settings") ? "active" : ""}>
                            <NavLink to="/settings" onClick={closeAll} className="nav-link">
                                <div className="nav-icon">
                                    <IoSettings size={18} />
                                </div>
                                <span className="nav-text">Settings</span>
                                <div className="nav-indicator"></div>
                            </NavLink>
                        </li>

                        {/* Logout */}
                        <li className="logout-item">
                            <button onClick={handleLogout} className="logout-button">
                                <div className="nav-icon">
                                    <TbLogout2 size={18} />
                                </div>
                                <span className="nav-text">Logout</span>

                            </button>
                            <p style={{ color: '#fafff9ff' }}> User- <span style={{ color: '#70ff3bff', fontSize: 'large', fontFamily: 'sans-serif' }}>
                                {hotelName}
                            </span>
                            </p>
                        </li>
                    </ul>
                </nav>
            </aside>

            {/* Overlay for mobile */}
            {isMobile && isOpen && (
                <div className="sidebar-overlay" onClick={closeAll}></div>
            )}

            <style>{`
                /* Header Styles */
                .header {
                    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                    position: sticky;
                    top: 0;
                    z-index: 1000;
                    height: 70px;
                    display: flex;
                    align-items: center;
                    border-radius: 0 0 20px 20px;
                }

                .header-content {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    
                    width: 100%;
                    margin: 0 auto;
                    flex-direction: row;
                }

                .header-left {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    flex: 1;
                    min-width: 0;
                }

                .menu-toggle {
                    color: white;
                    cursor: pointer;
                    padding: 8px;
                    border-radius: 6px;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .menu-toggle:hover {
                    background: rgba(255, 255, 255, 0.1);
                }

                .brand-section {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    min-width: 0;
                }

                .brand-title {
                    font-size: 20px;
                    font-weight: 700;
                    color: white;
                    margin: 0;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    line-height: 1.2;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .brand-subtitle {
                    font-size: 11px;
                    color: rgba(255, 255, 255, 0.7);
                    margin: 0;
                    font-weight: 400;
                    line-height: 1.2;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .header-right {
                    flex-shrink: 0;
                    display: flex;
                    justify-content: flex-end;
                }

                .home-link {
                    color: white;
                    padding: 8px;
                    border-radius: 6px;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .home-link:hover {
                    background: rgba(255, 255, 255, 0.1);
                }

                /* Sidebar Styles */
                .sidebar {
                    position: fixed;
                    top: 0;
                    left: -320px;
                    width: 320px;
                    height: 100vh;
                    background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
                    color: #f8fafc;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    z-index: 1001;
                    box-shadow: 4px 0 30px rgba(0, 0, 0, 0.3);
                    border-right: 1px solid rgba(255, 255, 255, 0.1);
                    overflow-y: auto;
                }

                .sidebar.mobile {
                    width: 280px;
                    left: -280px;
                }

                .sidebar.open {
                    left: 0;
                }

                .sidebar.close {
                    left: -320px;
                }

                .sidebar.mobile.close {
                    left: -280px;
                }

                .sidebar-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    z-index: 1000;
                    backdrop-filter: blur(2px);
                }

                .sidebar-header {
                    padding: 20px 24px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    background: rgba(15, 23, 42, 0.8);
                }

                .sidebar-brand {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .brand-logo {
                    width: 50px;
                    height: 50px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
                    flex-shrink: 0;
                }

                .brand-text {
                    flex: 1;
                    min-width: 0;
                }

                .brand-name {
                    font-size: 16px;
                    font-weight: 700;
                    color: white;
                    margin: 0 0 2px 0;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .brand-tagline {
                    font-size: 11px;
                    color: rgba(255, 255, 255, 0.6);
                    margin: 0;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                /* Navigation Styles */
                .sidebar-nav {
                    padding: 16px 0;
                }

                .sidebar-nav ul {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }

                .nav-link, .nav-dropdown, .logout-button {
                    display: flex;
                    align-items: center;
                    width: 100%;
                    padding: 12px 24px;
                    color: #cbd5e1;
                    text-decoration: none;
                    border: none;
                    background: none;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    position: relative;
                    box-sizing: border-box;
                }

                .nav-icon {
                    width: 20px;
                    height: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-right: 12px;
                    opacity: 0.8;
                    flex-shrink: 0;
                }

                .nav-text {
                    flex: 1;
                    font-size: 14px;
                    font-weight: 500;
                    text-align: left;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .nav-arrow {
                    color: #94a3b8;
                    transition: transform 0.2s ease;
                    flex-shrink: 0;
                }

                .nav-indicator {
                    width: 3px;
                    height: 18px;
                    background: #667eea;
                    border-radius: 2px;
                    opacity: 0;
                    transition: opacity 0.2s ease;
                    flex-shrink: 0;
                }

                /* Hover States */
                .nav-link:hover, .nav-dropdown:hover {
                    background: rgba(255, 255, 255, 0.05);
                    color: white;
                }

                .nav-link:hover .nav-icon, .nav-dropdown:hover .nav-icon {
                    opacity: 1;
                }

                /* Active States */
                .nav-link.active {
                    background: linear-gradient(90deg, rgba(102, 126, 234, 0.15) 0%, transparent 100%);
                    color: #667eea;
                    border-right: 3px solid #667eea;
                }

                .nav-link.active .nav-icon {
                    opacity: 1;
                    color: #667eea;
                }

                .nav-link.active .nav-indicator {
                    opacity: 1;
                }

                /* Submenu Styles */
                .submenu {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                    max-height: 0;
                    overflow: hidden;
                    transition: max-height 0.3s ease;
                    background: rgba(15, 23, 42, 0.5);
                }

                .submenu.open {
                    max-height: 500px;
                }

                .submenu-link, .submenu-dropdown {
                    display: flex;
                    align-items: center;
                    padding: 10px 24px 10px 60px;
                    color: #94a3b8;
                    text-decoration: none;
                    border: none;
                    background: none;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-size: 13px;
                    box-sizing: border-box;
                    width: 100%;
                }

                .submenu-link:hover, .submenu-dropdown:hover {
                    color: white;
                    background: rgba(255, 255, 255, 0.03);
                }

                .submenu-link.active {
                    color: #667eea;
                    background: rgba(102, 126, 234, 0.1);
                }

                /* Nested Submenu */
                .nested-submenu {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                    max-height: 0;
                    overflow: hidden;
                    transition: max-height 0.3s ease;
                }

                .nested-submenu.open {
                    max-height: 200px;
                }

                .nested-link {
                    display: block;
                    padding: 8px 24px 8px 80px;
                    color: #94a3b8;
                    text-decoration: none;
                    font-size: 12px;
                    transition: all 0.2s ease;
                    box-sizing: border-box;
                }

                .nested-link:hover {
                    color: white;
                    background: rgba(255, 255, 255, 0.02);
                }

                .nested-link.active {
                    color: #667eea;
                }

                /* Logout */
                .logout-item {
                    margin-top: 20px;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                }

                .logout-button {
                    color: #fca5a5;
                }

                .logout-button:hover {
                    color: #fecaca;
                    background: rgba(239, 68, 68, 0.1);
                }

                /* Responsive Design */
                @media (max-width: 768px) {
                    .header {
                        height: 80px;
                    }

                    .header-content {
                        
                    }

                    .header-left {
                        gap: 12px;
                        flex: 1;
                    }

                    .brand-title {
                        font-size: 18px;
                    }

                    .brand-subtitle {
                        font-size: 10px;
                    }

                    .menu-toggle {
                        padding: 6px;
                    }

                    .home-link {
                        padding: 6px;
                    }
                }

                @media (max-width: 480px) {
                    .header-content {
                        
                    }

                    .header-left {
                        gap: 8px;
                    }

                    .brand-section {
                        display: flex;
                    }

                    .brand-title {
                        font-size: 16px;
                    }

                    .sidebar.mobile {
                        width: 260px;
                    }

                    .sidebar.mobile.close {
                        left: -260px;
                    }
                }

                @media (max-width: 360px) {
                    .brand-title {
                        font-size: 14px;
                    }

                    .brand-subtitle {
                        font-size: 9px;
                    }

                    .sidebar.mobile {
                        width: 240px;
                    }

                    .sidebar.mobile.close {
                        left: -240px;
                    }

                    .sidebar-header {
                        padding: 16px 20px;
                    }

                    .nav-link, .nav-dropdown, .logout-button {
                        padding: 10px 20px;
                    }

                    .submenu-link, .submenu-dropdown {
                        padding: 8px 20px 8px 52px;
                    }

                    .nested-link {
                        padding: 6px 20px 6px 68px;
                    }
                }
            `}</style>
        </>
    );
}

export default Header;