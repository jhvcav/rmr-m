import React, { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import phantomLogo from "../assets/phantom.png"; // Icône du wallet Phantom
import "./LPFarming.css";
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
        alert("🚨 Alerte : Wallet non détecté. Connectez d'abord votre wallet !");
        return;
    }

    alert("✅ Wallet détecté : " + publicKey.toBase58());

    const connection = new Connection("https://api.devnet.solana.com", "confirmed");
    const investorPubKey = new PublicKey(publicKey);

    const transaction = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey: investorPubKey,
            toPubkey: new PublicKey("ADRESSE_DU_CONTRAT_LP_FARMING"), // Remplace par l'adresse réelle
            lamports: capital * 10 ** 9, // Conversion en lamports
        })
    );

    alert("📌 Transaction créée, en attente d'envoi...");

    try {
        const signature = await sendTransaction(transaction, connection);
        alert(`🎉 Transaction envoyée avec succès ! Signature : ${signature}`);
    } catch (error) {
        alert("❌ Erreur d'investissement : " + error.message);
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

      <h2>Simulateur de Gains</h2>
      <div className="simulator">ière
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