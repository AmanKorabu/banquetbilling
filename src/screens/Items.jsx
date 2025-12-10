import React, { useState, useEffect } from "react";
import { TiArrowBackOutline } from "react-icons/ti";
import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Button,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { 
    LuSquareMousePointer, 
    LuSearch, 
    LuPlus,
    LuChevronDown,
    LuChevronUp,
    LuPackage,
    LuRefreshCw
} from "react-icons/lu";
import useEscapeNavigate from "../hooks/EscapeNavigate";

function Items() {
    const navigate = useNavigate();
    useEscapeNavigate('/new-booking');
    
    // --- State Management ---
    const [openConfirm, setOpenConfirm] = useState(false);
    const [itemsList, setItemsList] = useState([]);
    const [search, setSearch] = useState("");
    const [error, setError] = useState("");
    const [expandedItem, setExpandedItem] = useState(null);
    const [menus, setMenus] = useState({});
    const [loading, setLoading] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState("all");

    // --- Fetch Items ---
    useEffect(() => {
        const fetchItems = async () => {
            setLoading(true);
            try {
                const hotelId = localStorage.getItem("hotel_id");
                if (!hotelId) {
                    setError("No hotel_id found. Please login again.");
                    setLoading(false);
                    return;
                }

                const response = await axios.get("/banquetapi/search_pack.php", {
                    params: { 
                        hotel_id: hotelId, 
                        search_param: search 
                    },
                });

                if (response.status === 200 && Array.isArray(response.data.result)) {
                    setItemsList(response.data.result);
                    setError("");
                } else {
                    setItemsList([]);
                    setError("No items found matching your search.");
                }
            } catch (err) {
                console.error("❌ Error fetching items:", err);
                setError("Failed to fetch items. Please check your connection.");
            } finally {
                setLoading(false);
            }
        };

        const delayDebounce = setTimeout(() => {
            fetchItems();
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [search]);

    // --- Back Confirmation Dialog ---
    const handleBackClick = () => setOpenConfirm(true);
    const handleConfirm = () => {
        setOpenConfirm(false);
        navigate("/new-booking");
    };
    const handleCancel = () => setOpenConfirm(false);

    // --- Select Item Logic ---
    const handleItemClick = (item) => {
        if (!item.cats || item.cats.length === 0) {
            navigate("/new-booking", { 
                state: { 
                    selectedItem: item,
                    timestamp: Date.now()
                } 
            });
            return;
        }

        navigate("/item-menu", { 
            state: { 
                selectedItem: item,
                timestamp: Date.now()
            } 
        });
    };

    // --- Expand Category Headings Only ---
    const toggleExpand = async (item) => {
        if (expandedItem === item.PackageId) {
            setExpandedItem(null);
            return;
        }

        setLoading(true);
        try {
            const response = await axios.get(
                "/banquetapi/get_pack_menus_disp.php",
                {
                    params: {
                        pack_id: item.PackageId,
                        sub_cat_id: 0,
                        pass_srno: 0,
                    },
                }
            );

            if (response.status === 200 && response.data.category) {
                const defaultCategories = response.data.category.filter(
                    (cat) => String(cat.CatSrNo).trim() === "1"
                );
                setMenus((prev) => ({
                    ...prev,
                    [item.PackageId]: defaultCategories,
                }));
            } else {
                setMenus((prev) => ({ ...prev, [item.PackageId]: [] }));
            }

            setExpandedItem(item.PackageId);
        } catch (error) {
            console.error("Error fetching menus:", error);
            setError("Failed to load menus. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // --- Filter Items ---
    const getFilteredItems = () => {
        if (selectedFilter === "withMenu") {
            return itemsList.filter(item => item.cats && item.cats.length > 0);
        }
        if (selectedFilter === "withoutMenu") {
            return itemsList.filter(item => !item.cats || item.cats.length === 0);
        }
        return itemsList;
    };

    // --- Reset Filters ---
    const handleReset = () => {
        setSearch("");
        setSelectedFilter("all");
    };

    const filteredItems = getFilteredItems();

    return (
        <div className="items-selection-page">
            {/* Header */}
            <div className="page-headerr">
                <div className="header-wrapper">
                    <div className="header-main">
                        <button 
                            className="back-navigation-btn"
                            onClick={handleBackClick}
                        >
                            <TiArrowBackOutline size={24} />
                        </button>
                        <div className="page-title-section">
                            <LuPackage size={28} className="title-icon" />
                            <h1 className="page-heading">Select Items</h1>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="page-content-wrapper">
                {/* Search and Filter Section */}
                <div className="search-filter-panel">
                    <div className="panel-content">
                        <div className="search-controls">
                            <div className="search-input-container">
                               
                                <input
                                    type="text"
                                    placeholder="Search items by name..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="search-field"
                                />
                            </div>
                            
                            <div className="filter-controls">
                                <div className="filter-options-group">
                                    <button 
                                        className={`filter-option ${selectedFilter === 'all' ? 'active-filter' : ''}`}
                                        onClick={() => setSelectedFilter('all')}
                                    >
                                        All Items
                                    </button>
                                    <button 
                                        className={`filter-option ${selectedFilter === 'withMenu' ? 'active-filter' : ''}`}
                                        onClick={() => setSelectedFilter('withMenu')}
                                    >
                                        With Menu
                                    </button>
                                    <button 
                                        className={`filter-option ${selectedFilter === 'withoutMenu' ? 'active-filter' : ''}`}
                                        onClick={() => setSelectedFilter('withoutMenu')}
                                    >
                                        Without Menu
                                    </button>
                                </div>
                                
                                <button 
                                    className="filter-reset-btn"
                                    onClick={handleReset}
                                >
                                    <LuRefreshCw size={16} />
                                    Reset
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="loading-indicator">
                        <div className="loading-spinner-animation"></div>
                        <p className="loading-text">Loading items...</p>
                    </div>
                )}

                {/* Error Message */}
                {error && !loading && (
                    <div className="error-display">
                        <p className="error-message-text">{error}</p>
                    </div>
                )}

                {/* Items Table */}
                {!loading && (
                    <div className="items-table-wrapper">
                        <div className="table-container">
                            <table className="items-data-table">
                                <thead>
                                    <tr>
                                        <th className="column-number">No.</th>
                                        <th className="column-name">Item Name</th>
                                        <th className="column-menu">Menu</th>
                                        <th className="column-actions">Actions</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredItems.length === 0 && !error && (
                                        <tr className="empty-data-row">
                                            <td colSpan="4">
                                                <div className="empty-state-display">
                                                    <LuPackage size={48} />
                                                    <p className="empty-state-text">No items found</p>
                                                    <p className="empty-state-subtext">Try adjusting your search or filters</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}

                                    {filteredItems.map((item, index) => (
                                        <React.Fragment key={item.PackageId}>
                                            <tr className="data-row">
                                                <td className="column-number">
                                                    <div className="row-number">{index + 1}</div>
                                                </td>
                                                <td className="column-name">
                                                    <div className="item-info">
                                                        <LuPackage size={18} className="item-icon" />
                                                        <span className="item-name-text">{item.Name}</span>
                                                    </div>
                                                </td>
                                                <td className="column-menu">
                                                    {item.cats && item.cats.length > 0 ? (
                                                        <span className="menu-status-badge has-menu-status">
                                                            Has Menu
                                                        </span>
                                                    ) : (
                                                        <span className="menu-status-badge no-menu-status">
                                                            No Menu
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="column-actions">
                                                    <div className="action-buttons-group">
                                                        {item.cats && item.cats.length > 0 ? (
                                                            <>
                                                                <button 
                                                                    className="view-categories-btn"
                                                                    onClick={() => toggleExpand(item)}
                                                                >
                                                                    {expandedItem === item.PackageId ? (
                                                                        <>
                                                                            <LuChevronUp size={16} />
                                                                            Hide Categories
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <LuChevronDown size={16} />
                                                                            View Categories
                                                                        </>
                                                                    )}
                                                                </button>
                                                                <button 
                                                                    className="select-item-btn"
                                                                    onClick={() => handleItemClick(item)}
                                                                >
                                                                    <LuSquareMousePointer size={16} />
                                                                    Select Item
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <button 
                                                                className="select-item-btn primary-select"
                                                                onClick={() => handleItemClick(item)}
                                                            >
                                                                Select Item
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>

                                            {/* Expanded Categories */}
                                            {expandedItem === item.PackageId &&
                                                menus[item.PackageId] &&
                                                menus[item.PackageId].length > 0 && (
                                                <tr className="categories-row">
                                                    <td colSpan="4">
                                                        <div className="categories-panel">
                                                            <div className="categories-header">
                                                                <h4 className="categories-title">Available Categories</h4>
                                                            </div>
                                                            <div className="categories-grid-layout">
                                                                {menus[item.PackageId].map((cat, i) => (
                                                                    <div key={i} className="category-item-card">
                                                                        <div className="category-item-content">
                                                                            <span className="category-name-text">{cat.CategoryName}</span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Add New Item Button */}
                <div className="add-new-item-section">
                    <button className="add-new-item-btn">
                        <LuPlus size={20} />
                        Add New Item
                    </button>
                </div>
            </div>

            {/* Back Confirmation Dialog */}
            <Dialog open={openConfirm} onClose={handleCancel} className="confirmation-modal">
                <DialogTitle className="modal-title">Leave this page?</DialogTitle>
                <DialogContent>
                    <DialogContentText className="modal-message">
                        Are you sure you want to go back? Any unsaved changes will be lost.
                    </DialogContentText>
                </DialogContent>
                <DialogActions className="modal-actions">
                    <Button onClick={handleCancel} className="modal-cancel-btn">
                        Cancel
                    </Button>
                    <Button onClick={handleConfirm} className="modal-confirm-btn" autoFocus>
                        Yes, Go Back
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Styles */}
            <style>{`
                .items-selection-page {
                    min-height: 100vh;
                    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                }

                /* Header Styles */
                .page-headerr {
                    background: linear-gradient(135deg, #3f5771 0%, #2c3e50 100%);
                    border-radius: 0 0 20px 20px;
                    margin-bottom: 10px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                }

                .header-wrapper {
                    padding: 10px 32px;
                    position: relative;
                    z-index: 1;
                }

                .header-main {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    margin-bottom: 12px;
                }

                .back-navigation-btn {
                    background: rgba(255, 255, 255, 0.1);
                    border: none;
                    border-radius: 10px;
                    padding: 12px;
                    cursor: pointer;
                    color: white;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .back-navigation-btn:hover {
                    background: rgba(255, 255, 255, 0.2);
                    transform: translateX(-2px);
                }

                .page-title-section {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    flex: 1;
                }

                .title-icon {
                    color: #4ECDC4;
                }

                .page-heading {
                    margin: 0;
                    color: white;
                    font-size: 28px;
                    font-weight: 700;
                    letter-spacing: -0.5px;
                }

                /* Main Content */
                .page-content-wrapper {
                    padding: 0 32px;
                    max-width: 1400px;
                    margin: 0 auto;
                }

                /* Search and Filter Panel */
                .search-filter-panel {
                    background: white;
                    border-radius: 16px;
                    border: 1px solid #e2e8f0;
                    margin-bottom: 24px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
                    overflow: hidden;
                }

                .panel-content {
                    padding: 24px;
                }

                .search-controls {
                    display: flex;
                    gap: 24px;
                    align-items: center;
                }

                .search-input-container {
                    flex: 1;
                    position: relative;
                }

                .search-indicator {
                    position: absolute;
                    left: 16px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #64748B;
                }

                .search-field {
                    width: 100%;
                    padding: 14px 16px 14px 48px;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    font-size: 15px;
                    background: #f8fafc;
                    transition: all 0.3s ease;
                }

                .search-field:focus {
                    outline: none;
                    border-color: #3B82F6;
                    background: white;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }

                .filter-controls {
                    display: flex;
                    gap: 16px;
                    align-items: center;
                }

                .filter-options-group {
                    display: flex;
                    gap: 8px;
                    background: #f8fafc;
                    padding: 4px;
                    border-radius: 12px;
                }

                .filter-option {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 8px;
                    background: transparent;
                    color: #64748B;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .filter-option.active-filter {
                    background: white;
                    color: #3B82F6;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }

                .filter-option:hover:not(.active-filter) {
                    background: rgba(255, 255, 255, 0.5);
                }

                .filter-reset-btn {
                    padding: 10px 20px;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    background: white;
                    color: #64748B;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.3s ease;
                }

                .filter-reset-btn:hover {
                    border-color: #94a3b8;
                    color: #475569;
                }

                /* Loading State */
                .loading-indicator {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 60px 0;
                    gap: 16px;
                }

                .loading-spinner-animation {
                    width: 48px;
                    height: 48px;
                    border: 3px solid #e2e8f0;
                    border-top-color: #3B82F6;
                    border-radius: 50%;
                    animation: spinner-rotation 1s linear infinite;
                }

                @keyframes spinner-rotation {
                    to { transform: rotate(360deg); }
                }

                .loading-text {
                    color: #64748B;
                    font-size: 14px;
                    margin: 0;
                }

                /* Error Display */
                .error-display {
                    background: #FEF2F2;
                    border: 1px solid #FECACA;
                    border-radius: 12px;
                    padding: 20px;
                    margin-bottom: 24px;
                }

                .error-message-text {
                    color: #DC2626;
                    margin: 0;
                    font-size: 14px;
                    text-align: center;
                }

                /* Items Table */
                .items-table-wrapper {
                    background: white;
                    border-radius: 16px;
                    border: 1px solid #e2e8f0;
                    overflow: hidden;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
                }

                .table-container {
                    overflow-x: auto;
                }

                .items-data-table {
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 0;
                }

                .items-data-table thead {
                    background: #f8fafc;
                }

                .items-data-table th {
                    padding: 20px 24px;
                    text-align: left;
                    color: #475569;
                    font-size: 13px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    border-bottom: 2px solid #e2e8f0;
                }

                .items-data-table td {
                    padding: 20px 24px;
                    border-bottom: 1px solid #f1f5f9;
                }

                .column-number {
                    width: 80px;
                }

                .column-name {
                    width: 40%;
                }

                .column-menu {
                    width: 120px;
                }

                .column-actions {
                    width: 250px;
                }

                /* Data Row */
                .data-row:hover {
                    background: #f8fafc;
                }

                .row-number {
                    font-size: 15px;
                    color: #64748B;
                    font-weight: 500;
                }

                .item-info {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .item-icon {
                    color: #3B82F6;
                }

                .item-name-text {
                    font-size: 16px;
                    font-weight: 500;
                    color: #1e293b;
                }

                /* Menu Status Badges */
                .menu-status-badge {
                    display: inline-block;
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 600;
                }

                .menu-status-badge.has-menu-status {
                    background: #DCFCE7;
                    color: #166534;
                }

                .menu-status-badge.no-menu-status {
                    background: #F3F4F6;
                    color: #6B7280;
                }

                /* Action Buttons */
                .action-buttons-group {
                    display: flex;
                    gap: 12px;
                }

                .view-categories-btn {
                    padding: 10px 16px;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    background: white;
                    color: #64748B;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.3s ease;
                }

                .view-categories-btn:hover {
                    border-color: #94a3b8;
                    color: #475569;
                    background: #f8fafc;
                }

                .select-item-btn {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 8px;
                    background: #3B82F6;
                    color: white;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.3s ease;
                }

                .select-item-btn:hover {
                    background: #2563EB;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
                }

                .select-item-btn.primary-select {
                    padding: 12px 24px;
                    font-size: 15px;
                }

                /* Empty Data Row */
                .empty-data-row td {
                    padding: 80px 24px;
                }

                .empty-state-display {
                    text-align: center;
                    padding: 40px 0;
                }

                .empty-state-display svg {
                    color: #94a3b8;
                    margin-bottom: 16px;
                }

                .empty-state-text {
                    color: #64748B;
                    margin: 0;
                    font-size: 16px;
                }

                .empty-state-subtext {
                    color: #94a3b8;
                    font-size: 14px;
                    margin-top: 4px;
                }

                /* Categories Row */
                .categories-row {
                    background: #f8fafc;
                }

                .categories-row td {
                    padding: 0;
                    border-bottom: 1px solid #e2e8f0;
                }

                .categories-panel {
                    padding: 24px;
                }

                .categories-header {
                    margin-bottom: 16px;
                }

                .categories-title {
                    margin: 0;
                    color: #475569;
                    font-size: 14px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .categories-grid-layout {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 12px;
                }

                .category-item-card {
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 10px;
                    padding: 16px;
                    transition: all 0.3s ease;
                }

                .category-item-card:hover {
                    border-color: #3B82F6;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
                }

                .category-item-content {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .category-name-text {
                    font-size: 14px;
                    color: #1e293b;
                    font-weight: 500;
                }

                /* Add New Item Section */
                .add-new-item-section {
                    padding: 32px 0;
                    text-align: center;
                }

                .add-new-item-btn {
                    padding: 14px 32px;
                    border: 2px dashed #e2e8f0;
                    border-radius: 12px;
                    background: white;
                    color: #64748B;
                    font-size: 15px;
                    font-weight: 500;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                    transition: all 0.3s ease;
                }

                .add-new-item-btn:hover {
                    border-color: #3B82F6;
                    color: #3B82F6;
                    background: #f0f9ff;
                }

                /* Dialog Styles */
                .confirmation-modal {
                    border-radius: 16px;
                }

                .modal-title {
                    font-size: 20px !important;
                    font-weight: 600 !important;
                    color: #1e293b !important;
                    padding: 24px 24px 0 24px !important;
                }

                .modal-message {
                    color: #64748B !important;
                    font-size: 15px !important;
                    line-height: 1.6 !important;
                }

                .modal-actions {
                    padding: 16px 24px 24px 24px !important;
                }

                .modal-cancel-btn {
                    color: #64748B !important;
                    text-transform: none !important;
                    font-weight: 500 !important;
                    padding: 10px 20px !important;
                }

                .modal-confirm-btn {
                    background: #EF4444 !important;
                    color: white !important;
                    text-transform: none !important;
                    font-weight: 500 !important;
                    padding: 10px 20px !important;
                    border-radius: 8px !important;
                }

                .modal-confirm-btn:hover {
                    background: #DC2626 !important;
                }

                /* Responsive Design */
                @media (max-width: 1024px) {
                    .search-controls {
                        flex-direction: column;
                        align-items: stretch;
                    }
                    
                    .filter-controls {
                        flex-direction: column;
                        align-items: stretch;
                    }
                    
                    .filter-options-group {
                        justify-content: center;
                    }
                }

                @media (max-width: 768px) {
                    .page-content-wrapper {
                        padding: 0 16px;
                    }
                    
                    .header-wrapper {
                        padding: 20px;
                    }
                    
                    .page-heading {
                        font-size: 20px;
                    }
                    
                    .items-data-table th,
                    .items-data-table td {
                        padding: 16px;
                    }
                    
                    .action-buttons-group {
                        flex-direction: column;
                        gap: 8px;
                    }
                    
                    .select-item-btn,
                    .view-categories-btn {
                        width: 100%;
                        justify-content: center;
                    }
                }

                @media (max-width: 480px) {
                    .header-main {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 12px;
                    }
                    
                    .categories-grid-layout {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
}

export default Items;