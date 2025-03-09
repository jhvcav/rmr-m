import React, { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import metamaskLogo from "../assets/metamask.png"; 
import phantomLogo from "../assets/phantom.png"; 
import "./WalletConnect.css"; 

const WalletConnect = () => {
  const [metamaskAccount, setMetamaskAccount] = useState(null);
  const [solanaAccount, setSolanaAccount] = useState(null);
  const { publicKey } = useWallet();

  useEffect(() => {
    const checkWalletConnection = async () => {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts.length > 0) {
          setMetamaskAccount(accounts[0]);
        }
      }
      if (window.solana && window.solana.isPhantom) {
        try {
          const response = await window.solana.connect({ onlyIfTrusted: true });
          setSolanaAccount(response.publicKey.toBase58());
        } catch (error) {
          console.error("Erreur de connexion Phantom", error);
        }
      }
    };
    checkWalletConnection();
  }, []);

  const connectMetamask = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        setMetamaskAccount(accounts[0]);
      } catch (error) {
        console.error("Erreur de connexion Metamask", error);
      }
    } else {
      window.location.href = "https://metamask.app.link/dapp/jhvcav.github.io/rmr-m/";
    }
  };

  const connectPhantom = async () => {
    if (window.solana && window.solana.isPhantom) {
      try {
        const response = await window.solana.connect();
        setSolanaAccount(response.publicKey.toBase58());

        // 📌 **Rediriger vers le DApp après connexion**
        setTimeout(() => {
          window.location.href = "https://jhvcav.github.io/rmr-m/";
        }, 1000); // Petit délai pour garantir que la connexion est bien établie
      } catch (error) {
        console.error("Erreur de connexion Phantom", error);
      }
    } else {
      window.location.href = "https://phantom.app/ul/browse/jhvcav.github.io/rmr-m/";
    }
  };

  return (
    <div className="wallet-container">
      <h1>Connexion au Wallet</h1>
      <p>Connectez votre portefeuille pour accéder à la plateforme.</p>

      <div className="wallet-buttons">
        {/* Bouton Metamask */}
        <button className="wallet-button btn btn-light" onClick={connectMetamask}>
          <img src={metamaskLogo} alt="Metamask" className="wallet-logo" />
          {metamaskAccount ? `✅ ${metamaskAccount.substring(0, 6)}...${metamaskAccount.slice(-4)}` : "Connecter Metamask"}
        </button>

        {/* Bouton Solana (Phantom) */}
        <button className="wallet-button btn btn-light" onClick={connectPhantom}>
          <img src={phantomLogo} alt="Phantom" className="wallet-logo" />
          {solanaAccount ? `✅ ${solanaAccount.substring(0, 6)}...${solanaAccount.slice(-4)}` : "Connecter Phantom"}
        </button>
      </div>
    </div>
  );
};

export default WalletConnect;