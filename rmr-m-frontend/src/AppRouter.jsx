import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import WalletConnect from "./pages/WalletConnect.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import NFTPurchase from "./pages/NFTPurchase.jsx";
import Affiliation from "./pages/Affiliation.jsx";
import InvestmentHistory from "./pages/InvestmentHistory.jsx";
import Navbar from "./components/Navbar.jsx";

const AppRouter = () => {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/wallet" element={<WalletConnect />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/nft" element={<NFTPurchase />} />
        <Route path="/affiliation" element={<Affiliation />} />
        <Route path="/history" element={<InvestmentHistory />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;