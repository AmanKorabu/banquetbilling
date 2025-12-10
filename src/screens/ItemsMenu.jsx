import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";

function ItemsMenu() {
  const location = useLocation();
  const navigate = useNavigate();

  const selectedItem = location.state?.selectedItem;
  const isEditingMenus = location.state?.isEditingMenus || false;
  const editingIndex = location.state?.editingIndex;
  const previousMenus = location.state?.previousMenus || {};

  const [categories, setCategories] = useState([]);
  const [selectedMenus, setSelectedMenus] = useState(previousMenus || {});
  const [loading, setLoading] = useState(false);

  // 🔹 Popup states for "Other" items
  const [showOtherPopup, setShowOtherPopup] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [otherItems, setOtherItems] = useState([]);
  const [defaultItems, setDefaultItems] = useState([]); // Default items with rates
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingOther, setLoadingOther] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [showAllItems, setShowAllItems] = useState(false); // Toggle for showing all items

  // 🔹 Debug logging
  useEffect(() => {
    console.log('🎯 ItemsMenu mounted with state:', {
      selectedItem,
      isEditingMenus,
      editingIndex,
      previousMenus
    });
  }, [selectedItem, isEditingMenus, editingIndex, previousMenus]);

  // 🔹 Fetch menus from API
  useEffect(() => {
    const fetchMenus = async () => {
      if (!selectedItem?.PackageId) {
        console.log('❌ No PackageId found, returning early');
        return;
      }

      try {
        console.log('📦 Fetching menus for PackageId:', selectedItem.PackageId);
        const response = await axios.get(
          "/banquetapi/get_pack_menus_disp.php",
          {
            params: {
              pack_id: selectedItem.PackageId,
              sub_cat_id: 0,
              pass_srno: 0,
            },
            timeout: 10000
          }
        );

        console.log('✅ Menu API response:', response.data);

        if (response.data.category && Array.isArray(response.data.category)) {
          // Filter out categories with CatSrNo "1" only and remove "OTHER" menu items
          const filteredCategories = response.data.category
            .filter(cat => String(cat.CatSrNo).trim() === "1")
            .map(cat => ({
              ...cat,
              menus: cat.menus?.filter(menu => menu.MenuId !== "0" && menu.MenuName !== "OTHER") || []
            }))
            .filter(cat => cat.menus.length > 0); // Only keep categories that have menus

          setCategories(filteredCategories);
          console.log('📋 Filtered categories set:', filteredCategories);
        } else {
          setCategories([]);
        }
      } catch (error) {
        console.error("❌ Error fetching menus:", error);
        setCategories([]);
      }
    };

    fetchMenus();
  }, [selectedItem]);

  // 🔹 Fetch default items with rates for the current category
  const fetchDefaultItems = useCallback(async (category) => {
    try {
      setLoadingOther(true);

      console.log("📦 Using category menus as default items:", category.menus);

      // These are already default items from API 1
      let defaultMenus = category.menus || [];

      if (defaultMenus.length === 0) {
        setDefaultItems([]);
        setOtherItems([]);
        return;
      }

      // Optional: fetch rates
      const hotelId = localStorage.getItem("hotel_id");

      const rateResp = await axios.get("/banquetapi/search_menu_new2.php", {
        params: {
          hotel_id: hotelId,
          search_param: "",
          cat_id: 0,
        },
        timeout: 8000
      });

      const allItems = rateResp.data?.result || [];

      // Merge rates
      const merged = defaultMenus.map(menu => {
        const match = allItems.find(i => i.MenuId === menu.MenuId);
        return {
          ...menu,
          MenuRate: match?.MenuRate || null,
          StatusName: match?.StatusName || "Available"
        };
      });

      setDefaultItems(merged);
      setOtherItems(merged);

      console.log("✅ Loaded default menus:", merged);

    } catch (e) {
      console.error("❌ Default items error:", e);
      setDefaultItems([]);
      setOtherItems([]);
    } finally {
      setLoadingOther(false);
    }
  }, []);


  // 🔹 Fetch all other items from search API
  const fetchAllOtherItems = useCallback(async (category, search = "") => {
    try {
      setLoadingOther(true);
      const hotelId = localStorage.getItem("hotel_id") || "";

      console.log('🔍 Fetching all other items for category:', {
        category: category.CategoryName,
        search
      });

      const response = await axios.get(
        "/banquetapi/search_menu_new2.php",
        {
          params: {
            hotel_id: hotelId,
            search_param: search,
            cat_id: 0,
          },
          timeout: 8000
        }
      );

      console.log("✅ All other items response:", response.data);

      let items = [];
      if (response.data?.result && Array.isArray(response.data.result)) {
        items = response.data.result;
      } else if (Array.isArray(response.data)) {
        items = response.data;
      }

      // Filter out empty items and items that are MenuId "0"
      const validItems = items.filter(item =>
        item &&
        (item.MenuName || item.Name || item.menu_name) &&
        item.MenuId !== "0"
      );

      // Remove duplicates based on MenuId
      const uniqueItems = validItems.filter((item, index, self) =>
        index === self.findIndex((t) => t.MenuId === item.MenuId)
      );

      setOtherItems(uniqueItems);
      console.log(`📦 Loaded ${uniqueItems.length} other items`);

    } catch (error) {
      console.error("❌ Error fetching other items:", error);
      setOtherItems([]);
    } finally {
      setLoadingOther(false);
    }
  }, []);

  // 🔹 Debounced search with cleanup
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (showOtherPopup && currentCategory) {
      const timeout = setTimeout(() => {
        if (showAllItems) {
          // If showing all items, search in all items
          fetchAllOtherItems(currentCategory, searchTerm);
        } else {
          // If showing default items, filter default items by search
          if (searchTerm) {
            const filteredDefaultItems = defaultItems.filter(item =>
              item.MenuName?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setOtherItems(filteredDefaultItems);
          } else {
            setOtherItems(defaultItems);
          }
        }
      }, searchTerm ? 500 : 0);

      setSearchTimeout(timeout);
    }

    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTerm, showOtherPopup, currentCategory, showAllItems, defaultItems, fetchAllOtherItems]);

  // 🔹 Open popup for "Other" selection
  const handleOtherClick = useCallback((category) => {
    console.log("🔄 Opening other popup for category:", category.CategoryName);
    setCurrentCategory(category);
    setShowOtherPopup(true);
    setSearchTerm("");
    setShowAllItems(false); // Reset to show default items
    // Fetch default items with rates first
    fetchDefaultItems(category);
  }, [fetchDefaultItems]);

  // 🔹 Toggle between default and all items
  const handleLoadAllClick = useCallback(() => {
    if (!currentCategory) return;

    if (!showAllItems) {
      // Switching to show all items
      setShowAllItems(true);
      fetchAllOtherItems(currentCategory, searchTerm);
    } else {
      // Switching back to default items
      setShowAllItems(false);
      if (searchTerm) {
        const filteredDefaultItems = defaultItems.filter(item =>
          item.MenuName?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setOtherItems(filteredDefaultItems);
      } else {
        setOtherItems(defaultItems);
      }
    }
  }, [showAllItems, currentCategory, searchTerm, defaultItems, fetchAllOtherItems]);

  // 🔹 Select other item
  const handleSelectOtherItem = useCallback((item) => {
    if (!currentCategory) return;

    const selectedData = {
      id: item.MenuId || item.id || `other_${Date.now()}`,
      name: item.MenuName || item.Name || item.menu_name,
      CategoryId: currentCategory.CategoryId,
      CategoryName: currentCategory.CategoryName,
      MenuId: item.MenuId || "",
      MenuName: item.MenuName || item.Name || item.menu_name,
      MenuRate: item.MenuRate || item.Rate || item.rate || null,
      CatSrNo: item.CatSrNo || currentCategory.CatSrNo || "1",
      isOther: true,
      rate: item.MenuRate || item.Rate || item.rate || null,
      originalItem: item
    };

    setSelectedMenus((prev) => ({
      ...prev,
      [currentCategory.CategoryId]: selectedData,
    }));


    setShowOtherPopup(false);
    setCurrentCategory(null);
    setSearchTerm("");
    setOtherItems([]);
    setDefaultItems([]);
    setShowAllItems(false);
  }, [currentCategory]);

  // 🔹 Select menu from category
  const handleSelectMenu = useCallback((categoryId, menuId) => {
    const cat = categories.find((c) => c.CategoryId === categoryId);
    if (!cat) return;

    const menu = cat.menus.find((m) => m.MenuId === menuId);
    if (!menu) return;

    setSelectedMenus((prev) => ({
      ...prev,
      [categoryId]: {
        id: menuId,
        name: menu.MenuName,
        CategoryId: cat.CategoryId,
        CategoryName: cat.CategoryName,
        MenuId: menu.MenuId,
        MenuName: menu.MenuName,
        MenuRate: menu.MenuRate || null,
        CatSrNo: menu.CatSrNo || cat.CatSrNo || "1", // ✅ fixed line
        isOther: false,
        rate: null,
      },
    }));
  }, [categories]);


  // 🔹 Clear selection for a category
  const handleClearSelection = useCallback((categoryId) => {
    setSelectedMenus((prev) => {
      const newMenus = { ...prev };
      delete newMenus[categoryId];
      return newMenus;
    });
  }, []);

  // 🔹 Check if all categories have selections
  const allSelected = useMemo(() =>
    categories.length > 0 &&
    categories.every((cat) => selectedMenus[cat.CategoryId])
    , [categories, selectedMenus]);

  // 🔹 Prepare summary list
  const selectedList = useMemo(() => {
    return Object.entries(selectedMenus).map(([catId, data]) => {
      const cat = categories.find((c) => c.CategoryId === catId);
      return {
        category: cat?.CategoryName,
        menu: data.name,
        isOther: data.isOther,
        rate: data.rate,
        categoryId: catId
      };
    });
  }, [selectedMenus, categories]);

  // 🔹 Progress calculation
  const selectionProgress = useMemo(() => {
    if (categories.length === 0) return 0;
    return Math.round((Object.keys(selectedMenus).length / categories.length) * 100);
  }, [categories.length, selectedMenus]);

  // 🔹 Get selection status for each category
  const getCategoryStatus = useCallback((categoryId) => {
    const selected = selectedMenus[categoryId];
    if (!selected) return { status: 'empty', text: 'Not selected' };
    return {
      status: 'selected',
      text: selected.isOther ? 'Custom item' : 'Selected'
    };
  }, [selectedMenus]);

  // 🔹 Calculate total with custom item rates
  const totalAmount = useMemo(() => {
    const packageRate = parseFloat(selectedItem?.Rate || 0);
    const gstRate = parseFloat(selectedItem?.TaxPer || 0);

    // Calculate additional cost from custom items
    const additionalCost = selectedList.reduce((total, item) => {
      if (item.isOther && item.rate) {
        return total + parseFloat(item.rate);
      }
      return total;
    }, 0);

    const baseTotal = packageRate + additionalCost;
    const gstAmount = (baseTotal * gstRate) / 100;

    return (baseTotal + gstAmount).toFixed(2);
  }, [selectedItem, selectedList]);

  // 🔹 Save & return to NewBooking
  const handleSave = useCallback(() => {
    if (!allSelected) return;
    setLoading(true);

    console.log('💾 Saving menus, isEditingMenus:', isEditingMenus);

    const packageRate = parseFloat(selectedItem?.Rate || 0);
    const gstRate = parseFloat(selectedItem?.TaxPer || 0);
    const taxName = selectedItem?.TaxName || "GST";

    const bookingData = {
      selectedItem,
      selectedMenus,
      rate: packageRate,
      gstRate,
      taxName,
      totalAmount: totalAmount,
      isEditingMenus,
      editingIndex,
      updatedMenus: selectedMenus,
    };

    console.log('📤 Navigating back with:', bookingData);

    navigate("/new-booking", {
      state: bookingData,
      replace: true
    });
  }, [allSelected, selectedItem, selectedMenus, totalAmount, isEditingMenus, editingIndex, navigate]);

  // 🔹 Close popup handler
  const handleClosePopup = useCallback(() => {
    setShowOtherPopup(false);
    setCurrentCategory(null);
    setSearchTerm("");
    setOtherItems([]);
    setDefaultItems([]);
    setShowAllItems(false);
  }, []);

  return (
    <div className="menu-wrapper">
      {/* LEFT SIDE */}
      <div className="menu-list">
        <h2 className="menu-title">{selectedItem?.Name || "Select Menus"}</h2>

        {isEditingMenus && (
          <div className="editing-notice">
            ✏️ Editing menus for: <strong>{selectedItem?.Name}</strong>
          </div>
        )}

        {/* 🔹 Progress indicator */}
        {categories.length > 0 && (
          <div className="progress-section">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${selectionProgress}%` }}
              ></div>
            </div>
            <div className="progress-text">
              {selectionProgress}% Complete ({Object.keys(selectedMenus).length}/{categories.length} categories)
            </div>
          </div>
        )}

        {categories.length === 0 ? (
          <p className="loading">Loading menus...</p>
        ) : (
          categories.map((cat) => {
            const selectedData = selectedMenus[cat.CategoryId];
            const categoryStatus = getCategoryStatus(cat.CategoryId);

            return (
              <div key={cat.CategoryId} className="menu-category">
                <div className="category-header">
                  <div className="category-title-wrapper">
                    <h3 className="menu-category-title">{cat.CategoryName}</h3>
                    <span className={`category-status ${categoryStatus.status}`}>
                      {categoryStatus.text}
                    </span>
                  </div>
                  {selectedData && (
                    <button
                      className="clear-btn"
                      onClick={() => handleClearSelection(cat.CategoryId)}
                      title="Clear selection"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="menu-options">
                  {/* Regular menu items */}
                  {cat.menus && cat.menus.map((menu) => {
                    const isSelected = selectedData?.id === menu.MenuId && !selectedData?.isOther;
                    return (
                      <div
                        key={menu.MenuId}
                        className={`menu-item ${isSelected ? "selected" : ""}`}
                        onClick={() => handleSelectMenu(cat.CategoryId, menu.MenuId)}
                      >
                        <span className="menu-radio">
                          {isSelected ? "●" : "○"}
                        </span>
                        <span className="menu-name">{menu.MenuName}</span>
                      </div>
                    );
                  })}

                  {/* Single Other Option */}
                  <div
                    className={`menu-item other-option ${selectedData?.isOther ? "selected" : ""}`}
                    onClick={() => handleOtherClick(cat)}
                  >
                    <span className="menu-radio">
                      {selectedData?.isOther ? "●" : "○"}
                    </span>
                    <span className="menu-name">
                      {selectedData?.isOther ? selectedData.name : "Other..."}
                    </span>
                    {selectedData?.isOther && (
                      <>
                        <span className="other-indicator">🔍</span>
                        {selectedData.rate && (
                          <span className="item-rate-badge">₹{selectedData.rate}</span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* RIGHT SIDE */}
      <div className="selected-list">
        <h3>🧾 Selected Menus</h3>
        {selectedList.length === 0 ? (
          <div className="empty-selection">
            <p>No menus selected yet</p>
            <small>Choose one option from each category on the left</small>
          </div>
        ) : (
          <ul className="selected-items">
            {selectedList.map((item) => (
              <li key={item.categoryId} className="selected-item">
                <div className="selected-item-content">
                  <span className="category-name">{item.category}</span>
                  <span className="menu-name">{item.menu}</span>
                  <div className="item-meta">
                    {item.isOther && <span className="other-badge">Custom</span>}
                    {item.rate && <span className="rate-display">₹{item.rate}</span>}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Package Summary */}
        {selectedItem && (
          <div className="summary">
            <h4>Package Summary</h4>
            <div className="summary-row">
              <span>Base Rate:</span>
              <span>₹{selectedItem.Rate}</span>
            </div>

            {/* Additional costs from custom items */}
            {selectedList.filter(item => item.isOther && item.rate).length > 0 && (
              <>
                <div className="summary-row">
                  <span>Additional Items:</span>
                  <span>₹{
                    selectedList
                      .filter(item => item.isOther && item.rate)
                      .reduce((total, item) => total + parseFloat(item.rate || 0), 0)
                      .toFixed(2)
                  }</span>
                </div>
                <div className="summary-row">
                  <span>Subtotal:</span>
                  <span>₹{
                    (parseFloat(selectedItem.Rate || 0) +
                      selectedList
                        .filter(item => item.isOther && item.rate)
                        .reduce((total, item) => total + parseFloat(item.rate || 0), 0)
                    ).toFixed(2)
                  }</span>
                </div>
              </>
            )}

            <div className="summary-row">
              <span>{selectedItem.TaxName || "GST"}:</span>
              <span>{selectedItem.TaxPer}%</span>
            </div>
            <div className="summary-row total">
              <span>Total:</span>
              <span>₹{totalAmount}</span>
            </div>
          </div>
        )}

        {/* Selection Status */}
        <div className="selection-status">
          {allSelected ? (
            <div className="status-complete">
              <span className="status-icon">✅</span>
              <div>
                <strong>All categories selected!</strong>
                <small>Ready to save your menu choices</small>
              </div>
            </div>
          ) : (
            <div className="status-incomplete">
              <span className="status-icon">⚠️</span>
              <div>
                <strong>{categories.length - Object.keys(selectedMenus).length} categories remaining</strong>
                <small>Please select from all categories</small>
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={!allSelected || loading}
          className={`save-btn ${allSelected ? "enabled" : "disabled"}`}
        >
          {loading
            ? "Saving..."
            : isEditingMenus
              ? "💾 Update Menus"
              : "💾 Save & Continue"}
        </button>
      </div>

      {/* Other Items Popup */}
      {showOtherPopup && currentCategory && (
        <div className="popup-overlay" onClick={handleClosePopup}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <h3>Select Item for {currentCategory.CategoryName}</h3>
              <button
                className="close-btn"
                onClick={handleClosePopup}
              >
                ✕
              </button>
            </div>

            <div className="search-section">
              <input
                type="text"
                placeholder={`🔍 Search ${showAllItems ? 'all' : 'default'} items...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
                autoFocus
              />
              {searchTerm && (
                <button
                  className="clear-search"
                  onClick={() => setSearchTerm("")}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Load All Button in Popup */}
            <div className="popup-actions">
              <button
                className={`load-all-btn ${showAllItems ? "active" : ""}`}
                onClick={handleLoadAllClick}
              >
                {showAllItems ? "📋 Show Default Items" : "📂 Load All Items"}
              </button>
              <div className="items-count">
                {showAllItems ? 'All Items' : 'Default Items'} ({otherItems.length})
              </div>
            </div>

            <div className="other-items-list">
              {loadingOther ? (
                <div className="loading-other">
                  <div className="loading-spinner"></div>
                  {showAllItems ? "Loading all items..." : "Loading default items..."}
                </div>
              ) : otherItems.length === 0 ? (
                <div className="no-items">
                  {searchTerm
                    ? `No ${showAllItems ? 'items' : 'default items'} found. Try a different search term.`
                    : `No ${showAllItems ? 'items' : 'default items'} available.`
                  }
                </div>
              ) : (
                <>
                  <div className="results-count">
                    Showing {otherItems.length} {showAllItems ? 'item' : 'default item'}{otherItems.length !== 1 ? 's' : ''}
                    {searchTerm && ` for "${searchTerm}"`}
                  </div>
                  {otherItems.map((item, index) => (
                    <div
                      key={item.MenuId || item.id || index}
                      className="other-item"
                      onClick={() => handleSelectOtherItem(item)}
                    >
                      <div className="item-info">
                        <div className="item-name">
                          {item.MenuName || item.Name || item.menu_name}
                        </div>
                        {item.StatusName && (
                          <div className="item-status">
                            {item.StatusName}
                          </div>
                        )}
                      </div>
                      {item.MenuRate && (
                        <div className="item-rate">₹{item.MenuRate}</div>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>

            <div className="popup-footer">
              <button
                className="cancel-btn"
                onClick={handleClosePopup}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STYLES */}
      <style>{`
        .menu-wrapper {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 20px;
          padding: 20px;
          background-color: #f7f8fa;
          min-height: 100vh;
          position: relative;
        }

        .menu-list,
        .selected-list {
          background: #fff;
          border-radius: 10px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          padding: 20px;
        }

        .menu-title {
          text-align: center;
          margin-bottom: 20px;
          color: #333;
          font-size: 24px;
          font-weight: 600;
        }

        .editing-notice {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 20px;
          text-align: center;
          color: #856404;
        }

        /* Progress Section */
        .progress-section {
          margin-bottom: 20px;
          padding: 15px;
          background: #f8fafc;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: #e2e8f0;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #10b981, #059669);
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .progress-text {
          font-size: 14px;
          color: #64748b;
          text-align: center;
          font-weight: 500;
        }

        /* Category Styles */
        .menu-category {
          margin-bottom: 24px;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 16px;
        }

        .category-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .category-title-wrapper {
          flex: 1;
        }

        .menu-category-title {
          margin: 0 0 4px 0;
          color: #1f2937;
          font-size: 16px;
          font-weight: 600;
        }

        .category-status {
          font-size: 12px;
          padding: 2px 8px;
          border-radius: 12px;
          font-weight: 500;
        }

        .category-status.empty {
          background: #fef3c7;
          color: #92400e;
        }

        .category-status.selected {
          background: #d1fae5;
          color: #065f46;
        }

        .clear-btn {
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 12px;
          padding: 0;
          flex-shrink: 0;
        }

        .clear-btn:hover {
          background: #dc2626;
        }

        /* Menu Options */
        .menu-options {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 8px;
        }

        .menu-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          cursor: pointer;
          background: #f9fafb;
          color: #374151;
          transition: all 0.2s ease;
          position: relative;
        }

        .menu-item:hover {
          background: #f3f4f6;
          border-color: #cbd5e1;
        }

        .menu-item.selected {
          background: #d1fae5;
          border-color: #16a34a;
          color: #065f46;
          font-weight: 600;
        }

        .menu-radio {
          font-size: 16px;
          font-weight: bold;
          flex-shrink: 0;
        }

        .menu-name {
          flex: 1;
          font-weight: 500;
        }

        .other-option {
          background: #e0f2fe;
          border-color: #7dd3fc;
          color: #0369a1;
        }

        .other-option.selected {
          background: #dbeafe;
          border-color: #3b82f6;
          color: #1e40af;
        }

        .other-indicator {
          font-size: 12px;
          flex-shrink: 0;
        }

        .item-rate-badge {
          background: #10b981;
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
        }

        /* Selected List */
        .selected-list {
          position: sticky;
          top: 20px;
          height: fit-content;
        }

        .empty-selection {
          text-align: center;
          padding: 40px 20px;
          color: #6b7280;
        }

        .empty-selection small {
          display: block;
          margin-top: 8px;
          font-size: 12px;
        }

        .selected-items {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .selected-item {
          padding: 12px 0;
          border-bottom: 1px solid #f3f4f6;
        }

        .selected-item:last-child {
          border-bottom: none;
        }

        .selected-item-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .category-name {
          font-size: 12px;
          color: #6b7280;
          font-weight: 500;
        }

        .menu-name {
          font-weight: 600;
          color: #374151;
        }

        .item-meta {
          display: flex;
          gap: 8px;
          align-items: center;
          margin-top: 4px;
        }

        .other-badge {
          background: #fef3c7;
          color: #92400e;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
        }

        .rate-display {
          background: #d1fae5;
          color: #065f46;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
        }

        /* Summary */
        .summary {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
        }

        .summary h4 {
          margin: 0 0 12px 0;
          color: #374151;
          font-size: 16px;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          color: #6b7280;
          font-size: 14px;
        }

        .summary-row.total {
          font-weight: 600;
          color: #111827;
          border-top: 1px solid #e5e7eb;
          padding-top: 8px;
          margin-top: 8px;
          font-size: 16px;
        }

        /* Selection Status */
        .selection-status {
          margin: 20px 0;
          padding: 16px;
          border-radius: 8px;
          text-align: left;
        }

        .status-complete,
        .status-incomplete {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .status-icon {
          font-size: 20px;
          flex-shrink: 0;
        }

        .status-complete {
          background: #d1fae5;
          color: #065f46;
          border: 1px solid #a7f3d0;
        }

        .status-incomplete {
          background: #fef3c7;
          color: #92400e;
          border: 1px solid #fcd34d;
        }

        .selection-status strong {
          display: block;
          margin-bottom: 4px;
        }

        .selection-status small {
          font-size: 12px;
          opacity: 0.8;
        }

        /* Save Button */
        .save-btn {
          width: 100%;
          padding: 16px;
          margin-top: 20px;
          font-size: 16px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 600;
        }

        .save-btn.enabled {
          background: linear-gradient(135deg, #16a34a, #059669);
          color: white;
          box-shadow: 0 4px 6px rgba(22, 163, 74, 0.2);
        }

        .save-btn.enabled:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(22, 163, 74, 0.3);
        }

        .save-btn.disabled {
          background: #d1d5db;
          color: #6b7280;
          cursor: not-allowed;
        }

        /* Popup Styles */
        .popup-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          padding: 20px;
        }

        .popup-content {
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 600px;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }

        .popup-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #e5e7eb;
        }

        .popup-header h3 {
          margin: 0;
          color: #1f2937;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #6b7280;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-btn:hover {
          color: #374151;
          background: #f3f4f6;
          border-radius: 50%;
        }

        .search-section {
          position: relative;
          padding: 20px;
          border-bottom: 1px solid #e5e7eb;
        }

        .search-input {
          width: 100%;
          padding: 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 16px;
        }

        .search-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .clear-search {
          position: absolute;
          right: 30px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          padding: 5px;
        }

        .clear-search:hover {
          color: #374151;
        }

        /* Popup Actions */
        .popup-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 20px;
          border-bottom: 1px solid #e5e7eb;
          background: #f8fafc;
        }

        .load-all-btn {
          padding: 8px 16px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          font-size: 14px;
          transition: all 0.3s ease;
        }

        .load-all-btn:hover {
          background: #2563eb;
          transform: translateY(-1px);
        }

        .load-all-btn.active {
          background: #10b981;
        }

        .load-all-btn.active:hover {
          background: #059669;
        }

        .items-count {
          font-size: 14px;
          color: #6b7280;
          font-weight: 500;
        }

        .other-items-list {
          flex: 1;
          overflow-y: auto;
          max-height: 400px;
          padding: 0 20px;
        }

        .loading-other {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          color: #6b7280;
        }

        .loading-spinner {
          border: 2px solid #f3f3f3;
          border-top: 2px solid #3b82f6;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          animation: spin 1s linear infinite;
          margin-right: 10px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .no-items {
          text-align: center;
          padding: 40px 20px;
          color: #6b7280;
        }

        .results-count {
          padding: 10px 0;
          color: #6b7280;
          font-size: 14px;
          border-bottom: 1px solid #e5e7eb;
          margin-bottom: 10px;
        }

        .other-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          margin-bottom: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .other-item:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        .item-info {
          flex: 1;
        }

        .item-name {
          font-weight: 500;
          color: #374151;
        }

        .item-status {
          font-size: 12px;
          color: #6b7280;
          margin-top: 2px;
        }

        .item-rate {
          color: #059669;
          font-weight: 600;
        }

        .popup-footer {
          padding: 20px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          justify-content: flex-end;
        }

        .cancel-btn {
          padding: 10px 20px;
          background: #6b7280;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }

        .cancel-btn:hover {
          background: #4b5563;
        }

        @media (max-width: 992px) {
          .menu-wrapper {
            grid-template-columns: 1fr;
          }
          .selected-list {
            position: relative;
            top: auto;
            margin-top: 20px;
          }
          .popup-content {
            width: 95%;
            margin: 10px;
          }
        }

        @media (max-width: 600px) {
          .menu-options {
            grid-template-columns: 1fr;
          }
          .menu-wrapper {
            padding: 10px;
          }
          .save-btn {
            font-size: 14px;
          }
          .popup-header {
            flex-direction: column;
            gap: 10px;
            text-align: center;
          }
          .popup-actions {
            flex-direction: column;
            gap: 10px;
            align-items: stretch;
          }
          .load-all-btn {
            width: 100%;
          }
          .items-count {
            text-align: center;
          }
          .category-header {
            flex-direction: column;
            gap: 8px;
            align-items: flex-start;
          }
          .clear-btn {
            align-self: flex-end;
          }
          .item-meta {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }
        }
      `}</style>
    </div>
  );
}

export default ItemsMenu;