/**
 * Copyright (c) 2025 Jean Hugues CAVALIE
 * Tous droits réservés.
 * Ce code ne peut pas être utilisé ou redistribué sans autorisation.
 */

import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";

import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import WalletConnect from "./pages/WalletConnect";
import Dashboard from "./pages/Dashboard";
import NFT from "./pages/NFT";
import Affiliation from "./pages/Affiliation";
import Historique from "./pages/Historique";
import Contact from "./pages/Contact";
import APropos from "./pages/APropos";
import LPFarming from "./pages/LPFarming";

import "./App.css";

const App = () => {
  const wallets = [new PhantomWalletAdapter(), new SolflareWalletAdapter()];

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
              <Route path="/rmr-m/wallet-connect" element={<WalletConnect />} />
              <Route path="/rmr-m/dashboard" element={<Dashboard />} />
              <Route path="/rmr-m/nft" element={<NFT />} />
              <Route path="/rmr-m/affiliation" element={<Affiliation />} />
              <Route path="/rmr-m/historique" element={<Historique />} />
              <Route path="/rmr-m/contact" element={<Contact />} />
              <Route path="/rmr-m/a-propos" element={<APropos />} />
              <Route path="/rmr-m/lp-farming" element={<LPFarming />} />
            </Routes>
          </Router>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default App;