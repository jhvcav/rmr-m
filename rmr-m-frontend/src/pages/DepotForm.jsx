import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./DepotForm.css"; // Assure-toi que le fichier CSS est correctement lié

const BSC_TESTNET_ID = "0x613d1563d102482491c271afb223c03c94e8209547fc143fc83d369020a91769"; // ID de la chaîne BSC Testnet en hexadécimal (97 en décimal)
const BSC_TESTNET_RPC = "https://hidden-lingering-putty.bsc-testnet.quiknode.pro/2a3d280c36b92efa575cf529eb48de2999ccf7f8/"; // Remplace par ton RPC privé

const DepotForm = () => {
  const [amount, setAmount] = useState(0.05); // Montant par défaut 0.05 BNB
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
      setStatus("❌ Veuillez installer MetaMask.");
    }
  }, []);

  // Basculer vers le réseau BSC Testnet si nécessaire
  const switchToBSCTestnet = async () => {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: BSC_TESTNET_ID }],
      });
      console.log("Connecté au réseau Binance Smart Chain Testnet.");
      return true;
    } catch (error) {
      console.error("Erreur lors du basculement vers BSC Testnet :", error);
      setStatus("❌ Veuillez basculer vers le réseau Binance Smart Chain Testnet.");
      return false;
    }
  };

  // Connexion à MetaMask
  const handleConnect = async () => {
    if (!window.ethereum) {
      setStatus("❌ Veuillez installer MetaMask.");
      return;
    }

    try {
      // Basculer vers le réseau BSC Testnet
      const isBSCTestnet = await switchToBSCTestnet();
      if (!isBSCTestnet) return;

      // Demander l'accès au compte MetaMask
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const account = accounts[0]; // Récupérer le premier compte connecté
      setPublicKey(account);
      setIsConnected(true);

      // Initialisation du provider avec ton RPC privé
      const provider = new ethers.providers.JsonRpcProvider(BSC_TESTNET_RPC);

      // Récupérer le solde BNB
      const balanceWei = await provider.getBalance(account);
      const balanceInBNB = ethers.utils.formatEther(balanceWei);
      setBalance(balanceInBNB);
      setStatus("✅ Wallet connecté avec succès !");
    } catch (error) {
      console.error("Erreur lors de la connexion à MetaMask :", error);
      if (error.code === 4001) {
        setStatus("❌ Connexion refusée par l'utilisateur.");
      } else {
        setStatus("❌ Erreur lors de la connexion à MetaMask.");
      }
    }
  };

  // Fonction pour effectuer un dépôt
  const handleDepot = async () => {
    if (!isConnected) {
      setStatus("⚠️ Veuillez vous connecter à MetaMask.");
      return;
    }

    if (!destinationAddress) {
      setStatus("⚠️ Veuillez entrer une adresse de destination.");
      return;
    }

    if (amount <= 0 || isNaN(amount)) {
      setStatus("⚠️ Montant invalide.");
      return;
    }

    try {
      // Utiliser ton RPC privé pour le provider
      const provider = new ethers.providers.JsonRpcProvider(BSC_TESTNET_RPC);
      const signer = provider.getSigner(publicKey); // Utiliser le compte connecté comme signer

      const tx = {
        to: destinationAddress,
        value: ethers.utils.parseEther(amount.toString()), // Convertir le montant en wei
      };

      const txResponse = await signer.sendTransaction(tx);
      setStatus(`✅ Transaction envoyée avec succès ! ID : ${txResponse.hash}`);

      // Rafraîchir le solde après la transaction
      const balanceWei = await provider.getBalance(publicKey);
      const balanceInBNB = ethers.utils.formatEther(balanceWei);
      setBalance(balanceInBNB);
    } catch (error) {
      console.error("❌ Erreur lors du dépôt de fonds :", error);
      setStatus("❌ Une erreur est survenue lors de la transaction.");
    }
  };

  return (
    <div className="depot-form">
      <h1 style={{ fontSize: "1.5em" }}>💰 Dépôt de fonds</h1>

      {/* Vérification de la connexion au Wallet */}
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