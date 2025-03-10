import React, { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import phantomLogo from "../assets/phantom.png"; // Icône du wallet Phantom
import "./LPFarming.css"; // Fichier CSS

const LPFarming = () => {
  const [capital, setCapital] = useState(250);
  const [duration, setDuration] = useState(1);
  const [profit, setProfit] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { publicKey, sendTransaction } = useWallet(); // Déclaration correcte

  // Vérifier la connexion du wallet
  useEffect(() => {
    if (publicKey) {
      console.log("Wallet connecté :", publicKey.toBase58());
    } else {
      console.log("Aucun wallet connecté.");
    }
  }, [publicKey]);

  // Calcul des gains
  const calculateProfit = () => {
    const monthlyRate = 0.10;
    const totalProfit = capital * Math.pow(1 + monthlyRate, duration) - capital;
    setProfit(totalProfit.toFixed(2));
  };

  // Fonction pour valider l'investissement
  const handleInvest = async () => {
    if (!publicKey) {
      alert("Veuillez connecter votre wallet avant d'investir !");
      return;
    }

    const connection = new Connection("https://api.devnet.solana.com", "confirmed");

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: new PublicKey("F2YAAoN6GX9fJmHjtB28ausHJMWjZdKZR7Kw718q2wn4"), // Adresse de test
        lamports: 0.01 * LAMPORTS_PER_SOL, // Test avec 0.01 SOL
      })
    );

    try {
      setIsLoading(true);
      const signature = await sendTransaction(transaction, connection);
      console.log("Transaction envoyée avec succès :", signature);
      alert(`✅ Transaction réussie ! ID : ${signature}`);
    } catch (error) {
      console.error("Erreur lors de la transaction :", error);
      alert("❌ Échec de la transaction.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="lp-container">
      <h1>LP Farming - Génération de Rendement</h1>
      <p>
        <b>Liquidity Provider (LP) Farming</b> vous permet d’investir des fonds 
        dans des pools de liquidités et d'obtenir un rendement stable de 
        <b>10% par mois</b>. Grâce à l’optimisation automatique, votre capital 
        est réinvesti pour maximiser les gains.
      </p>

      {/* Connexion au Wallet */}
      <div className="wallet-connection">
        <h3>Connexion au Wallet</h3>
        <WalletMultiButton />
      </div>

      <div className="solana-connect">
        {publicKey ? (
          <button className="wallet-button btn btn-success">
            ✅ {publicKey.toBase58().substring(0, 6)}...{publicKey.toBase58().slice(-4)}
          </button>
        ) : (
          <button className="wallet-button btn btn-primary" 
            onClick={() => window.open("https://solflare.com/connect", "_blank")}>
            <img src={phantomLogo} alt="Soflare" className="wallet-logo" />  
            Connecter Soflare (Solana)
          </button>
        )}
      </div>

      {/* Simulateur de gains */}
      <h2>Simulateur de Gains</h2>
      <div className="simulator">
        <label>Capital à investir ($) :</label>
        <input
          type="number"
          min="250"
          value={capital}
          onChange={(e) => setCapital(Number(e.target.value))}
        />

        <label>Durée (mois) :</label>
        <input
          type="number"
          min="1"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
        />

        <button onClick={calculateProfit}>Calculer</button>
        <h3>Gains estimés : <span>${profit}</span></h3>
      </div>

      {/* Risques */}
      <h2>Risques et Recommandations</h2>
      <ul className="risks">
        <li>La valeur des LP tokens peut varier en fonction du marché.</li>
        <li>Un impermanent loss peut affecter vos gains si le pool est instable.</li>
        <li>Utiliser des pools fiables avec une bonne liquidité.</li>
      </ul>

      {/* Bouton pour valider l'investissement */}
      <button className="validate-btn" onClick={handleInvest} disabled={isLoading}>
        {isLoading ? "Transaction en cours..." : "Valider mon choix"}
      </button>
    </div>
  );
};

export default LPFarming;