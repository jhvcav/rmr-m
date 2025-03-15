/**
 * Copyright (c) 2025 Jean Hugues CAVALIE
 * Tous droits réservés.
 * Ce code ne peut pas être utilisé ou redistribué sans autorisation.
 */

import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import * as ethers from "ethers"; 
import "./DepotForm.css";

const DepotForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Style de décalage vers la droite - ajustez la valeur selon vos besoins
  const offsetStyle = {
    position: 'relative',
    left: '1200px'
  };
  
  // Paramètres récupérés de LPFarming
  const [montantInvesti, setMontantInvesti] = useState("");
  const [dureeInvestissement, setDureeInvestissement] = useState("");
  const [rendementEstime, setRendementEstime] = useState(0);
  const [frais, setFrais] = useState(0);
  const [adressePool, setAdressePool] = useState("");
  
  // Paramètres MetaMask
  const [isConnected, setIsConnected] = useState(false);
  const [publicKey, setPublicKey] = useState(null);
  const [balance, setBalance] = useState(null);
  const [status, setStatus] = useState("");
  
  // Récupération des paramètres passés via la navigation
  useEffect(() => {
    if (location.state) {
      const { montant, adressePool, duree, rendementEstime, frais } = location.state;
      
      if (montant) setMontantInvesti(montant);
      if (adressePool) setAdressePool(adressePool);
      if (duree) setDureeInvestissement(duree);
      if (rendementEstime) setRendementEstime(rendementEstime);
      if (frais) setFrais(frais);
    }
  }, [location]);

  // Fonction pour créer un provider compatible avec plusieurs versions d'ethers
  const getProvider = () => {
    if (!window.ethereum) return null;
    
    // Pour ethers v5
    if (ethers.providers && ethers.providers.Web3Provider) {
      return new ethers.providers.Web3Provider(window.ethereum);
    }
    
    // Pour ethers v6
    if (ethers.BrowserProvider) {
      return new ethers.BrowserProvider(window.ethereum);
    }
    
    throw new Error("Version d'ethers non supportée");
  };

  // Vérifier si MetaMask est installé et configurer les écouteurs d'événements
  useEffect(() => {
    if (window.ethereum) {
      console.log("MetaMask détecté !");
      console.log("Version ethers:", ethers.version);
      
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
      const provider = getProvider();
      if (!provider) {
        console.error("Impossible d'initialiser le provider");
        return;
      }
      
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
      
      // Utiliser le provider avec la fonction getProvider
      const provider = getProvider();
      if (!provider) {
        setStatus("❌ Erreur d'initialisation du provider ethers");
        return;
      }
      
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

    if (!adressePool) {
      setStatus("⚠️ Adresse du pool non spécifiée.");
      return;
    }

    if (montantInvesti <= 0 || isNaN(montantInvesti)) {
      setStatus("⚠️ Montant invalide.");
      return;
    }

    try {
      setStatus("⏳ Préparation de la transaction...");
      
      // Utiliser le provider avec la fonction getProvider
      const provider = getProvider();
      if (!provider) {
        setStatus("❌ Erreur d'initialisation du provider ethers");
        return;
      }
      
      // Vérifier que nous sommes toujours sur le bon réseau
      const network = await provider.getNetwork();
      if (network.chainId !== 97) { // 97 est l'ID décimal pour BSC Testnet
        setStatus("❌ Veuillez vous connecter au réseau BSC Testnet.");
        return;
      }
      
      const signer = provider.getSigner();

      // Vérifier que nous avons assez de fonds
      const currentBalance = await provider.getBalance(publicKey);
      const amountWei = ethers.utils.parseEther(montantInvesti.toString());
      
      if (currentBalance.lt(amountWei)) {
        setStatus("❌ Solde insuffisant pour cette transaction.");
        return;
      }

      setStatus("⏳ Envoi de la transaction...");
      
      const tx = {
        to: adressePool,
        value: amountWei,
      };

      const txResponse = await signer.sendTransaction(tx);
      setStatus(`✅ Transaction envoyée ! ID : ${txResponse.hash}`);

      // Attendre que la transaction soit confirmée
      await txResponse.wait(1); // Attendre 1 confirmation
      
      // Rafraîchir le solde après la transaction
      updateBalance(publicKey);
      
      // Navigation vers une page de confirmation après transaction réussie
      navigate("/rmr-m/confirmation-depot", {
        state: {
          transactionId: txResponse.hash,
          montant: montantInvesti,
          adressePool: adressePool,
          duree: dureeInvestissement
        }
      });
    } catch (error) {
      console.error("❌ Erreur lors du dépôt de fonds :", error);
      setStatus(`❌ Erreur lors de la transaction: ${error.message}`);
    }
  };

  // Fonction pour formater une adresse blockchain (afficher uniquement début et fin)
  const formatAdresse = (adresse) => {
    if (!adresse || adresse.length < 10) return adresse;
    return `${adresse.substring(0, 6)}...${adresse.substring(adresse.length - 4)}`;
  };

  return (
    <div className="depot-form" style={offsetStyle}>
      <h1 style={{ fontSize: "1.5em" }}>💰 Dépôt de fonds pour LPFarming</h1>

      {/* Récapitulatif de l'investissement */}
      <div className="investment-summary">
        <h2>📋 Récapitulatif de votre investissement</h2>
        <div className="summary-item">
          <span>💵 Montant à investir:</span>
          <span>{montantInvesti} USDT</span>
        </div>
        <div className="summary-item">
          <span>⏱️ Durée d'investissement:</span>
          <span>{dureeInvestissement} jours</span>
        </div>
        <div className="summary-item">
          <span>📈 Rendement estimé:</span>
          <span>{rendementEstime.toFixed(2)} USDT</span>
        </div>
        <div className="summary-item">
          <span>💸 Frais de gestion:</span>
          <span>{frais.toFixed(2)} USDT</span>
        </div>
        <div className="summary-item">
          <span>🔗 Adresse du pool:</span>
          <span title={adressePool}>{formatAdresse(adressePool)}</span>
        </div>
      </div>

      {/* Vérification de la connexion au Wallet */}
      <div className="wallet-status">
        <h2>👛 Statut du wallet</h2>
        {isConnected ? (
          <>
            <p>✅ Connecté avec l'adresse :</p>
            <p className="wallet-address">{publicKey}</p>
            <p>💰 Solde disponible : <strong>{balance} BNB</strong></p>
          </>
        ) : (
          <p>⚠️ Non connecté. Veuillez connecter votre wallet pour continuer.</p>
        )}
        <button className="connect-btn" onClick={handleConnect} disabled={isConnected}>
          {isConnected ? "✅ Déjà connecté" : "🔗 Se connecter à MetaMask"}
        </button>
      </div>

      {/* Montant converti en BNB (si nécessaire) */}
      <div className="input-container">
        <label>💸 Montant à déposer :</label>
        <input
          type="number"
          value={montantInvesti}
          onChange={(e) => setMontantInvesti(parseFloat(e.target.value))}
          min="0.0001"
          step="0.0001"
        />
        <small>Ce montant sera converti en BNB lors de la transaction</small>
      </div>

      {/* Bouton d'envoi */}
      <button 
        className="deposit-btn" 
        onClick={handleDepot} 
        disabled={!isConnected}
      >
        🚀 Confirmer le dépôt de {montantInvesti} USDT
      </button>

      {/* Actions supplémentaires */}
      <div className="form-actions">
        <button 
          type="button" 
          className="btn-retour" 
          onClick={() => navigate(-1)}
        >
          ↩️ Retour
        </button>
      </div>

      {/* Message de statut */}
      {status && <p className="status">{status}</p>}
      
      {/* Informations de sécurité */}
      <div className="security-info">
        <h3>🔒 Sécurité de votre investissement</h3>
        <p>
          Votre dépôt sera sécurisé par contrat intelligent et vous pourrez suivre 
          son évolution en temps réel depuis votre tableau de bord. Les rendements 
          sont calculés quotidiennement et peuvent être réclamés à l'échéance ou 
          réinvestis selon votre choix.
        </p>
      </div>
    </div>
  );
};

export default DepotForm;