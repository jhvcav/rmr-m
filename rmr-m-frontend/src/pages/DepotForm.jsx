import React, { useState, useEffect } from "react";
import * as ethers from "ethers";
import "./DepotForm.css";

const DepotForm = () => {
  const [amount, setAmount] = useState(0.05);
  const [destinationAddress, setDestinationAddress] = useState("");
  const [status, setStatus] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [publicKey, setPublicKey] = useState(null);
  const [balance, setBalance] = useState(null);

  // Vérifier si MetaMask est installé et configurer les écouteurs d'événements
  useEffect(() => {
    if (window.ethereum) {
      console.log("MetaMask détecté !");
      
      // Écouter les changements de compte
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setPublicKey(accounts[0]);
          updateBalance(accounts[0]);
        } else {
          setIsConnected(false);
          setPublicKey(null);
          setBalance(null);
          setStatus("⚠️ Déconnecté de MetaMask.");
        }
      });
      
      // Écouter les changements de réseau
      window.ethereum.on('chainChanged', (chainId) => {
        if (chainId !== "0x61") { // BSC Testnet
          setIsConnected(false);
          setStatus("⚠️ Veuillez vous connecter au réseau BSC Testnet.");
        } else {
          // Si on a déjà une adresse, mettre à jour le solde
          if (publicKey) {
            updateBalance(publicKey);
          }
        }
      });
    } else {
      setStatus("❌ Veuillez installer MetaMask.");
    }
    
    // Nettoyer les écouteurs lors du démontage du composant
    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, [publicKey]); // Dépendance à publicKey pour la mise à jour correcte

  // Fonction pour mettre à jour le solde
  const updateBalance = async (address) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const balanceWei = await provider.getBalance(address);
      const balanceInBNB = ethers.utils.formatEther(balanceWei);
      setBalance(balanceInBNB);
    } catch (error) {
      console.error("Erreur lors de la mise à jour du solde:", error);
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
      setStatus("⏳ Tentative de connexion au réseau BSC Testnet...");
      
      // Basculer vers le réseau BSC Testnet
      const isBSCTestnet = await switchToBSCTestnet();
      if (!isBSCTestnet) {
        return; // Le message d'erreur est déjà défini dans switchToBSCTestnet
      }

      setStatus("⏳ Connexion au wallet...");
      
      // Demander l'accès au compte MetaMask
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      if (accounts.length === 0) {
        setStatus("❌ Aucun compte détecté.");
        return;
      }
      
      const account = accounts[0];
      setPublicKey(account);
      
      // Utiliser le provider de MetaMask directement
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      
      // Vérifier que nous sommes toujours sur le bon réseau
      const network = await provider.getNetwork();
      if (network.chainId !== 97) { // 97 est l'ID décimal pour BSC Testnet
        setStatus("❌ Veuillez vous connecter au réseau BSC Testnet.");
        return;
      }

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
      setIsConnected(false);
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
      setStatus("⏳ Préparation de la transaction...");
      
      // Utiliser le provider de MetaMask
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      
      // Vérifier que nous sommes toujours sur le bon réseau
      const network = await provider.getNetwork();
      if (network.chainId !== 97) { // 97 est l'ID décimal pour BSC Testnet
        setStatus("❌ Veuillez vous connecter au réseau BSC Testnet.");
        return;
      }
      
      const signer = provider.getSigner();

      // Vérifier que nous avons assez de fonds
      const currentBalance = await provider.getBalance(publicKey);
      const amountWei = ethers.utils.parseEther(amount.toString());
      
      if (currentBalance.lt(amountWei)) {
        setStatus("❌ Solde insuffisant pour cette transaction.");
        return;
      }

      setStatus("⏳ Envoi de la transaction...");
      
      const tx = {
        to: destinationAddress,
        value: amountWei,
      };

      const txResponse = await signer.sendTransaction(tx);
      setStatus(`✅ Transaction envoyée ! ID : ${txResponse.hash}`);

      // Attendre que la transaction soit confirmée
      await txResponse.wait(1); // Attendre 1 confirmation
      
      // Rafraîchir le solde après la transaction
      updateBalance(publicKey);
    } catch (error) {
      console.error("❌ Erreur lors du dépôt de fonds :", error);
      setStatus(`❌ Erreur lors de la transaction: ${error.message}`);
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
          onChange={(e) => setAmount(parseFloat(e.target.value))}
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