import React, { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

const LPFarming = () => {
  const [capital, setCapital] = useState(250);
  const [duration, setDuration] = useState(1);
  const [profit, setProfit] = useState(0);
  const [loading, setLoading] = useState(false);
  const [metamaskAccount, setMetamaskAccount] = useState(null);
  const { publicKey, sendTransaction } = useWallet();

  useEffect(() => {
    // Vérifier si Metamask est déjà connecté
    const savedMetamaskAccount = localStorage.getItem("metamaskAccount");
    if (savedMetamaskAccount) {
      setMetamaskAccount(savedMetamaskAccount);
    }
  }, []);

  // Fonction pour connecter Metamask
  const connectMetamask = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        setMetamaskAccount(accounts[0]);
        localStorage.setItem("metamaskAccount", accounts[0]);
      } catch (error) {
        console.error("Erreur de connexion Metamask", error);
      }
    } else {
      // 📌 Si sur mobile, ouvrir l'application Metamask
      window.location.href = "https://metamask.app.link/dapp/jhvcav.github.io/rmr-m/lp-farming";
    }
  };

  // Fonction pour connecter Phantom Wallet
  const connectPhantom = async () => {
    if (window.solana && window.solana.isPhantom) {
      try {
        const response = await window.solana.connect();
        localStorage.setItem("phantomAccount", response.publicKey.toBase58());
      } catch (error) {
        console.error("Erreur de connexion Phantom", error);
      }
    } else {
      // 📌 Si sur mobile, ouvrir l'application Phantom
      window.location.href = "https://phantom.app/ul/browse/jhvcav.github.io/rmr-m/lp-farming";
    }
  };

  // Calcul du profit
  const calculateProfit = () => {
    const monthlyRate = 0.10; // Rendement mensuel de 10%
    const totalProfit = capital * Math.pow(1 + monthlyRate, duration) - capital;
    setProfit(totalProfit.toFixed(2));
  };

  // Exécuter la transaction
  const handleInvest = async () => {
    if (!publicKey && !metamaskAccount) {
      alert("Veuillez connecter votre wallet avant d'investir !");
      return;
    }

    if (publicKey) {
      try {
        setLoading(true);
        const connection = new Connection("https://api.devnet.solana.com", "confirmed");
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: new PublicKey("CiMWv7EXEHUhGKtAdVyZ4JJJ8KCBkUVvUq1KiaTELLF2"), // Adresse du smart contract Solana
            lamports: capital * 10 ** 9, // Conversion en lamports
          })
        );

        const signature = await sendTransaction(transaction, connection);
        alert(`✅ Investissement réussi ! Transaction : ${signature}`);
      } catch (error) {
        console.error("Erreur d'investissement Solana :", error);
        alert("❌ Échec de l'investissement.");
      } finally {
        setLoading(false);
      }
    }

    if (metamaskAccount) {
      alert(`✅ Prêt pour une transaction Ethereum avec Metamask (${metamaskAccount})`);
      // Ici, on pourra ajouter la transaction Ethereum quand le smart contract sera prêt
    }
  };

  return (
    <div className="lp-container">
      <h1>LP Farming - Génération de Rendement</h1>
      <p>
        <b>Liquidity Provider (LP) Farming</b> permet d’investir des fonds dans des pools de liquidités 
        et d'obtenir un rendement stable de <b>10% par mois</b>.
      </p>

      <h2>Connexion au Wallet</h2>
      <div className="wallet-buttons">
        {/* Bouton Metamask */}
        <button className="wallet-button btn btn-light" onClick={connectMetamask}>
          {metamaskAccount ? `✅ ${metamaskAccount.substring(0, 6)}...${metamaskAccount.slice(-4)}` : "Connecter Metamask"}
        </button>

        {/* Bouton Phantom */}
        <button className="wallet-button btn btn-light" onClick={connectPhantom}>
          {publicKey ? `✅ ${publicKey.toBase58().substring(0, 6)}...${publicKey.toBase58().slice(-4)}` : "Connecter Phantom"}
        </button>
      </div>

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
      <ul>
        <li>La valeur des LP tokens peut varier en fonction du marché.</li>
        <li>Un impermanent loss peut affecter vos gains si le pool est instable.</li>
        <li>Utiliser des pools fiables avec une bonne liquidité.</li>
      </ul>

      <button className="validate-btn" onClick={handleInvest} disabled={loading}>
        {loading ? "Transaction en cours..." : "Valider mon choix"}
      </button>
    </div>
  );
};

export default LPFarming;