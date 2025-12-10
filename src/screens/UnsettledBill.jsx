import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Calendar,
    DollarSign,
    Filter,
    Download,
    Eye,
    Delete,
    AlertCircle,
    TrendingUp,
    Search,
    ChevronDown,
    ChevronUp,
    FileText,
    RefreshCw,
    MoreVertical,
    CreditCard,
    X,
    Building,
    CalendarOff,
    AlertTriangle,
    Trash,
    Edit
} from 'lucide-react';
import axios from 'axios';
import { format, parseISO, isValid, isBefore, isAfter, addDays, startOfDay, endOfDay } from 'date-fns';
import Header from './Header';
import useEscapeNavigate from '../hooks/EscapeNavigate';

const UnsettledBill = () => {
    const [bills, setBills] = useState([]);
    const [filteredBills, setFilteredBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEscapeNavigate('/dashboard')
    const [filters, setFilters] = useState({
        fromDate: '',
        toDate: '',
        status: 'all',
        searchTerm: '',
        sortBy: 'date',
        sortOrder: 'desc',
        loadAll: false
    });
    const [searchInput, setSearchInput] = useState('');
    const [dateError, setDateError] = useState('');
    const [selectedBill, setSelectedBill] = useState(null);
    const [showBillModal, setShowBillModal] = useState(false);

    const API_URL = '/banquetapi/get_unsettled_bill_list_all.php?hotel_id=290&venue_id=0&comp_id=0&party_id=0';

    // Floor function helper
    const floorValue = (value) => {
        return Math.floor(parseFloat(value) || 0);
    };

    // Parse date string from API format
    const parseDateString = useCallback((dateStr) => {
        if (!dateStr) return new Date();

        try {
            const cleanedStr = dateStr.trim();

            // Handle dd-MM-yyyy format (e.g., "27-02-2024 12:00 AM")
            if (cleanedStr.includes('-')) {
                // Extract date part (before any space)
                const datePart = cleanedStr.split(' ')[0];
                const [day, month, year] = datePart.split('-').map(Number);

                if (isNaN(day) || isNaN(month) || isNaN(year)) {
                    throw new Error('Invalid date format');
                }

                // Extract time if available
                let hour = 0, minute = 0;
                if (cleanedStr.includes(':')) {
                    const timeMatch = cleanedStr.match(/(\d{1,2}):(\d{2})/);
                    if (timeMatch) {
                        hour = parseInt(timeMatch[1]);
                        minute = parseInt(timeMatch[2]);

                        // Handle AM/PM
                        if (cleanedStr.toLowerCase().includes('pm') && hour < 12) {
                            hour += 12;
                        } else if (cleanedStr.toLowerCase().includes('am') && hour === 12) {
                            hour = 0;
                        }
                    }
                }

                const dateObj = new Date(year, month - 1, day, hour, minute);
                if (isValid(dateObj)) return dateObj;
            }

            // Try ISO format as fallback
            const isoDate = parseISO(cleanedStr);
            if (isValid(isoDate)) return isoDate;

            return new Date();
        } catch (err) {
            console.error('Error parsing date:', dateStr, err);
            return new Date();
        }
    }, []);

    // Format date for display in dd-MM-yyyy
    const formatDateDisplay = (date) => {
        try {
            if (!isValid(date)) return 'Invalid Date';
            return format(date, 'dd-MM-yyyy');
        } catch (err) {
            console.error('Error formatting date:', err);
            return 'Invalid Date';
        }
    };

    // Format time for display
    const formatTimeDisplay = (date) => {
        try {
            if (!isValid(date)) return 'Invalid Time';
            return format(date, 'hh:mm a');
        } catch (err) {
            console.error('Error formatting time:', err);
            return 'Invalid Time';
        }
    };

    // Parse from dd-MM-yyyy to Date object
    const parseDateFromDDMMYYYY = (dateStr) => {
        if (!dateStr) return null;
        try {
            const [day, month, year] = dateStr.split('-').map(Number);
            return new Date(year, month - 1, day);
        } catch (err) {
            console.error('Error parsing date:', err);
            return null;
        }
    };

    // Convert from dd-MM-yyyy to yyyy-MM-dd for input fields
    const convertToInputFormat = (dateStr) => {
        if (!dateStr) return '';
        try {
            const [day, month, year] = dateStr.split('-').map(Number);
            const date = new Date(year, month - 1, day);
            return isValid(date) ? format(date, 'yyyy-MM-dd') : '';
        } catch (err) {
            return '';
        }
    };

    // Convert from yyyy-MM-dd to dd-MM-yyyy
    const convertToDisplayFormat = (dateStr) => {
        if (!dateStr) return '';
        try {
            const date = parseISO(dateStr);
            return isValid(date) ? format(date, 'dd-MM-yyyy') : '';
        } catch (err) {
            return '';
        }
    };

    // Validate date range
    const validateDateRange = (fromDate, toDate) => {
        if (fromDate && toDate) {
            const from = parseDateFromDDMMYYYY(fromDate);
            const to = parseDateFromDDMMYYYY(toDate);

            if (from && to && isAfter(from, to)) {
                setDateError('To date cannot be earlier than From date');
                return false;
            }
        }
        setDateError('');
        return true;
    };

    // Set default dates (last 30 days) in dd-MM-yyyy format
    const setDefaultDates = () => {
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);

        return {
            fromDate: format(thirtyDaysAgo, 'dd-MM-yyyy'),
            toDate: format(today, 'dd-MM-yyyy')
        };
    };

    useEffect(() => {
        const defaultDates = setDefaultDates();
        setFilters(prev => ({
            ...prev,
            fromDate: defaultDates.fromDate,
            toDate: defaultDates.toDate
        }));
        fetchBills();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [bills, filters]);

    const fetchBills = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await axios.get(API_URL, {
                timeout: 10000,
                headers: {
                    'Cache-Control': 'no-cache'
                }
            });

            if (response.data && response.data.result) {
                const formattedBills = response.data.result.map(bill => {
                    const dateObj = parseDateString(bill.QuotationDate);
                    const billAmount = floorValue(bill.BillAmount);
                    const receivedAmount = floorValue(bill.ReceivedAmount);
                    const balance = floorValue(bill.Balance);
                    const discount = floorValue(bill.Discount);
                    const tds = floorValue(bill.TDS);

                    return {
                        ...bill,
                        BillAmount: billAmount,
                        Balance: balance,
                        ReceivedAmount: receivedAmount,
                        Discount: discount,
                        TDS: tds,
                        formattedDate: dateObj,
                        formattedDateDisplay: formatDateDisplay(dateObj),
                        formattedTimeDisplay: formatTimeDisplay(dateObj),
                        paymentPercentage: billAmount > 0
                            ? Math.floor((receivedAmount / billAmount) * 100)
                            : 0,
                        isOverdue: balance > 0 && isBefore(dateObj, addDays(new Date(), -30))
                    };
                });

                setBills(formattedBills);
                setFilteredBills(formattedBills);
            } else {
                throw new Error('No data received from server');
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to fetch bills. Please try again later.');
            console.error('Error fetching bills:', err);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        if (!bills.length) return;

        let filtered = [...bills];

        // Date filter - only apply if loadAll is false
        if (!filters.loadAll) {
            if (filters.fromDate) {
                const fromDate = parseDateFromDDMMYYYY(filters.fromDate);
                if (fromDate) {
                    const fromDateStart = startOfDay(fromDate);
                    filtered = filtered.filter(bill =>
                        isAfter(bill.formattedDate, fromDateStart) ||
                        formatDateDisplay(bill.formattedDate) === filters.fromDate
                    );
                }
            }

            if (filters.toDate) {
                const toDate = parseDateFromDDMMYYYY(filters.toDate);
                if (toDate) {
                    const toDateEnd = endOfDay(toDate);
                    filtered = filtered.filter(bill =>
                        isBefore(bill.formattedDate, toDateEnd) ||
                        formatDateDisplay(bill.formattedDate) === filters.toDate
                    );
                }
            }
        }

        // Status filter
        if (filters.status !== 'all') {
            filtered = filtered.filter(bill =>
                bill.Status.toLowerCase() === filters.status.toLowerCase()
            );
        }

        // Search filter
        if (filters.searchTerm.trim()) {
            const term = filters.searchTerm.toLowerCase().trim();
            filtered = filtered.filter(bill =>
                bill.PartyName?.toLowerCase().includes(term) ||
                bill.QuotationNo?.toLowerCase().includes(term) ||
                bill.FunctionName?.toLowerCase().includes(term) ||
                bill.BillingCompany?.toLowerCase().includes(term) ||
                bill.InvoiceId?.toString().includes(term)
            );
        }

        // Sorting
        filtered.sort((a, b) => {
            let aValue, bValue;

            switch (filters.sortBy) {
                case 'date':
                    aValue = a.formattedDate;
                    bValue = b.formattedDate;
                    break;
                case 'amount':
                    aValue = a.BillAmount;
                    bValue = b.BillAmount;
                    break;
                case 'balance':
                    aValue = a.Balance;
                    bValue = b.Balance;
                    break;
                case 'name':
                    aValue = a.PartyName;
                    bValue = b.PartyName;
                    break;
                case 'received':
                    aValue = a.ReceivedAmount;
                    bValue = b.ReceivedAmount;
                    break;
                case 'overdue':
                    aValue = a.isOverdue ? 1 : 0;
                    bValue = b.isOverdue ? 1 : 0;
                    break;
                default:
                    aValue = a.formattedDate;
                    bValue = b.formattedDate;
            }

            if (aValue instanceof Date) {
                return filters.sortOrder === 'asc'
                    ? aValue - bValue
                    : bValue - aValue;
            } else if (typeof aValue === 'string') {
                return filters.sortOrder === 'asc'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            } else {
                return filters.sortOrder === 'asc'
                    ? aValue - bValue
                    : bValue - aValue;
            }
        });

        setFilteredBills(filtered);
    };

    const handleFilterChange = (newFilters) => {
        // Validate dates if changing date filters
        if ((newFilters.fromDate !== undefined || newFilters.toDate !== undefined) && !newFilters.loadAll) {
            const fromDate = newFilters.fromDate !== undefined ? newFilters.fromDate : filters.fromDate;
            const toDate = newFilters.toDate !== undefined ? newFilters.toDate : filters.toDate;

            if (!validateDateRange(fromDate, toDate)) {
                return; // Don't update if validation fails
            }
        }

        setFilters(prev => ({ ...prev, ...newFilters }));
    };

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchInput(value);
        handleFilterChange({ searchTerm: value });
    };

    const clearSearch = () => {
        setSearchInput('');
        handleFilterChange({ searchTerm: '' });
    };

    const clearAllFilters = () => {
        const defaultDates = setDefaultDates();
        setFilters({
            fromDate: defaultDates.fromDate,
            toDate: defaultDates.toDate,
            status: 'all',
            searchTerm: '',
            sortBy: 'date',
            sortOrder: 'desc',
            loadAll: false
        });
        setSearchInput('');
        setDateError('');
    };

    const toggleLoadAll = () => {
        const newLoadAllState = !filters.loadAll;
        handleFilterChange({
            loadAll: newLoadAllState,
            // Clear date filters when enabling Load All
            ...(newLoadAllState ? { fromDate: '', toDate: '' } : {})
        });
        setDateError('');
    };

    // const handleViewBill = (bill) => {
    //     setSelectedBill(bill);
    //     setShowBillModal(true);
    // };

    const closeBillModal = () => {
        setShowBillModal(false);
        setSelectedBill(null);
    };

    const handleSettleBill = async (billId) => {
        if (window.confirm('Are you sure you want to mark this bill as settled?')) {
            try {
                // API call to settle bill
                const response = await axios.post('/banquetapi/settle_bill.php', {
                    bill_id: billId
                });

                if (response.data.success) {
                    alert('Bill marked as settled successfully!');
                    fetchBills(); // Refresh data
                } else {
                    alert('Failed to settle bill: ' + response.data.message);
                }
            } catch (err) {
                alert('Error settling bill: ' + err.message);
            }
        }
    };

    const handleDownloadInvoice = (bill) => {
        // Generate download URL
        const downloadUrl = `/banquetapi/download_invoice.php?invoice_id=${bill.QuotationId}`;
        window.open(downloadUrl, '_blank');
    };

    const getStatusBadge = (status) => {
        const statusClass = `status-badge ${status.toLowerCase()}`;
        return <span className={statusClass}>{status}</span>;
    };

    // Calculate statistics
    const stats = useMemo(() => {
        return {
            totalBills: filteredBills.length,
            totalAmount: floorValue(filteredBills.reduce((sum, bill) => sum + bill.BillAmount, 0)),
            totalBalance: floorValue(filteredBills.reduce((sum, bill) => sum + bill.Balance, 0)),
            totalReceived: floorValue(filteredBills.reduce((sum, bill) => sum + bill.ReceivedAmount, 0)),
            totalDiscount: floorValue(filteredBills.reduce((sum, bill) => sum + bill.Discount, 0)),
            totalTDS: floorValue(filteredBills.reduce((sum, bill) => sum + bill.TDS, 0)),
            confirmedCount: filteredBills.filter(bill => bill.Status.toLowerCase() === 'confirmed').length,
            tentativeCount: filteredBills.filter(bill => bill.Status.toLowerCase() === 'tentative').length,
            waitlistedCount: filteredBills.filter(bill => bill.Status.toLowerCase() === 'waitlisted').length,
            overdueCount: filteredBills.filter(bill => bill.isOverdue).length,
            avgBalance: filteredBills.length > 0
                ? floorValue(filteredBills.reduce((sum, bill) => sum + bill.Balance, 0) / filteredBills.length)
                : 0,
            collectionRate: filteredBills.reduce((sum, bill) => sum + bill.BillAmount, 0) > 0
                ? Math.floor((filteredBills.reduce((sum, bill) => sum + bill.ReceivedAmount, 0) /
                    filteredBills.reduce((sum, bill) => sum + bill.BillAmount, 0)) * 100)
                : 0
        };
    }, [filteredBills]);

    const hasActiveFilters = () => {
        return filters.fromDate || filters.toDate || filters.status !== 'all' || filters.searchTerm || filters.loadAll;
    };

    const formatCurrency = (amount) => {
        return `₹${amount.toLocaleString('en-IN')}`;
    };

    if (loading) {
        return (
            <div className="unsettled-bill">
                <Header />
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading unsettled bills...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="unsettled-bill">
                <Header />
                <div className="error-container">
                    <AlertCircle size={48} />
                    <h2>Error Loading Data</h2>
                    <p>{error}</p>
                    <button onClick={fetchBills} className="retry-button">
                        <RefreshCw size={16} />
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <Header />
            <div className="unsettled-bill">
                <div className="dashboard-container">
                    {/* Stats Cards - Compact */}
                    <div className="stats-grid compact">
                        <div className="stat-card">
                            <div className="stat-content">
                                <div className="stat-icon total">
                                    <FileText size={18} />
                                </div>
                                <div>
                                    <div className="stat-value">{stats.totalBills}</div>
                                    <div className="stat-label">Total Bills</div>
                                </div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-content">
                                <div className="stat-icon amount">
                                    <DollarSign size={18} />
                                </div>
                                <div>
                                    <div className="stat-value">{formatCurrency(stats.totalAmount)}</div>
                                    <div className="stat-label">Total Amount</div>
                                </div>
                            </div>
                        </div>
                        <div className="stat-card highlight">
                            <div className="stat-content">
                                <div className="stat-icon balance">
                                    <AlertCircle size={18} />
                                </div>
                                <div>
                                    <div className="stat-value">{formatCurrency(stats.totalBalance)}</div>
                                    <div className="stat-label">Outstanding</div>
                                </div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-content">
                                <div className="stat-icon received">
                                    <TrendingUp size={18} />
                                </div>
                                <div>
                                    <div className="stat-value">{formatCurrency(stats.totalReceived)}</div>
                                    <div className="stat-label">Received</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters Bar - Always Visible */}
                    <div className="filters-bar always-visible">
                        <div className="search-container">
                            <div className="search-input-wrapper">
                                <input
                                    type="text"
                                    placeholder="Search by party, invoice, function..."
                                    value={searchInput}
                                    onChange={handleSearchChange}
                                    className="search-input"
                                />
                                {searchInput && (
                                    <button className="clear-search" onClick={clearSearch}>
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                            <Search size={16} className="search-iconn" />
                            <button className="btn btn-primary" onClick={fetchBills}>
                                <RefreshCw size={16} />
                                Refresh
                            </button>
                            {/* {hasActiveFilters() && (
                                <button className="btn btn-clear" onClick={clearAllFilters}>
                                    Clear All
                                </button>
                            )} */}
                        </div>

                        {/* Expanded Filters - Always Visible */}
                        <div className="expanded-filters always-visible">
                            {dateError && (
                                <div className="date-error">
                                    <AlertTriangle size={14} />
                                    <span>{dateError}</span>
                                </div>
                            )}
                            <div className="filter-row">
                                <div className="filter-group">
                                    <div className="load-all-toggle">
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={filters.loadAll}
                                                onChange={toggleLoadAll}
                                            />
                                            <span className="toggle-label">
                                                <CalendarOff size={14} />
                                                Load All Records
                                            </span>
                                        </label>
                                        {filters.loadAll && (
                                            <span className="load-all-badge">All dates included</span>
                                        )}
                                    </div>
                                </div>
                                <div className="filter-group">
                                    <label><Calendar size={14} /> From Date</label>
                                    <div className="date-input-wrapper">
                                        <input
                                            type="date"
                                            value={convertToInputFormat(filters.fromDate)}
                                            
                                            onChange={(e) => handleFilterChange({
                                                fromDate: convertToDisplayFormat(e.target.value)
                                            })}
                                            disabled={filters.loadAll}
                                            className={filters.loadAll ? 'disabled' : ''}
                                            max={convertToInputFormat(filters.toDate) || ''}
                                            
                                        />
                                        {/* {filters.fromDate && !filters.loadAll && (
                                            <span className="date-display">{filters.fromDate}</span>
                                        )} */}
                                    </div>
                                </div>
                                <div className="filter-group">
                                    <label><Calendar size={14} /> To Date</label>
                                    <div className="date-input-wrapper">
                                        <input
                                            type="date"
                                            value={convertToInputFormat(filters.toDate)}
                                            onChange={(e) => handleFilterChange({
                                                toDate: convertToDisplayFormat(e.target.value)
                                            })}
                                            disabled={filters.loadAll}
                                            className={filters.loadAll ? 'disabled' : ''}
                                            min={convertToInputFormat(filters.fromDate)}
                                        />
                                        {/* {filters.toDate && !filters.loadAll && (
                                            <span className="date-display">{filters.toDate}</span>
                                        )} */}
                                    </div>
                                </div>
                                <div className="filter-group">
                                    <label>Status</label>
                                    <select
                                        value={filters.status}
                                        onChange={(e) => handleFilterChange({ status: e.target.value })}
                                    >
                                        <option value="all">All Status</option>
                                        <option value="confirmed">Confirmed</option>
                                        <option value="tentative">Tentative</option>
                                        <option value="waitlisted">Waitlisted</option>
                                    </select>
                                </div>
                                <div className="filter-group">
                                    <label>Sort By</label>
                                    <div className="sort-controls">
                                        <select
                                            value={filters.sortBy}
                                            onChange={(e) => handleFilterChange({ sortBy: e.target.value })}
                                        >
                                            <option value="date">Date</option>
                                            <option value="amount">Amount</option>
                                            <option value="balance">Balance</option>
                                            <option value="name">Party Name</option>
                                            <option value="received">Received Amount</option>
                                            <option value="overdue">Overdue Status</option>
                                        </select>
                                        <button
                                            className="btn-sort-toggle"
                                            onClick={() => handleFilterChange({
                                                sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc'
                                            })}
                                        >
                                            {filters.sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Results Summary */}
                    <div className="results-summary">
                        <span className="results-count">
                            {filteredBills.length} bills found
                            {filters.loadAll && (
                                <span className="load-all-indicator">
                                    <CalendarOff size={12} />
                                    Showing all records
                                </span>
                            )}
                            {stats.overdueCount > 0 && (
                                <span className="overdue-indicator">
                                    <AlertTriangle size={12} />
                                    {stats.overdueCount} overdue
                                </span>
                            )}
                        </span>
                        {hasActiveFilters() && (
                            <span className="active-filters">
                                <Filter size={12} />
                                Filters applied
                            </span>
                        )}
                        <div className="summary-totals">
                            <span className="total-item">Total: {formatCurrency(stats.totalAmount)}</span>
                            <span className="total-item">Received: {formatCurrency(stats.totalReceived)}</span>
                            <span className="total-item highlight">Balance: {formatCurrency(stats.totalBalance)}</span>
                            <span className="total-item collection-rate">
                                Collection Rate: {stats.collectionRate}%
                            </span>
                        </div>
                    </div>

                    {/* Bills Table */}
                    <div className="table-section">
                        {filteredBills.length > 0 ? (
                            <div className="table-responsive">
                                <table className="bills-table">
                                    <thead>
                                        <tr>
                                            <th width="50"></th>
                                            <th width="80">Inv No.</th>
                                            <th width="290">Invoice Date</th>
                                            <th width="100">Party Name</th>
                                            <th width="120">Inv Amt</th>
                                            <th width="60">Discount</th>
                                            <th width="60">TDS</th>
                                            <th width="120">Received Amt</th>
                                            <th width="120">Balance Amt</th>
                                            <th width="150">Company Name</th>
                                            <th width="120">Function</th>
                                            <th width="100">Status</th>
                                            <th width="120">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredBills.map((bill) => (
                                            <tr key={bill.QuotationId} className={`bill-row ${bill.Status.toLowerCase()} ${bill.isOverdue ? 'overdue' : ''}`}>
                                                <td><Edit size={14}/></td>
                                                <td>
                                                    <div className="invoice-cell">
                                                        <div className="invoice-no">{bill.QuotationNo}</div>
                                                        {bill.isOverdue && (
                                                            <div className="overdue-badge">Overdue</div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="date-cell">
                                                        <div className="date-display">{bill.formattedDateDisplay}</div>
                                                        <div className="time-display">{bill.formattedTimeDisplay}</div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="party-cell">
                                                        <div className="party-names">{bill.PartyName}</div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="amount-cell total">
                                                        {formatCurrency(bill.BillAmount)}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="amount-cell discount">
                                                        {formatCurrency(bill.Discount)}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="amount-cell tds">
                                                        {formatCurrency(bill.TDS)}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="amount-cell received">
                                                        {formatCurrency(bill.ReceivedAmount)}
                                                        <div className="progress-container">
                                                            <div className="progress-bar">
                                                                <div
                                                                    className={`progress-fill ${bill.paymentPercentage >= 100 ? 'complete' : bill.paymentPercentage >= 50 ? 'partial' : 'low'}`}
                                                                    style={{ width: `${Math.min(bill.paymentPercentage, 100)}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className="progress-text">{bill.paymentPercentage}%</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="amount-cell balance highlight">
                                                        {formatCurrency(bill.Balance)}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="company-cell">
                                                        <Building size={12} />
                                                        <span>{bill.BillingCompany}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="function-cell">
                                                        {bill.FunctionName || 'N/A'}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="status-cell">
                                                        {getStatusBadge(bill.Status)}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="actions-cell">
                                                        <button
                                                            className="btn-action view"
                                                            // onClick={() => handleViewBill(bill)}
                                                            title="View Details"
                                                        >
                                                            <Trash color='red' size={14} />
                                                        </button>


                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="empty-state">
                                <FileText size={48} />
                                <h3>No unsettled bills found</h3>
                                <p>Try adjusting your filters or search criteria</p>
                                {hasActiveFilters() && (
                                    <button className="btn btn-primary" onClick={clearAllFilters}>
                                        Clear all filters
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer Summary */}
                    <div className="footer-summary">
                        <div className="summary-section">
                            <h4>Payment Summary</h4>
                            <div className="summary-grid">
                                <div className="summary-item">
                                    <span className="label">Total Invoices:</span>
                                    <span className="value">{stats.totalBills}</span>
                                </div>
                                <div className="summary-item">
                                    <span className="label">Total Invoice Amount:</span>
                                    <span className="value">{formatCurrency(stats.totalAmount)}</span>
                                </div>
                                <div className="summary-item">
                                    <span className="label">Total Discount:</span>
                                    <span className="value">{formatCurrency(stats.totalDiscount)}</span>
                                </div>
                                <div className="summary-item">
                                    <span className="label">Total TDS:</span>
                                    <span className="value">{formatCurrency(stats.totalTDS)}</span>
                                </div>
                                <div className="summary-item">
                                    <span className="label">Total Received:</span>
                                    <span className="value received">{formatCurrency(stats.totalReceived)}</span>
                                </div>
                                <div className="summary-item highlight">
                                    <span className="label">Total Balance:</span>
                                    <span className="value balance">{formatCurrency(stats.totalBalance)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bill Detail Modal */}
                {showBillModal && selectedBill && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h3>Bill Details - {selectedBill.QuotationNo}</h3>
                                <button className="modal-close" onClick={closeBillModal}>
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="modal-body">
                                <div className="bill-details-grid">
                                    <div className="detail-item">
                                        <span className="detail-label">Invoice Date:</span>
                                        <span className="detail-value">{selectedBill.formattedDateDisplay}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Time:</span>
                                        <span className="detail-value">{selectedBill.formattedTimeDisplay}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Party Name:</span>
                                        <span className="detail-value">{selectedBill.PartyName}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Function:</span>
                                        <span className="detail-value">{selectedBill.FunctionName || 'N/A'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Status:</span>
                                        <span className="detail-value">{getStatusBadge(selectedBill.Status)}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Company Name:</span>
                                        <span className="detail-value">{selectedBill.BillingCompany}</span>
                                    </div>
                                    <div className="detail-item amount">
                                        <span className="detail-label">Invoice Amount:</span>
                                        <span className="detail-value">{formatCurrency(selectedBill.BillAmount)}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Discount:</span>
                                        <span className="detail-value">{formatCurrency(selectedBill.Discount)}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">TDS:</span>
                                        <span className="detail-value">{formatCurrency(selectedBill.TDS)}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Received Amount:</span>
                                        <span className="detail-value received">{formatCurrency(selectedBill.ReceivedAmount)}</span>
                                    </div>
                                    <div className="detail-item highlight">
                                        <span className="detail-label">Balance Amount:</span>
                                        <span className="detail-value balance">{formatCurrency(selectedBill.Balance)}</span>
                                    </div>
                                </div>
                                <div className="modal-actions">
                                    <button className="btn btn-primary" onClick={() => handleDownloadInvoice(selectedBill)}>
                                        <Download size={16} />
                                        Download Invoice
                                    </button>
                                    <button className="btn btn-settle" onClick={() => handleSettleBill(selectedBill.QuotationId)}>
                                        <CreditCard size={16} />
                                        Settle Bill
                                    </button>
                                    <button className="btn btn-secondary" onClick={closeBillModal}>
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <style>{`
                    .unsettled-bill {
                        min-height: 100vh;
                        background: #f8fafc;
                    }

                    .dashboard-container {
                        max-width: 100%;
                        margin: 0 auto;
                        padding: 18px;
                    }

                    /* Date Error */
                    .date-error {
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        background: #fef2f2;
                        color: #dc2626;
                        padding: 8px 12px;
                        border-radius: 6px;
                        margin-bottom: 12px;
                        font-size: 0.875rem;
                        border: 1px solid #fecaca;
                    }

                    .date-error svg {
                        flex-shrink: 0;
                    }

                    /* Date Input Wrapper */
                    .date-input-wrapper {
                        position: relative;
                        display: flex;
                        align-items: center;
                    }

                    .date-input-wrapper input[type="date"] {
                        padding-right: 100px;
                        width: 100%;
                        padding: 6px 10px;
                        border: 1px solid #e2e8f0;
                        border-radius: 4px;
                        font-size: 0.875rem;
                        background: white;
                    }

                    

                    /* Overdue Styles */
                    .bill-row.overdue {
                        background-color: #fef2f2 !important;
                        border-left: 3px solid #dc2626;
                    }

                    .overdue-badge {
                        background: #dc2626;
                        color: white;
                        font-size: 0.7rem;
                        padding: 2px 6px;
                        border-radius: 4px;
                        margin-top: 4px;
                        display: inline-block;
                    }

                    .overdue-indicator {
                        background: #fef2f2;
                        color: #dc2626;
                        padding: 2px 8px;
                        border-radius: 12px;
                        font-size: 0.7rem;
                        font-weight: 500;
                        margin-left: 8px;
                        display: inline-flex;
                        align-items: center;
                        gap: 4px;
                        border: 1px solid #fecaca;
                    }

                    .collection-rate {
                        color: #059669;
                        font-weight: 600;
                        background: #d1fae5;
                        padding: 2px 8px;
                        border-radius: 4px;
                        font-size: 0.75rem;
                    }

                    /* Filters Always Visible */
                    .filters-bar.always-visible {
                        margin-bottom: 16px;
                        background: white;
                        border-radius: 8px;
                        border: 1px solid #e2e8f0;
                        overflow: hidden;
                    }

                    .expanded-filters.always-visible {
                        padding: 16px;
                        background: #f8fafc;
                        border-top: 1px solid #e2e8f0;
                    }

                    /* Stats Grid */
                    .stats-grid.compact {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 12px;
                        margin-bottom: 20px;
                    }

                    .stat-card {
                        background: white;
                        border-radius: 8px;
                        padding: 12px 16px;
                        border: 1px solid #e2e8f0;
                        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
                    }

                    .stat-card.highlight {
                        border-color: #ef4444;
                        background: linear-gradient(to bottom right, #fff5f5, white);
                    }

                    .stat-content {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                    }

                    .stat-icon {
                        width: 36px;
                        height: 36px;
                        border-radius: 8px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }

                    .stat-icon.total {
                        background: #e0e7ff;
                        color: #4f46e5;
                    }

                    .stat-icon.amount {
                        background: #fce7f3;
                        color: #db2777;
                    }

                    .stat-icon.balance {
                        background: #fee2e2;
                        color: #ef4444;
                    }

                    .stat-icon.received {
                        background: #dcfce7;
                        color: #16a34a;
                    }

                    .stat-value {
                        font-size: 1.25rem;
                        font-weight: 600;
                        color: #1e293b;
                        line-height: 1.2;
                    }

                    .stat-label {
                        font-size: 0.75rem;
                        color: #64748b;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                    }

                    /* Filters */
                    .search-container {
                        display: flex;
                        align-items: center;
                        padding: 12px 16px;
                        gap: 12px;
                        border-bottom: 1px solid #e2e8f0;
                    }

                    .search-input-wrapper {
                        flex: 1;
                        position: relative;
                        display: flex;
                        align-items: center;
                    }

                    .search-icon {
                        position: absolute;
                        left: 12px;
                        color: #94a3b8;
                        z-index: 1;
                    }

                    .search-input {
                        width: 100%;
                        padding: 8px 12px 8px 40px;
                        border: 1px solid #e2e8f0;
                        border-radius: 6px;
                        font-size: 0.875rem;
                        transition: all 0.2s;
                    }

                    .search-input:focus {
                        outline: none;
                        border-color: #4f46e5;
                        box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
                    }

                    .clear-search {
                        position: absolute;
                        right: 12px;
                        background: none;
                        border: none;
                        color: #94a3b8;
                        cursor: pointer;
                        padding: 4px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }

                    .clear-search:hover {
                        color: #64748b;
                    }

                    /* Load All Toggle */
                    .load-all-toggle {
                        display: flex;
                        flex-direction: column;
                        gap: 4px;
                    }

                    .load-all-toggle label {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        cursor: pointer;
                        font-size: 0.8rem;
                        color: #475569;
                        user-select: none;
                    }

                    .load-all-toggle input[type="checkbox"] {
                        width: 16px;
                        height: 16px;
                        cursor: pointer;
                    }

                    .toggle-label {
                        display: flex;
                        align-items: center;
                        gap: 4px;
                        font-weight: 500;
                    }

                    .load-all-badge {
                        background: #dcfce7;
                        color: #166534;
                        padding: 2px 8px;
                        border-radius: 12px;
                        font-size: 0.7rem;
                        font-weight: 500;
                        margin-left: 8px;
                        display: inline-flex;
                        align-items: center;
                        gap: 4px;
                    }

                    .load-all-indicator {
                        background: #dcfce7;
                        color: #166534;
                        padding: 2px 8px;
                        border-radius: 12px;
                        font-size: 0.7rem;
                        font-weight: 500;
                        margin-left: 8px;
                        display: inline-flex;
                        align-items: center;
                        gap: 4px;
                    }

                    /* Buttons */
                    .btn {
                        padding: 8px 16px;
                        border: none;
                        border-radius: 6px;
                        font-size: 0.875rem;
                        font-weight: 500;
                        cursor: pointer;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        gap: 6px;
                        transition: all 0.2s;
                    }

                    .btn-primary {
                        background: #4f46e5;
                        color: white;
                    }

                    .btn-primary:hover {
                        background: #4338ca;
                    }

                    .btn-clear {
                        background: transparent;
                        color: #ef4444;
                        border: 1px solid #fecaca;
                    }

                    .btn-clear:hover {
                        background: #fee2e2;
                    }

                    /* Expanded Filters */
                    .filter-row {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 16px;
                    }

                    .filter-group {
                        display: flex;
                        flex-direction: column;
                        gap: 4px;
                    }

                    .filter-group label {
                        display: flex;
                        align-items: center;
                        gap: 4px;
                        font-size: 0.75rem;
                        font-weight: 500;
                        color: #475569;
                    }

                    .filter-group input,
                    .filter-group select {
                        padding: 6px 10px;
                        border: 1px solid #e2e8f0;
                        border-radius: 4px;
                        font-size: 0.875rem;
                        background: white;
                    }

                    .filter-group input:disabled,
                    .filter-group input.disabled {
                        background: #f8fafc;
                        border-color: #e2e8f0;
                        color: #94a3b8;
                        cursor: not-allowed;
                    }

                    .filter-group input:focus:not(:disabled),
                    .filter-group select:focus {
                        outline: none;
                        border-color: #4f46e5;
                    }

                    .sort-controls {
                        display: flex;
                        gap: 4px;
                    }

                    .sort-controls select {
                        flex: 1;
                    }

                    .btn-sort-toggle {
                        padding: 6px 8px;
                        background: #f1f5f9;
                        border: 1px solid #e2e8f0;
                        border-radius: 4px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }

                    .btn-sort-toggle:hover {
                        background: #e2e8f0;
                    }

                    /* Results Summary */
                    .results-summary {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        margin-bottom: 12px;
                        padding: 0 4px;
                        flex-wrap: wrap;
                        gap: 12px;
                    }

                    .results-count {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        font-size: 0.875rem;
                        font-weight: 500;
                        color: #475569;
                    }

                    .active-filters {
                        display: flex;
                        align-items: center;
                        gap: 4px;
                        font-size: 0.75rem;
                        color: #ef4444;
                        background: #fee2e2;
                        padding: 2px 8px;
                        border-radius: 4px;
                    }

                    .summary-totals {
                        display: flex;
                        gap: 16px;
                        align-items: center;
                        flex-wrap: wrap;
                    }

                    .total-item {
                        font-size: 0.875rem;
                        color: #64748b;
                    }

                    .total-item.highlight {
                        color: #ef4444;
                        font-weight: 600;
                    }

                    /* Table */
                    .table-section {
                        background: white;
                        border-radius: 8px;
                        border: 1px solid #e2e8f0;
                        overflow: hidden;
                        margin-bottom: 20px;
                    }

                    .table-responsive {
                        overflow-x: auto;
                    }

                    .bills-table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 0.875rem;
                    }

                    .bills-table thead {
                        background: #f8fafc;
                        border-bottom: 2px solid #e2e8f0;
                    }

                    .bills-table th {
                        padding: 12px 16px;
                        text-align: left;
                        font-weight: 600;
                        color: #475569;
                        white-space: nowrap;
                        font-size: 0.8rem;   
                        letter-spacing: 0.05em;
                    }

                    .bills-table tbody tr {
                        border-bottom: 1px solid #f1f5f9;
                    }

                    .bills-table tbody tr:hover {
                        background: #f8fafc;
                    }

                    .bills-table tbody tr.confirmed {
                        background-color: rgba(16, 185, 129, 0.05);
                    }

                    .bills-table tbody tr.tentative {
                        background-color: rgba(245, 158, 11, 0.05);
                    }

                    .bills-table tbody tr.waitlisted {
                        background-color: rgba(139, 92, 246, 0.05);
                    }

                    .bills-table td {
                        padding: 12px 16px;
                        vertical-align: middle;
                    }

                    /* Table Cells */
                    .invoice-cell {
                        display: flex;
                        flex-direction: column;
                        gap: 2px;
                    }

                    .invoice-no {
                        font-weight: 600;
                        color: #1e293b;
                        font-size: 0.875rem;
                    }

                    .date-cell {
                        display: flex;
                        flex-direction: column;
                        gap: 2px;
                    }

                    .date-display {
                        font-weight: 600;
                        color: #1e293b;
                        font-size: 0.8rem;
                    }

                    .time-display {
                        color: #64748b;
                        font-size: 0.75rem;
                    }

                    .party-cell {
                        display: flex;
                        flex-direction: column;
                        gap: 2px;
                    }

                    .party-names {
                        font-weight: 500;
                        color: #1e293b;
                        line-height: 1.3;
                    }

                    /* Amount Cells */
                    .amount-cell {
                        font-weight: 600;
                        font-size: 0.875rem;
                    }

                    .amount-cell.total {
                        color: #1e293b;
                    }

                    .amount-cell.discount {
                        color: #f59e0b;
                    }

                    .amount-cell.tds {
                        color: #8b5cf6;
                    }

                    .amount-cell.received {
                        color: #16a34a;
                        display: flex;
                        flex-direction: column;
                        gap: 4px;
                    }

                    .amount-cell.balance {
                        color: #ef4444;
                    }

                    .amount-cell.highlight {
                        color: #ef4444;
                        font-weight: 700;
                    }

                    .progress-container {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }

                    .progress-bar {
                        flex: 1;
                        height: 4px;
                        background: #e2e8f0;
                        border-radius: 2px;
                        overflow: hidden;
                    }

                    .progress-fill {
                        height: 100%;
                        border-radius: 2px;
                    }

                    .progress-fill.complete {
                        background: #10b981;
                    }

                    .progress-fill.partial {
                        background: #f59e0b;
                    }

                    .progress-fill.low {
                        background: #ef4444;
                    }

                    .progress-text {
                        font-size: 0.7rem;
                        color: #64748b;
                        min-width: 24px;
                        text-align: right;
                    }

                    .company-cell {
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        color: #475569;
                    }

                    .company-cell svg {
                        color: #94a3b8;
                    }

                    .function-cell {
                        color: #475569;
                        line-height: 1.4;
                        max-width: 150px;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }

                    /* Status */
                    .status-cell {
                        display: flex;
                        align-items: center;
                        gap: 6px;
                    }

                    .status-badge {
                        padding: 4px 8px;
                        border-radius: 12px;
                        font-size: 0.7rem;
                        font-weight: 600;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                        min-width: 80px;
                        text-align: center;
                    }

                    .status-badge.confirmed {
                        background: #d1fae5;
                        color: #065f46;
                    }

                    .status-badge.tentative {
                        background: #fef3c7;
                        color: #92400e;
                    }

                    .status-badge.waitlisted {
                        background: #ede9fe;
                        color: #5b21b6;
                    }

                    /* Actions */
                    .actions-cell {
                        display: flex;
                        gap: 4px;
                        justify-content: center;
                    }

                    .btn-action {
                        width: 28px;
                        height: 28px;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.2s;
                    }

                    .btn-action.view {
                        background: #dbeafe;
                        color: #2563eb;
                    }

                    .btn-action.view:hover {
                        background: #bfdbfe;
                    }

                    .btn-action.settle {
                        background: #dcfce7;
                        color: #16a34a;
                    }

                    .btn-action.settle:hover {
                        background: #bbf7d0;
                    }

                    .btn-action.download {
                        background: #fef3c7;
                        color: #d97706;
                    }

                    .btn-action.download:hover {
                        background: #fde68a;
                    }

                    .btn-action.more {
                        background: #f1f5f9;
                        color: #475569;
                    }

                    .btn-action.more:hover {
                        background: #e2e8f0;
                    }

                    /* Footer Summary */
                    .footer-summary {
                        background: white;
                        border-radius: 8px;
                        padding: 16px;
                        border: 1px solid #e2e8f0;
                    }

                    .summary-section h4 {
                        margin: 0 0 12px 0;
                        color: #1e293b;
                        font-size: 0.9rem;
                        font-weight: 600;
                    }

                    .summary-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 12px;
                    }

                    .summary-item {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 8px 12px;
                        background: #f8fafc;
                        border-radius: 6px;
                    }

                    .summary-item .label {
                        font-size: 0.8rem;
                        color: #64748b;
                    }

                    .summary-item .value {
                        font-size: 0.875rem;
                        font-weight: 600;
                        color: #1e293b;
                    }

                    .summary-item .value.received {
                        color: #16a34a;
                    }

                    .summary-item .value.balance {
                        color: #ef4444;
                    }

                    .summary-item.highlight {
                        background: #fff5f5;
                        border: 1px solid #fecaca;
                    }

                    /* Empty State */
                    .empty-state {
                        padding: 40px 20px;
                        text-align: center;
                        color: #64748b;
                    }

                    .empty-state svg {
                        color: #cbd5e1;
                        margin-bottom: 12px;
                    }

                    .empty-state h3 {
                        color: #475569;
                        margin-bottom: 4px;
                        font-size: 1rem;
                    }

                    .empty-state p {
                        font-size: 0.875rem;
                        margin-bottom: 16px;
                    }

                    /* Loading & Error */
                    .loading-container,
                    .error-container {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        padding: 60px 20px;
                        text-align: center;
                    }

                    .loading-spinner {
                        width: 40px;
                        height: 40px;
                        border: 3px solid #e2e8f0;
                        border-top-color: #4f46e5;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                        margin-bottom: 12px;
                    }

                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }

                    .error-container svg {
                        color: #ef4444;
                        margin-bottom: 12px;
                    }

                    .error-container h2 {
                        color: #1e293b;
                        margin-bottom: 4px;
                        font-size: 1.25rem;
                    }

                    .error-container p {
                        color: #64748b;
                        margin-bottom: 16px;
                    }

                    .retry-button {
                        padding: 8px 16px;
                        background: #4f46e5;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        display: inline-flex;
                        align-items: center;
                        gap: 6px;
                        font-size: 0.875rem;
                    }

                    /* Modal Styles */
                    .modal-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(0, 0, 0, 0.5);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 1000;
                        padding: 20px;
                    }

                    .modal-content {
                        background: white;
                        border-radius: 8px;
                        width: 100%;
                        max-width: 600px;
                        max-height: 90vh;
                        overflow-y: auto;
                        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                    }

                    .modal-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 16px 20px;
                        border-bottom: 1px solid #e2e8f0;
                    }

                    .modal-header h3 {
                        margin: 0;
                        color: #1e293b;
                        font-size: 1.125rem;
                    }

                    .modal-close {
                        background: none;
                        border: none;
                        color: #64748b;
                        cursor: pointer;
                        padding: 4px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border-radius: 4px;
                    }

                    .modal-close:hover {
                        background: #f1f5f9;
                        color: #475569;
                    }

                    .modal-body {
                        padding: 20px;
                    }

                    .bill-details-grid {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 12px;
                        margin-bottom: 20px;
                    }

                    .detail-item {
                        display: flex;
                        flex-direction: column;
                        gap: 4px;
                    }

                    .detail-item.amount {
                        grid-column: span 2;
                    }

                    .detail-label {
                        font-size: 0.75rem;
                        color: #64748b;
                        font-weight: 500;
                    }

                    .detail-value {
                        font-size: 0.875rem;
                        color: #1e293b;
                        font-weight: 500;
                    }

                    .detail-value.received {
                        color: #059669;
                    }

                    .detail-value.balance {
                        color: #dc2626;
                        font-weight: 600;
                    }

                    .modal-actions {
                        display: flex;
                        gap: 12px;
                        justify-content: flex-end;
                        border-top: 1px solid #e2e8f0;
                        padding-top: 20px;
                        margin-top: 20px;
                    }

                    .btn-settle {
                        background: #059669;
                        color: white;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 6px;
                        font-size: 0.875rem;
                        font-weight: 500;
                        cursor: pointer;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        gap: 6px;
                    }

                    .btn-settle:hover {
                        background: #047857;
                    }

                    .btn-secondary {
                        background: #f1f5f9;
                        color: #475569;
                        border: 1px solid #e2e8f0;
                        padding: 8px 16px;
                        border-radius: 6px;
                        font-size: 0.875rem;
                        font-weight: 500;
                        cursor: pointer;
                    }

                    .btn-secondary:hover {
                        background: #e2e8f0;
                    }

                    /* Responsive */
                    @media (max-width: 1400px) {
                        .bills-table th,
                        .bills-table td {
                            padding: 10px 12px;
                            font-size: 0.8rem;
                        }
                    }

                    @media (max-width: 1200px) {
                        .stats-grid.compact {
                            grid-template-columns: repeat(2, 1fr);
                        }
                        
                        .summary-grid {
                            grid-template-columns: repeat(3, 1fr);
                        }
                    }

                    @media (max-width: 1024px) {
                        .dashboard-container {
                            padding: 12px;
                        }
                        
                        .bills-table th,
                        .bills-table td {
                            padding: 8px 10px;
                        }
                        
                       
                        
                        .date-input-wrapper input[type="date"] {
                            padding-right: 10px;
                        }
                    }

                    @media (max-width: 768px) {
                        .search-container {
                            flex-wrap: wrap;
                        }

                        .search-input-wrapper {
                            width: 100%;
                        }

                        .filter-row {
                            grid-template-columns: 1fr;
                        }

                        .summary-totals {
                            flex-direction: column;
                            align-items: flex-start;
                            gap: 8px;
                        }
                        
                        .summary-grid {
                            grid-template-columns: repeat(2, 1fr);
                        }
                        
                        
                        .date-input-wrapper input[type="date"] {
                            padding-right: 10px;
                        }
                    }

                    @media (max-width: 480px) {
                        .stats-grid.compact {
                            grid-template-columns: 1fr;
                        }
                        
                        .summary-grid {
                            grid-template-columns: 1fr;
                        }
                        
                        .results-summary {
                            flex-direction: column;
                            align-items: flex-start;
                        }
                        
                        .modal-actions {
                            flex-direction: column;
                        }
                        
                        .modal-actions .btn {
                            width: 100%;
                        }
                    }
                `}</style>
            </div>
        </>
    );
};

export default UnsettledBill;