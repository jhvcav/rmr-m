import React, { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import "./LPFarming.css"; // Fichier CSS

const LPFarming = () => {
  const [capital, setCapital] = useState(250);
  const [duration, setDuration] = useState(1);
  const [profit, setProfit] = useState(0);
  const [loading, setLoading] = useState(false);
  const { publicKey, sendTransaction } = useWallet();

  // Calcul des gains
  const calculateProfit = () => {
    const monthlyRate = 0.10;
    const totalProfit = capital * Math.pow(1 + monthlyRate, duration) - capital;
    setProfit(totalProfit.toFixed(2));
  };

  // Fonction pour valider l'investissement
  const handleInvest = async () => {
    if (!publicKey) {
      alert("❌ Veuillez connecter votre wallet avant d'investir !");
      return;
    }

    const connection = new Connection("https://api.devnet.solana.com", "confirmed");
    const investorPubKey = new PublicKey(publicKey);
    
    // Adresse du Smart Contract LP Farming (Mettre la bonne adresse ici)
    const contractAddress = new PublicKey("4MBDZ1vB2g77AshqzwL4WxrhWQzv9QUz1JaMWmUXzANy"); 

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: investorPubKey,
        toPubkey: contractAddress,
        lamports: capital * 10 ** 9, // Conversion en lamports
      })
    );

    try {
      setLoading(true);
      const signature = await sendTransaction(transaction, connection);
      alert(`✅ Investissement réussi !\nTransaction : ${signature}`);
    } catch (error) {
      console.error("Erreur d'investissement :", error);
      alert("❌ Échec de l'investissement. Veuillez réessayer.");
    } finally {
      setLoading(false);
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

      <h2>Simulateur de Gains</h2>
      <div className="simulator">
        <label>Capital à investir ($) :</label>
        <input
          type="number"
          min="250"
          value={capital}
          onChange={(e) => setCapital(e.target.value)}
        />

        <label>Durée (mois) :</label>
        <input
          type="number"
          min="1"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
        />

        <button onClick={calculateProfit}>Calculer</button>
        <h3>Gains estimés : <span>${profit}</span></h3>
      </div>

      <h2>Risques et Recommandations</h2>
      <ul className="risks">
        <li>La valeur des LP tokens peut varier en fonction du marché.</li>
        <li>Un impermanent loss peut affecter vos gains si le pool est instable.</li>
        <li>Utiliser des pools fiables avec une bonne liquidité.</li>
      </ul>

      {/* Bouton pour valider l'investissement */}
      <button className="validate-btn" onClick={handleInvest} disabled={loading}>
        {loading ? "Transaction en cours..." : "Valider mon choix"}
      </button>
    </div>
  );
};

export default LPFarming;