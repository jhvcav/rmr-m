import React, { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import "./LPFarming.css"; // Fichier CSS

const LPFarming = () => {
  const [capital, setCapital] = useState(250);
  const [duration, setDuration] = useState(1);
  const [profit, setProfit] = useState(0);
  const [loading, setLoading] = useState(false);
  const [solflareAddress, setSolflareAddress] = useState(null); // ✅ Adresse du wallet Solflare
  const { publicKey, sendTransaction } = useWallet();

  // Détection et connexion à Soflare
  const connectSoflare = async () => {
    if (window.solflare) {
      try {
        await window.solflare.connect();
        setSolflareAddress(window.solflare.publicKey.toBase58()); // ✅ Récupérer l’adresse
      } catch (error) {
        console.error("Erreur de connexion à Solflare :", error);
        alert("Impossible de se connecter à Solflare.");
      }
    } else {
      alert("Solflare Wallet non détecté ! Installez l'application ou l'extension.");
      window.location.href = "https://solflare.com"; // ✅ Redirige vers l’installation
    }
  };

  const calculateProfit = () => {
    const monthlyRate = 0.10; // Rendement mensuel de 10%
    const totalProfit = capital * Math.pow(1 + monthlyRate, duration) - capital;
    setProfit(totalProfit.toFixed(2));
  };

  // Fonction pour valider l'investissement
  const handleInvest = async () => {
    const connectedWallet = publicKey || solflareAddress; // ✅ Vérifie si Metamask, Phantom ou Solflare est connecté
    if (!connectedWallet) {
      alert("Veuillez connecter votre wallet avant d'investir !");
      return;
    }

    const connection = new Connection("https://api.devnet.solana.com", "confirmed");
    const investorPubKey = new PublicKey(connectedWallet);

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: investorPubKey,
        toPubkey: new PublicKey("ADRESSE_DU_CONTRAT_LP_FARMING"), // ✅ Adresse du contrat
        lamports: capital * 10 ** 9, // ✅ Conversion en lamports
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
        <b>Liquidity Provider (LP) Farming</b> permet d’investir dans des pools et de générer <b>10% de rendement par mois</b>.
      </p>

      <h2>Connexion au Wallet</h2>
      <div className="wallet-buttons">
        <button className="btn btn-primary" onClick={connectSoflare}>
          Connecter Solflare
        </button>
        {solflareAddress && <p>✅ Connecté à : {solflareAddress}</p>}
      </div>

      <h2>Simulateur de Gains</h2>
      <div className="simulator">
        <label>Capital à investir ($) :</label>
        <input type="number" min="250" value={capital} onChange={(e) => setCapital(e.target.value)} />

        <label>Durée (mois) :</label>
        <input type="number" min="1" value={duration} onChange={(e) => setDuration(e.target.value)} />

        <button onClick={calculateProfit}>Calculer</button>
        <h3>Gains estimés : <span>${profit}</span></h3>
      </div>

      <h2>Risques et Recommandations</h2>
      <ul className="risks">
        <li>La valeur des LP tokens peut varier en fonction du marché.</li>
        <li>Un impermanent loss peut affecter vos gains.</li>
        <li>Utiliser des pools fiables avec une bonne liquidité.</li>
      </ul>

      <button className="validate-btn" onClick={handleInvest} disabled={loading}>
        {loading ? "Transaction en cours..." : "Valider mon choix"}
      </button>
    </div>
  );
};

export default LPFarming;