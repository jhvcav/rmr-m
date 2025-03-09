import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";

import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import WalletConnect from "./pages/WalletConnect";
import Dashboard from "./pages/Dashboard";

const App = () => {
  const wallets = [new PhantomWalletAdapter()];

  return (
    <ConnectionProvider endpoint="https://api.devnet.solana.com">
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <Router>
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/wallet-connect" element={<WalletConnect />} />
              <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
          </Router>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default App;