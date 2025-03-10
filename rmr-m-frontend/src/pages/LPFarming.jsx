import React, { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import "./LPFarming.css"; // Fichier CSS

const LPFarming = () => {
  const [amount, setAmount] = useState("");
  const { publicKey } = useWallet();

  const handleTransaction = async () => {
    alert(`Vous allez envoyer ${amount} SOL à l'adresse de test.`);
    alert(`Bouton cliqué`);
  };

  return (
    <div className="lp-container">
      <h1>LP Farming - Connexion et Envoi de SOL</h1>
      <p>Connectez votre wallet Solflare pour continuer.</p>

      <div className="wallet-connection">
        <WalletMultiButton />
      </div>

      {publicKey && (
        <p>✅ Wallet connecté : {publicKey.toBase58()}</p>
      )}

      {publicKey && (
        <div className="transaction-section">
          <h2>Envoyer des SOL</h2>
          <input
            type="number"
            placeholder="Montant en SOL"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <button onClick={handleTransaction}>Envoyer SOL</button>
        </div>
      )}
    </div>
  );
};

export default LPFarming;