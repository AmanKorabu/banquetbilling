import React, { useState, useEffect } from "react";
import { TiArrowBackOutline } from "react-icons/ti";
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { bookingApi } from "../services/bookingApi";

function EnqCompanySearch() {
    const navigate = useNavigate();
    const location = useLocation();

    // State declarations
    const [openConfirm, setOpenConfirm] = useState(false);
    const [companies, setCompanies] = useState([]);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);

    // Get current company name from location state
    const currentCompanyName = location.state?.currentCompanyName || "";

    // 🔹 Fetch companies using centralized bookingApi
    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                setLoading(true);
                setError("");

                const hotelId = localStorage.getItem("hotel_id");
                if (!hotelId) {
                    setError("No hotel_id found, please login again");
                    setLoading(false);
                    return;
                }

                console.log("🔍 Searching companies with term:", search);

                const response = await bookingApi.searchCompanies(search);
                console.log("📦 API Response:", response);

                // Handle different response structures
                if (Array.isArray(response)) {
                    setCompanies(response);
                } else if (response && Array.isArray(response.result)) {
                    setCompanies(response.result);
                } else if (response && response.data) {
                    setCompanies(response.data);
                } else if (response && typeof response === 'object') {
                    const possibleArrays = Object.values(response).filter(val => Array.isArray(val));
                    if (possibleArrays.length > 0) {
                        setCompanies(possibleArrays[0]);
                    } else {
                        setCompanies([]);
                        setError("No companies data found in response");
                    }
                } else {
                    setCompanies([]);
                    setError("No results found or invalid response format");
                }
            } catch (err) {
                console.error("❌ Error fetching companies:", err);
                setError(`Failed to fetch companies: ${err.message}`);
                setCompanies([]);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(() => {
            if (search !== undefined) {
                fetchCompanies();
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [search]);

    // Set initial search value from current company name
    useEffect(() => {
        if (currentCompanyName) {
            setSearch(currentCompanyName);
        }
    }, [currentCompanyName]);

    // Back button handlers
    const handleBackClick = () => setOpenConfirm(true);
    const handleConfirm = () => {
        setOpenConfirm(false);
        navigate("/new-enquiry");
    };
    const handleCancel = () => setOpenConfirm(false);

    // Handle company selection
    const handleSelect = (company) => {
        console.log("✅ Selected company:", company);

        const selectedCompany = {
            CompanyName: company.CompanyName || company.Name || company.companyName || company.LedgerName || "",
            Name: company.Name || company.CompanyName || company.companyName || company.LedgerName || "",
            companyName: company.companyName || company.CompanyName || company.Name || company.LedgerName || "",
            LedgerName: company.LedgerName || company.CompanyName || company.Name || company.companyName || "",
            CompName: company.CompName || company.CompanyName || company.Name || company.companyName || "",
            original: company
        };

        console.log("📤 Sending company data to NewEnquiry:", selectedCompany);

        navigate("/new-enquiry", {
            state: {
                selectedCompany: selectedCompany
            }
        });
    };

    // Helper function to get company display name
    const getCompanyDisplayName = (company) => {
        return company.LedgerName || company.Name || company.companyName || company.CompanyName || "N/A";
    };

    return (
        <>
            {/* Header Section */}
            <div className="search-header">
                <button
                    type="button"
                    onClick={handleBackClick}
                    className="search-back-btn"
                >
                    <TiArrowBackOutline size={24} color="white" />
                </button>
                <h1 className="search-title">
                    Search Company
                </h1>
            </div>

            {/* Confirmation Dialog */}
            <Dialog
                open={openConfirm}
                onClose={handleCancel}
                PaperProps={{
                    className: "search-dialog"
                }}
            >
                <DialogTitle className="search-dialog-title">
                    {"Go Back?"}
                </DialogTitle>
                <DialogContent className="search-dialog-content">
                    <DialogContentText className="search-dialog-text">
                        Are you sure you want to go back? Unsaved changes will be lost.
                    </DialogContentText>
                </DialogContent>
                <DialogActions className="search-dialog-actions">
                    <Button
                        onClick={handleCancel}
                        className="search-dialog-btn"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        color="error"
                        autoFocus
                        className="search-dialog-btn"
                    >
                        Yes, Go Back
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Main Content */}
            <div className="search-container">
                {/* Search Section */}
                <form onSubmit={(e) => e.preventDefault()}>
                    <div className="search-form">
                        <input
                            type="text"
                            placeholder="Search Company..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            autoFocus
                            className="search-input"
                        />
                    </div>
                </form>

                {/* Loading State */}
                {loading && (
                    <div className="search-loading">
                        <div className="search-loading-icon">🔍</div>
                        Searching companies...
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="search-error">
                        ❌ {error}
                    </div>
                )}
                {/* Results Table */}
                <div className="search-table-container">
                    <table className="search-table">
                        <thead>
                            <tr>
                                <th>No.</th>
                                <th>Company Name</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {companies.map((company, index) => (
                                <tr key={company.LedgerId || company.id || index}>
                                    <td>{index + 1}</td>
                                    <td>
                                        <div className="item-name">
                                            {getCompanyDisplayName(company)}
                                        </div>
                                    </td>
                                    <td>
                                        <button
                                            onClick={() => handleSelect(company)}
                                            className="search-select-btn"
                                        >
                                            Select
                                        </button>
                                    </td>
                                </tr>
                            ))}

                            {/* Empty State */}
                            {companies.length === 0 && !loading && !error && (
                                <tr>
                                    <td colSpan="3" className="search-empty-state">
                                        <div className="search-empty-icon">🔍</div>
                                        {search ? "No companies found" : "Start typing to search companies"}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Results Count */}
                {companies.length > 0 && !loading && (
                    <div className="search-results-count">
                        Showing {companies.length} company{companies.length !== 1 ? 's' : ''}
                    </div>
                )}
            </div>
        </>
    );
}

export default EnqCompanySearch;