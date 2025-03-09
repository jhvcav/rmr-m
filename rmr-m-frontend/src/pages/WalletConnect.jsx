import React, { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

const WalletConnect = () => {
  const [metamaskAccount, setMetamaskAccount] = useState(null);
  const { publicKey } = useWallet();

  // Connexion Metamask
  const connectMetamask = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        setMetamaskAccount(accounts[0]); // Stocke l'adresse du compte
      } catch (error) {
        console.error("Erreur de connexion Metamask", error);
      }
    } else {
      alert("Metamask non détecté !");
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