import React, { Suspense, lazy, useEffect, useMemo } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ProtectedRoute from "./Routes/ProtectedRoute";
import LoginForm from "./screens/LoginForm"; // non-lazy for instant load
import EnquiryDashBoard from "./screens/EnquiryDashBoard"; // frequent page
import NewEnquiry from "./screens/NewEnquiry"; // frequent page
import DeletedQuotList from "./screens/DeletedQuotList";
import NewBookingDashboard from "./components/NewBookingDashboard";
import SelectDashboard from "./screens/SelectDashboard";
import MakeReceipt from "./screens/MakeReceipt";
import BillList from "./screens/BillList";
import BillPreview from "./screens/BillPreview";
import DeletedBillList from "./screens/DeletedBillList";
import CalenderView from "./screens/CalenderView";
import UnsettledBill from "./screens/UnsettledBill";


// ⚡ Lazy load heavy pages only
const MainDashboard = lazy(() => import("./screens/MainDashboard"));
const MakeBooking = lazy(() => import("./screens/MakeBooking"));
const NewBooking = lazy(() => import("./screens/NewBooking"));
const NewParty = lazy(() => import("./screens/NewParty"));
const PartySearch = lazy(() => import("./screens/PartySearch"));
const NewPartySearch = lazy(() => import("./screens/EnqPartySearch"));
const EnqCompanySearch = lazy(() => import("./screens/EnqCompanySearch"));
const EnqFunctionSearch = lazy(() => import("./screens/EnqFunctionSearch"));
const NewCompany = lazy(() => import("./screens/NewCompany"));
const NewFunction = lazy(() => import("./screens/NewFunction"));
const NewServing = lazy(() => import("./screens/NewServing"));
const Items = lazy(() => import("./screens/Items"));
const ItemsMenu = lazy(() => import("./screens/ItemsMenu"));
const Company = lazy(() => import("./screens/Company"));
const DeletedCompanies = lazy(() => import("./screens/DeletedCompanies"));
const QuotationPreview = lazy(() => import("./screens/QuotationPreview"));
const DemoBillList = lazy(() => import("./screens/DemoBillList"));

// Optimized ToastContainer - SIMPLIFIED VERSION
function ToastContainerOnce() {
  return (
    <ToastContainer
      position="top-center"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="light"
      style={{
        zIndex: 9999,
        fontSize: '14px'
      }}
    />
  );
}

function App() {
  const user = localStorage.getItem("user");

  // Preload frequently used screens
  useEffect(() => {
    if (user) {
      import("./screens/MainDashboard");
      import("./screens/MakeBooking");
      import("./screens/NewBooking");
    }
  }, [user]);

  // Memoize Routes to prevent unnecessary re-renders
  const routes = useMemo(() => (
    <Routes>
      <Route path="/" element={<LoginForm />} />
      <Route path="/dashboard" element={<ProtectedRoute><MainDashboard /></ProtectedRoute>} />
      <Route path="/enquiry-dashboard" element={<ProtectedRoute><EnquiryDashBoard /></ProtectedRoute>} />
      <Route path="/new-enquiry" element={<ProtectedRoute><NewEnquiry /></ProtectedRoute>} />
      <Route path="/select-dashboard" element={<ProtectedRoute><SelectDashboard /></ProtectedRoute>} />
      <Route path="/new-booking-dashboard" element={<ProtectedRoute><NewBookingDashboard /></ProtectedRoute>} />
      <Route path="/make-booking" element={<ProtectedRoute><MakeBooking /></ProtectedRoute>} />
      <Route path="/unsettled-bill" element={<ProtectedRoute><UnsettledBill/></ProtectedRoute>} />
      <Route path="/new-booking" element={<ProtectedRoute><NewBooking /></ProtectedRoute>} />
      <Route path="/new-party" element={<ProtectedRoute><NewParty /></ProtectedRoute>} />
      <Route path="/search-party" element={<ProtectedRoute><PartySearch /></ProtectedRoute>} />
      <Route path="/search-party-enquiry" element={<ProtectedRoute><NewPartySearch /></ProtectedRoute>} />
      <Route path="/search-company-enquiry" element={<ProtectedRoute><EnqCompanySearch /></ProtectedRoute>} />
      <Route path="/search-function-enquiry" element={<ProtectedRoute><EnqFunctionSearch /></ProtectedRoute>} />
      <Route path="/search-company" element={<ProtectedRoute><NewCompany /></ProtectedRoute>} />
      <Route path="/search-function" element={<ProtectedRoute><NewFunction /></ProtectedRoute>} />
      <Route path="/search-serving" element={<ProtectedRoute><NewServing /></ProtectedRoute>} />
      <Route path="/items" element={<ProtectedRoute><Items /></ProtectedRoute>} />
      <Route path="/item-menu" element={<ProtectedRoute><ItemsMenu /></ProtectedRoute>} />
      <Route path="/company-section" element={<ProtectedRoute><Company /></ProtectedRoute>} />
      <Route path="/deleted-company" element={<ProtectedRoute><DeletedCompanies /></ProtectedRoute>} />
      <Route path="/quote-list" element={<ProtectedRoute><DemoBillList /></ProtectedRoute>} />
      <Route path="/deleted-quotes" element={<ProtectedRoute><DeletedQuotList /></ProtectedRoute>} />
      <Route path="/quotation-preview" element={<ProtectedRoute><QuotationPreview /></ProtectedRoute>} />
      {/* bill section */}
      <Route path="/bill-list" element={<ProtectedRoute><BillList /></ProtectedRoute>} />
      <Route path="/deleted-bills" element={<ProtectedRoute><DeletedBillList /></ProtectedRoute>} />
      <Route path="/bill-preview" element={<ProtectedRoute><BillPreview /></ProtectedRoute>} />
      <Route path="/make-receipt" element={<ProtectedRoute><MakeReceipt /></ProtectedRoute>} />
      {/* calender view */}
      <Route path="/calender-view" element={<ProtectedRoute><CalenderView /></ProtectedRoute>} />
    </Routes>
  ), []); 

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <BrowserRouter>
        <ToastContainerOnce />
        <Suspense fallback={<div style={{ textAlign: "center", marginTop: 50 }}>Loading...</div>}>
          {routes}
        </Suspense>
      </BrowserRouter>
    </LocalizationProvider>
  );
}

export default App;