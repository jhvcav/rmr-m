import React, { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

const WalletConnect = () => {
  const [metamaskAccount, setMetamaskAccount] = useState(null);
  const { publicKey } = useWallet();

  // Connexion Metamask
  const connectMetamask = async () => {
    if (typeof window !== "undefined") {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({
            method: "eth_requestAccounts",
          });
          setMetamaskAccount(accounts[0]); // Stocker le compte Metamask
        } catch (error) {
          console.error("Erreur de connexion Metamask", error);
        }
      } else {
        // 📌 Rediriger vers Metamask Mobile si sur mobile
        window.location.href = "https://metamask.app.link/dapp/github.jhvcav";
      }
    } else {
      alert("Metamask non détecté !");
    }
  };

  const connectPhantom = async () => {
    if (typeof window !== "undefined") {
      if (window.solana && window.solana.isPhantom) {
        try {
          const response = await window.solana.connect();
          setSolanaAccount(response.publicKey.toBase58()); // Stocker l'adresse Solana
        } catch (error) {
          console.error("Erreur de connexion Phantom", error);
        }
      } else {
        // 📌 Rediriger vers l’application Phantom si sur mobile
        window.location.href = "https://phantom.app/ul/browse/jhvcav.github.io/rmr-m-frontend/";
      }
    } else {
      alert("Phantom Wallet non détecté !");
    }
  };

  return (
    <div className="wallet-container">
      <h1>Connexion au Wallet</h1>
      <p>Connectez votre portefeuille pour accéder à la plateforme.</p>

      <div className="wallet-buttons">
        {/* Bouton Metamask */}
        {metamaskAccount ? (
          <button className="btn btn-success">
            {metamaskAccount.substring(0, 6)}...{metamaskAccount.slice(-4)}
          </button>
        ) : (
          <button className="btn btn-primary" onClick={connectMetamask}>
            Connecter Metamask
          </button>
        )}

        {/* Bouton Solana */}
        {publicKey ? (
          <button className="btn btn-success">
            {publicKey.toBase58().substring(0, 6)}...{publicKey.toBase58().slice(-4)}
          </button>
        ) : (
          <WalletMultiButton />
        )}
      </div>
    </div>
  );
};

export default WalletConnect;