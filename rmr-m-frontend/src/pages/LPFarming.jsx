import React, { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import "./LPFarming.css"; // Fichier CSS

const LPFarming = () => {
  const { publicKey, sendTransaction } = useWallet();
  const [amount, setAmount] = useState("");

  const handleTransaction = async () => {
    if (!publicKey) {
      alert("Veuillez connecter votre wallet avant d'envoyer des SOL.");
      return;
    }

    if (isNaN(amount) || amount <= 0) {
      alert("Veuillez entrer un montant valide.");
      return;
    }

    const connection = new Connection("https://api.devnet.solana.com", "confirmed");
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: new PublicKey("F2YAAoN6GX9fJmHjtB28ausHJMWjZdKZR7Kw718q2wn4"), // Adresse de test
        lamports: parseFloat(amount) * LAMPORTS_PER_SOL, // Conversion SOL → Lamports
      })
    );

    try {
      const signature = await sendTransaction(transaction, connection);
      alert(`✅ Transaction réussie ! ID : ${signature}`);
    } catch (error) {
      console.error("Erreur lors de la transaction :", error);
      alert("❌ Échec de la transaction.");
    }
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