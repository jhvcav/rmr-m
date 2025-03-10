import React, { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import "./LPFarming.css"; // Fichier CSS pour le style

const LPFarming = () => {
  const [capital, setCapital] = useState(250);
  const [duration, setDuration] = useState(1);
  const [profit, setProfit] = useState(0);
  const [loading, setLoading] = useState(false);
  const { publicKey, sendTransaction } = useWallet();

  const calculateProfit = () => {
    const monthlyRate = 0.10; // Rendement mensuel de 10%
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
    const investorPubKey = new PublicKey(publicKey);

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: investorPubKey,
        toPubkey: new PublicKey("ADRESSE_DU_CONTRAT_LP_FARMING"), // Adresse du smart contract
        lamports: capital * 10 ** 9, // Conversion en lamports
      })
    );

    try {
      setLoading(true);
      const signature = await sendTransaction(transaction, connection);
      alert(`✅ Investissement réussi ! Transaction : ${signature}`);
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
        <b>Liquidity Provider (LP) Farming</b> vous permet d’investir des fonds dans des pools de liquidités 
        et d'obtenir un rendement stable de <b>10% par mois</b>. Grâce à l’optimisation automatique, votre 
        capital est réinvesti pour maximiser les gains.
      </p>

      <h2>Comment ça fonctionne ?</h2>
      <ul>
        <li>Vous déposez des fonds dans un pool de liquidité.</li>
        <li>Le protocole optimise votre rendement automatiquement.</li>
        <li>Vous générez des intérêts composés chaque mois.</li>
        <li>Vous pouvez retirer vos fonds à tout moment.</li>
      </ul>

      <div className="lpfarming-container">
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

        <button className="validate-btn" onClick={handleInvest} disabled={loading}>
          {loading ? "Transaction en cours..." : "Valider mon choix"}
        </button>
      </div>
    </div>
  );
};

export default LPFarming;