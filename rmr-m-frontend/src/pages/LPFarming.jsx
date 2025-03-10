import React from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import "./LPFarming.css"; // Fichier CSS

const LPFarming = () => {
  const { publicKey } = useWallet();

  return (
    <div className="lp-container">
      <h1>LP Farming - Connexion au Wallet Solflare</h1>
      <p>Connectez votre wallet Solflare pour continuer.</p>

      <div className="wallet-connection">
        <WalletMultiButton />
      </div>

      {publicKey && (
        <p>✅ Wallet connecté : {publicKey.toBase58()}</p>
      )}
    </div>
  );
};

export default LPFarming;