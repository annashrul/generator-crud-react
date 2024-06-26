import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import AppLayout from "./components/Layout";
import Customer from "./pages/Customer";
import Sales from "./pages/Sales";
// import Home from "./pages/Home";

const App = () => {
  return (
    <Router>
      <AppLayout>
        <Routes>
          {/* <Route path="/" element={<Home />} /> */}
          <Route path="/customer" element={<Customer />} />
          <Route path="/sales" element={<Sales />} />
        </Routes>
      </AppLayout>
    </Router>
  );
};

export default App;
