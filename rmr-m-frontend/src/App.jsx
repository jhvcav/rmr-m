/**
 * Copyright (c) 2025 Jean Hugues CAVALIE
 * Tous droits réservés.
 * Ce code ne peut pas être utilisé ou redistribué sans autorisation.
 */

import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Import des composants
import Logo from "./components/Logo";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import LPFarming from "./pages/LPFarming";
import DepotForm from "./pages/DepotForm";
import InvestmentHistory from "./pages/InvestmentHistory";
import ConfirmationDepot from "./pages/ConfirmationDepot";
import "./App.css";

const App = () => {
  return (
    <Router>
      <div className="app-wrapper">
        {/* Logo séparé et centré au-dessus de la navbar */}
        <Logo />
        
        {/* Navbar sans logo */}
        <Navbar />
        
        <div className="content-container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/rmr-m" element={<Home />} />
            <Route path="/rmr-m/dashboard" element={<Dashboard />} />
            <Route path="/rmr-m/lpfarming" element={<LPFarming />} />
            <Route path="/rmr-m/depot-form" element={<DepotForm />} />
            <Route path="/rmr-m/historique" element={<InvestmentHistory />} />
            <Route path="/rmr-m/confirmation-depot" element={<ConfirmationDepot />} />
            {/* Ajoutez d'autres routes selon vos besoins */}
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;