import React, { Suspense, lazy, useEffect, useMemo } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import ProtectedRoute from "./Routes/ProtectedRoute";
import LoginForm from "./screens/LoginForm";
import EnquiryDashBoard from "./screens/EnquiryDashBoard";
import NewEnquiry from "./screens/NewEnquiry";
import DeletedQuotList from "./screens/DeletedQuotList";
import NewBookingDashboard from "./components/NewBookingDashboard";
import SelectDashboard from "./screens/SelectDashboard";
import MakeReceipt from "./screens/MakeReceipt";
import BillList from "./screens/BillList";
import BillPreview from "./screens/BillPreview";
import DeletedBillList from "./screens/DeletedBillList";
import CalenderView from "./screens/CalenderView";
import UnsettledBill from "./screens/UnsettledBill";

import { NotifyProvider } from "./context/NotifyProvider";
import UpcomingEvents from "./screens/UpcomingEvents";
import Company from "./screens/master-screens/Company";
import SectionMaster from "./screens/master-screens/SectionMaster";
import ItemGroup from "./screens/master-screens/ItemGroup";
import MasterServing from "./screens/master-screens/MasterServing";
import Category from "./screens/master-screens/Category";
import SubCategory from "./screens/master-screens/SubCategory";
import SalesItem from "./screens/master-screens/SalesItem";
import Paymode from "./screens/master-screens/Paymode";
import MenuRateChange from "./screens/master-screens/MenuRateChange";
import StatusMaster from "./screens/master-screens/StatusMaster";
import EventMaster from "./screens/master-screens/EventMaster";
import FunctionMaster from "./screens/master-screens/FunctionMaster";
import PackageMaster from "./screens/master-screens/PackageMaster";
import ItemPackageMaster from "./screens/master-screens/ItemPackageMaster";

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
const DeletedCompanies = lazy(() => import("./screens/DeletedCompanies"));
const QuotationPreview = lazy(() => import("./screens/QuotationPreview"));
const DemoBillList = lazy(() => import("./screens/DemoBillList"));

function App() {
  const user = localStorage.getItem("user");

  useEffect(() => {
    if (user) {
      import("./screens/MainDashboard");
      import("./screens/MakeBooking");
      import("./screens/NewBooking");
    }
  }, [user]);

  const routes = useMemo(
    () => (
      <Routes>
        <Route path="/" element={<LoginForm />} />

        <Route path="/dashboard" element={<ProtectedRoute><MainDashboard /></ProtectedRoute>} />
        <Route path="/enquiry-dashboard" element={<ProtectedRoute><EnquiryDashBoard /></ProtectedRoute>} />
        <Route path="/new-enquiry" element={<ProtectedRoute><NewEnquiry /></ProtectedRoute>} />
        <Route path="/select-dashboard" element={<ProtectedRoute><SelectDashboard /></ProtectedRoute>} />
        <Route path="/new-booking-dashboard" element={<ProtectedRoute><NewBookingDashboard /></ProtectedRoute>} />
        <Route path="/make-booking" element={<ProtectedRoute><MakeBooking /></ProtectedRoute>} />
        <Route path="/unsettled-bill" element={<ProtectedRoute><UnsettledBill /></ProtectedRoute>} />
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
        <Route path="/deleted-company" element={<ProtectedRoute><DeletedCompanies /></ProtectedRoute>} />
        <Route path="/quote-list" element={<ProtectedRoute><DemoBillList /></ProtectedRoute>} />
        <Route path="/deleted-quotes" element={<ProtectedRoute><DeletedQuotList /></ProtectedRoute>} />
        <Route path="/quotation-preview" element={<ProtectedRoute><QuotationPreview /></ProtectedRoute>} />
        <Route path="/bill-list" element={<ProtectedRoute><BillList /></ProtectedRoute>} />
        <Route path="/deleted-bills" element={<ProtectedRoute><DeletedBillList /></ProtectedRoute>} />
        <Route path="/bill-preview" element={<ProtectedRoute><BillPreview /></ProtectedRoute>} />
        <Route path="/make-receipt" element={<ProtectedRoute><MakeReceipt /></ProtectedRoute>} />
        <Route path="/calender-view" element={<ProtectedRoute><CalenderView /></ProtectedRoute>} />
        <Route path="/upcoming-events" element={<ProtectedRoute><UpcomingEvents /></ProtectedRoute>} />
        {/* master screens */}
        <Route path="/master-company" element={<ProtectedRoute><Company /></ProtectedRoute>} />
        <Route path="/section-master" element={<ProtectedRoute><SectionMaster /></ProtectedRoute>} />
        <Route path="/item-group" element={<ProtectedRoute><ItemGroup /></ProtectedRoute>} />
        <Route path="/master-serving" element={<ProtectedRoute><MasterServing /></ProtectedRoute>} />
        <Route path="/master-category" element={<ProtectedRoute><Category /></ProtectedRoute>} />
        <Route path="/master-sub-category" element={<ProtectedRoute><SubCategory /></ProtectedRoute>} />
        <Route path="/master-sales-item" element={<ProtectedRoute><SalesItem /></ProtectedRoute>} />
        <Route path="/paymode" element={<ProtectedRoute><Paymode /></ProtectedRoute>} />
        <Route path="/menu-rate-change" element={<ProtectedRoute><MenuRateChange /></ProtectedRoute>} />
        <Route path="/status-master" element={<ProtectedRoute><StatusMaster /></ProtectedRoute>} />
        <Route path="/event-master" element={<ProtectedRoute><EventMaster /></ProtectedRoute>} />
        <Route path="/function-master" element={<ProtectedRoute><FunctionMaster /></ProtectedRoute>} />
        <Route path="/package-master" element={<ProtectedRoute><PackageMaster /></ProtectedRoute>} />
        <Route path="/item-package-master" element={<ProtectedRoute><ItemPackageMaster /></ProtectedRoute>} />
      </Routes>
    ),
    []
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <NotifyProvider>
        <BrowserRouter basename="/xpressbanquet">
          {/* ✅ ONLY ONE ToastContainer IN WHOLE APP */}
          <ToastContainer
            position="top-right"
            autoClose={2500}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            pauseOnFocusLoss
            draggable
            pauseOnHover
            limit={3}
          />

          <Suspense fallback={<div style={{ textAlign: "center", marginTop: 50 }}>Loading...</div>}>
            {routes}
          </Suspense>
        </BrowserRouter>
      </NotifyProvider>
    </LocalizationProvider>
  );
}

export default App;
