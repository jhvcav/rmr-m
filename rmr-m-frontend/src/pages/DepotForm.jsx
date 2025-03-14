import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./DepotForm.css"; // Assure-toi que le fichier CSS est correctement lié

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

  // Fonction pour effectuer un dépôt
  const handleDepot = async () => {
    // Vérifications...
    
    try {
      // Utiliser le provider de MetaMask
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner(); // Pas besoin de spécifier publicKey ici
  
      const tx = {
        to: destinationAddress,
        value: ethers.utils.parseEther(amount.toString()),
      };
  
      const txResponse = await signer.sendTransaction(tx);
      setStatus(`✅ Transaction envoyée avec succès ! ID : ${txResponse.hash}`);
  
      // Rafraîchir le solde après la transaction
      const balanceWei = await provider.getBalance(publicKey);
      const balanceInBNB = ethers.utils.formatEther(balanceWei);
      setBalance(balanceInBNB);
    } catch (error) {
      // Gestion d'erreur...
    }
  };

  // Basculer vers le réseau BSC Testnet si nécessaire
const switchToBSCTestnet = async () => {
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x61" }], // Chaîne BSC Testnet (97 en décimal)
    });
    console.log("Connecté au réseau Binance Smart Chain Testnet.");
    return true;
  } catch (error) {
    // Si l'erreur est 4902, cela signifie que le réseau n'est pas ajouté
    if (error.code === 4902) {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0x61",
              chainName: "BSC Testnet",
              nativeCurrency: {
                name: "BNB",
                symbol: "BNB",
                decimals: 18,
              },
              rpcUrls: ["https://data-seed-prebsc-1-s1.binance.org:8545/"],
              blockExplorerUrls: ["https://testnet.bscscan.com/"],
            },
          ],
        });
        // Essayer de basculer à nouveau après avoir ajouté le réseau
        return await switchToBSCTestnet();
      } catch (addError) {
        console.error("Erreur lors de l'ajout du réseau BSC Testnet:", addError);
        setStatus("❌ Impossible d'ajouter le réseau BSC Testnet.");
        return false;
      }
    } else {
      console.error("Erreur lors du basculement vers BSC Testnet:", error);
      setStatus("❌ Réseau BSC Testnet non détecté.");
      return false;
    }
  }
};

// Connexion à MetaMask avec vérification du réseau
const handleConnect = async () => {
  if (!window.ethereum) {
    setStatus("❌ Veuillez installer MetaMask.");
    return;
  }

  try {
    // Basculer vers le réseau BSC Testnet
    const isBSCTestnet = await switchToBSCTestnet();
    if (!isBSCTestnet) {
      return;
    }

    // Demander l'accès au compte MetaMask
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    const account = accounts[0]; // Récupérer le premier compte connecté
    setPublicKey(account);
    
    // Utiliser le provider de MetaMask directement
    const provider = new ethers.providers.Web3Provider(window.ethereum);

    // Récupérer le solde BNB
    const balanceWei = await provider.getBalance(account);
    const balanceInBNB = ethers.utils.formatEther(balanceWei);
    setBalance(balanceInBNB);
    
    // Définir l'état connecté APRÈS avoir obtenu toutes les informations
    setIsConnected(true);
    setStatus("✅ Wallet connecté avec succès !");
  } catch (error) {
    console.error("Erreur lors de la connexion à MetaMask:", error);
    if (error.code === 4001) {
      setStatus("❌ Connexion refusée par l'utilisateur.");
    } else {
      setStatus(`❌ Erreur lors de la connexion: ${error.message}`);
    }
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