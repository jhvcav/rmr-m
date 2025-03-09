import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";

import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import WalletConnect from "./pages/WalletConnect";
import Dashboard from "./pages/Dashboard";
import NFT from "./pages/NFT";
import Affiliation from "./pages/Affiliation";
import Historique from "./pages/Historique";
import Contact from "./pages/Contact";
import APropos from "./pages/APropos";

import "./App.css";

const App = () => {
  const wallets = [new PhantomWalletAdapter()];

  return (
    <ConnectionProvider endpoint="https://api.devnet.solana.com">
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <Router>
            <Navbar />
            <Routes>
              {/* Route de l apage d'accueil */}
              <Route path="/rmr-m" element={<Home />} />

              {/* Les autres routes */}
              <Route path="/wallet-connect" element={<WalletConnect />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/nft" element={<NFT />} />
              <Route path="/affiliation" element={<Affiliation />} />
              <Route path="/historique" element={<Historique />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/a-propos" element={<APropos />} />
            </Routes>
          </Router>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default App;