import React, { useState, useEffect } from "react";
import './DepotForm.css';

const DepotForm = () => {
  const [amount, setAmount] = useState(0.05); // Montant par défaut en BNB
  const [destinationAddress, setDestinationAddress] = useState("");
  const [status, setStatus] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [publicKey, setPublicKey] = useState(null);
  const [balance, setBalance] = useState(null);

  // Vérifier si MetaMask est installé
  useEffect(() => {
    if (window.ethereum) {
      console.log("MetaMask détecté !");
    } else {
      console.log("MetaMask n'est pas détecté.");
    }
  }, []);

  // Fonction pour se connecter à MetaMask
  const handleConnect = async () => {
    if (!window.ethereum) {
      alert("MetaMask n'est pas installé !");
      return;
    }

    try {
      // Demander à l'utilisateur de se connecter à MetaMask
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

      // Si l'utilisateur se connecte, on récupère son adresse publique
      const account = accounts[0];
      setPublicKey(account);
      setIsConnected(true);
      setStatus("✅ Connecté avec succès !");
      
      // Récupérer le solde BNB de l'utilisateur
      fetchBalance(account);
    } catch (error) {
      console.error("Erreur de connexion à MetaMask :", error);
      setStatus("❌ Échec de la connexion.");
    }
  };

  // Fonction pour récupérer le solde de BNB de l'utilisateur
  const fetchBalance = async (account) => {
    if (account) {
      try {
        const provider = new window.ethers.JsonRpcProvider("https://bsc-dataseed.binance.org/");  // Utilisation d'un provider BSC
        const balance = await provider.getBalance(account);
        setBalance(window.ethers.utils.formatEther(balance));  // Convertir en BNB
      } catch (error) {
        console.error("Erreur lors de la récupération du solde :", error);
        setBalance(null);
      }
    }
  };

  // Fonction pour effectuer le dépôt de BNB
  const handleDepot = async () => {
    if (!isConnected) {
      setStatus("⚠️ Veuillez vous connecter à MetaMask.");
      return;
    }

    if (!destinationAddress || !window.ethers.utils.isAddress(destinationAddress)) {
      setStatus("⚠️ Adresse de destination invalide.");
      return;
    }

    if (amount <= 0 || isNaN(amount)) {
      setStatus("⚠️ Veuillez entrer un montant valide.");
      return;
    }

    if (balance < amount) {
      setStatus("⚠️ Fonds insuffisants pour effectuer la transaction.");
      return;
    }

    try {
      console.log("🔹 Début de la transaction...");
      console.log("➡️ Destination :", destinationAddress);
      console.log("💸 Montant :", amount, "BNB");

      const provider = new window.ethers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
      const signer = provider.getSigner(); // Obtenir le signer à partir de MetaMask
      const tx = {
        to: destinationAddress,
        value: window.ethers.utils.parseEther(amount.toString()), // Convertir en Wei
      };

      console.log("🔹 Envoi de la transaction...");
      const transactionResponse = await signer.sendTransaction(tx);
      setStatus(`✅ Transaction envoyée avec succès ! ID : ${transactionResponse.hash}`);

      // Attendre la confirmation de la transaction
      await transactionResponse.wait();
      setStatus("✅ Transaction confirmée avec succès !");
      fetchBalance(publicKey);  // Rafraîchir le solde
    } catch (error) {
      console.error("❌ Erreur lors du dépôt de fonds :", error);
      setStatus(`❌ Une erreur est survenue : ${error.message}`);
    }
  };

  return (
    <div className="depot-form">
      <h1 style={{ fontSize: "1.5em" }}>💰 Dépôt de fonds!!!</h1>

      {/* Affichage du statut du wallet */}
      <div className="wallet-status">
        {isConnected ? (
          <>
            <p>✅ Connecté avec l'adresse :</p>
            <p className="wallet-address">{publicKey}</p>
            <p>💰 Solde disponible : <strong>{balance} BNB</strong></p>
          </>
        ) : (
          <p>⚠️ Non connecté.</p>
        )}
        <button onClick={handleConnect} disabled={isConnected}>
          {isConnected ? "✅ Déjà connecté" : "🔗 Se connecter à MetaMask"}
        </button>
      </div>

      {/* Adresse de destination */}
      <div className="input-container">
        <label>🔹 Adresse de destination :</label>
        <input
          type="text"
          value={destinationAddress}
          onChange={(e) => setDestinationAddress(e.target.value)}
          placeholder="Entrez l'adresse BSC"
        />
      </div>

      {/* Montant */}
      <div className="input-container">
        <label>💸 Montant (en BNB) :</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Entrez le montant"
          min="0.0001"
          step="0.0001"
        />
      </div>

      {/* Bouton d'envoi */}
      <button onClick={handleDepot} disabled={!isConnected}>
        🚀 Envoyer {amount} BNB
      </button>

      {/* Message de statut */}
      <p className="status">{status}</p>
    </div>
  );
};

export default DepotForm;