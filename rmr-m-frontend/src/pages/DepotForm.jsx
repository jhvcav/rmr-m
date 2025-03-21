/**
 * Copyright (c) 2025 Jean Hugues CAVALIE
 * Tous droits réservés.
 * Ce code ne peut pas être utilisé ou redistribué sans autorisation.
 */

import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import * as ethers from "ethers"; 
import "./DepotForm.css";
import "./ResponsiveStyles.css"; // Import des styles responsifs

// ABI minimal pour un contrat ERC-20
const ERC20_ABI = [
  // Récupérer le solde
  "function balanceOf(address owner) view returns (uint256)",
  // Récupérer le nombre de décimales
  "function decimals() view returns (uint8)",
  // Récupérer le symbole
  "function symbol() view returns (string)",
  // Approuver un montant pour un spender
  "function approve(address spender, uint256 amount) returns (bool)",
  // Vérifier l'allocation
  "function allowance(address owner, address spender) view returns (uint256)",
  // Transférer des tokens
  "function transfer(address to, uint256 amount) returns (bool)"
];

// Adresse du contrat USDC sur BSC Mainnet
const USDC_CONTRACT_ADDRESS = "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d"; // Adresse réelle de l'USDC sur BSC Mainnet

const DepotForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Paramètres récupérés de LPFarming
  const [montantInvesti, setMontantInvesti] = useState("");
  const [dureeInvestissement, setDureeInvestissement] = useState("");
  const [rendementEstime, setRendementEstime] = useState(0);
  const [frais, setFrais] = useState(0);
  const [adressePool, setAdressePool] = useState("");
  
  // Paramètres MetaMask
  const [isConnected, setIsConnected] = useState(false);
  const [publicKey, setPublicKey] = useState(null);
  const [balanceBNB, setBalanceBNB] = useState(null);
  const [balanceUSDC, setBalanceUSDC] = useState(null);
  const [usdcDecimals, setUsdcDecimals] = useState(18); // Par défaut 18, sera mis à jour
  const [usdcSymbol, setUsdcSymbol] = useState("USDC");
  const [status, setStatus] = useState("");
  const [statusHistory, setStatusHistory] = useState([]);
  const [usdcApproved, setUsdcApproved] = useState(false);
  
  // Fonction pour ajouter un message de statut avec historique
  const addStatus = (message) => {
    setStatus(message);
    setStatusHistory(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };
  
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
          updateBalances(accounts[0]);
        } else {
          setIsConnected(false);
          setPublicKey(null);
          setBalanceBNB(null);
          setBalanceUSDC(null);
          addStatus("⚠️ Déconnecté de MetaMask.");
        }
      });
      
      // Écouter les changements de réseau
      window.ethereum.on('chainChanged', (chainId) => {
        if (chainId !== "0x38") { // BSC Mainnet
          setIsConnected(false);
          addStatus("⚠️ Veuillez vous connecter au réseau BSC Mainnet.");
        } else {
          // Si on a déjà une adresse, mettre à jour le solde
          if (publicKey) {
            updateBalances(publicKey);
          }
        }
      });
    } else {
      addStatus("❌ Veuillez installer MetaMask.");
    }
    
    // Nettoyer les écouteurs lors du démontage du composant
    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, [publicKey]); // Dépendance à publicKey pour la mise à jour correcte

  // Fonction pour mettre à jour les soldes BNB et USDC
  const updateBalances = async (address) => {
    try {
      const provider = getProvider();
      if (!provider) {
        console.error("Impossible d'initialiser le provider");
        return;
      }
      
      // Récupérer le solde BNB
      const balanceWei = await provider.getBalance(address);
      const balanceInBNB = ethers.utils.formatEther(balanceWei);
      setBalanceBNB(balanceInBNB);
      
      // Récupérer le solde USDC
      const usdcContract = new ethers.Contract(USDC_CONTRACT_ADDRESS, ERC20_ABI, provider);
      
      // Récupérer le symbole
      try {
        const symbol = await usdcContract.symbol();
        setUsdcSymbol(symbol);
      } catch (error) {
        console.error("Erreur lors de la récupération du symbole:", error);
        // Garder le symbole par défaut (USDC)
      }
      
      // Récupérer le nombre de décimales
      try {
        const decimals = await usdcContract.decimals();
        setUsdcDecimals(decimals);
        console.log(`${usdcSymbol} a ${decimals} décimales`);
      } catch (error) {
        console.error("Erreur lors de la récupération des décimales:", error);
        // Utiliser la valeur par défaut (18)
      }
      
      // Récupérer le solde USDC
      const usdcBalance = await usdcContract.balanceOf(address);
      const formattedUsdcBalance = ethers.utils.formatUnits(usdcBalance, usdcDecimals);
      setBalanceUSDC(formattedUsdcBalance);
      
      // Vérifier si l'utilisateur a déjà approuvé le contrat
      if (adressePool) {
        const allowance = await usdcContract.allowance(address, adressePool);
        const formattedAllowance = ethers.utils.formatUnits(allowance, usdcDecimals);
        setUsdcApproved(parseFloat(formattedAllowance) >= parseFloat(montantInvesti || "0"));
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour des soldes:", error);
    }
  };

  // Basculer vers le réseau BSC Mainnet si nécessaire
  const switchToBSCMainnet = async () => {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x38" }], // Chaîne BSC Mainnet (56 en décimal)
      });
      console.log("Connecté au réseau Binance Smart Chain Mainnet.");
      return true;
    } catch (error) {
      // Si l'erreur est 4902, cela signifie que le réseau n'est pas ajouté
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0x38",
                chainName: "Binance Smart Chain",
                nativeCurrency: {
                  name: "BNB",
                  symbol: "BNB",
                  decimals: 18,
                },
                rpcUrls: ["https://bsc-dataseed.binance.org/"],
                blockExplorerUrls: ["https://bscscan.com/"],
              },
            ],
          });
          // Essayer de basculer à nouveau après avoir ajouté le réseau
          return await switchToBSCMainnet();
        } catch (addError) {
          console.error("Erreur lors de l'ajout du réseau BSC Mainnet:", addError);
          addStatus("❌ Impossible d'ajouter le réseau BSC Mainnet.");
          return false;
        }
      } else {
        console.error("Erreur lors du basculement vers BSC Mainnet:", error);
        addStatus("❌ Réseau BSC Mainnet non détecté.");
        return false;
      }
    }
  };

  // Connexion à MetaMask avec vérification du réseau
  const handleConnect = async () => {
    if (!window.ethereum) {
      addStatus("❌ Veuillez installer MetaMask.");
      return;
    }

    try {
      addStatus("⏳ Tentative de connexion au réseau BSC Mainnet...");
      
      // Basculer vers le réseau BSC Mainnet
      const isBSCMainnet = await switchToBSCMainnet();
      if (!isBSCMainnet) {
        return; // Le message d'erreur est déjà défini dans switchToBSCMainnet
      }

      addStatus("⏳ Connexion au wallet...");
      
      // Demander l'accès au compte MetaMask
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      if (accounts.length === 0) {
        addStatus("❌ Aucun compte détecté.");
        return;
      }
      
      const account = accounts[0];
      setPublicKey(account);
      
      // Utiliser le provider avec la fonction getProvider
      const provider = getProvider();
      if (!provider) {
        addStatus("❌ Erreur d'initialisation du provider ethers");
        return;
      }
      
      // Vérifier que nous sommes toujours sur le bon réseau
      const network = await provider.getNetwork();
      if (network.chainId !== 56) { // 56 est l'ID décimal pour BSC Mainnet
        addStatus("❌ Veuillez vous connecter au réseau BSC Mainnet.");
        return;
      }

      // Mettre à jour les soldes
      await updateBalances(account);
      
      // Définir l'état connecté APRÈS avoir obtenu toutes les informations
      setIsConnected(true);
      addStatus("✅ Wallet connecté avec succès !");
    } catch (error) {
      console.error("Erreur lors de la connexion à MetaMask:", error);
      if (error.code === 4001) {
        addStatus("❌ Connexion refusée par l'utilisateur.");
      } else {
        addStatus(`❌ Erreur lors de la connexion: ${error.message}`);
      }
      setIsConnected(false);
    }
  };

  // Fonction pour approuver l'utilisation des USDC
  const handleApproveUSDC = async () => {
    if (!isConnected) {
      addStatus("⚠️ Veuillez vous connecter à MetaMask.");
      return;
    }

    if (!adressePool) {
      addStatus("⚠️ Adresse du pool non spécifiée.");
      return;
    }

    if (montantInvesti <= 0 || isNaN(montantInvesti)) {
      addStatus("⚠️ Montant invalide.");
      return;
    }

    try {
      addStatus("⏳ Préparation de l'approbation USDC...");
      
      // Utiliser le provider avec la fonction getProvider
      const provider = getProvider();
      if (!provider) {
        addStatus("❌ Erreur d'initialisation du provider ethers");
        return;
      }
      
      const signer = provider.getSigner();
      const usdcContract = new ethers.Contract(USDC_CONTRACT_ADDRESS, ERC20_ABI, signer);
      
      // Convertir le montant en unités avec les décimales correctes
      const amountToApprove = ethers.utils.parseUnits(montantInvesti.toString(), usdcDecimals);
      
      addStatus("⏳ Demande d'approbation USDC...");
      const txApprove = await usdcContract.approve(adressePool, amountToApprove);
      
      addStatus(`⏳ Approbation USDC en cours... ID : ${txApprove.hash}`);
      
      // Attendre la confirmation
      await txApprove.wait(1);
      
      addStatus("✅ Approbation USDC réussie !");
      setUsdcApproved(true);
      
      // Rafraîchir les soldes
      updateBalances(publicKey);
    } catch (error) {
      console.error("Erreur lors de l'approbation USDC:", error);
      addStatus(`❌ Erreur d'approbation: ${error.message}`);
    }
  };

  // Fonction pour effectuer un dépôt
  const handleDepot = async () => {
    if (!isConnected) {
      addStatus("⚠️ Veuillez vous connecter à MetaMask.");
      return;
    }

    if (!adressePool) {
      addStatus("⚠️ Adresse du pool non spécifiée.");
      return;
    }

    if (montantInvesti <= 0 || isNaN(montantInvesti)) {
      addStatus("⚠️ Montant invalide.");
      return;
    }

    // Vérifier si l'utilisateur a approuvé assez d'USDC
    if (!usdcApproved) {
      addStatus("⚠️ Veuillez d'abord approuver l'utilisation des USDC.");
      return;
    }

    try {
      addStatus("⏳ Préparation de la transaction...");
      
      // Utiliser le provider avec la fonction getProvider
      const provider = getProvider();
      if (!provider) {
        addStatus("❌ Erreur d'initialisation du provider ethers");
        return;
      }
      
      // Vérifier que nous sommes toujours sur le bon réseau
      const network = await provider.getNetwork();
      addStatus(`⏳ Réseau détecté: chainId=${network.chainId}`);
      
      if (network.chainId !== 56) { // 56 est l'ID décimal pour BSC Mainnet
        addStatus("❌ Veuillez vous connecter au réseau BSC Mainnet.");
        return;
      }
      
      // Vérifier que nous avons assez d'USDC
      addStatus("⏳ Vérification du solde USDC...");
      const signer = provider.getSigner();
      const usdcContract = new ethers.Contract(USDC_CONTRACT_ADDRESS, ERC20_ABI, signer);
      
      const usdcBalance = await usdcContract.balanceOf(publicKey);
      const amountInDecimals = ethers.utils.parseUnits(montantInvesti.toString(), usdcDecimals);
      
      addStatus(`⏳ Solde USDC: ${ethers.utils.formatUnits(usdcBalance, usdcDecimals)} ${usdcSymbol}`);
      addStatus(`⏳ Montant à déposer: ${ethers.utils.formatUnits(amountInDecimals, usdcDecimals)} ${usdcSymbol}`);
      
      if (usdcBalance.lt(amountInDecimals)) {
        addStatus(`❌ Solde USDC insuffisant.`);
        return;
      }

      // Définition de l'ABI minimal pour le contrat LPFarming
      const LPFARMING_ABI = [
        "function deposit(uint256 amount, uint256 period) external returns (bool)"
      ];
      
      // Création d'une instance du contrat LPFarming
      const lpFarmingContract = new ethers.Contract(adressePool, LPFARMING_ABI, signer);
      
      addStatus(`⏳ Dépôt de ${montantInvesti} ${usdcSymbol} pour une période de ${dureeInvestissement} jours...`);
      
      // Convertir la durée d'investissement en nombre (au cas où c'est une chaîne)
      const periodInDays = parseInt(dureeInvestissement);
      
      // Avant de déposer, nous devons approuver le contrat LPFarming à utiliser nos USDC
      addStatus("⏳ Approbation du contrat LPFarming pour utiliser vos USDC...");
      const txApprove = await usdcContract.approve(adressePool, amountInDecimals);
      await txApprove.wait(1);
      
      // Maintenant, appeler la fonction deposit du contrat LPFarming
      addStatus("⏳ Envoi de la transaction de dépôt...");
      const txDeposit = await lpFarmingContract.deposit(amountInDecimals, periodInDays);
      
      addStatus(`✅ Transaction de dépôt envoyée ! ID : ${txDeposit.hash}`);

      // Attendre que la transaction soit confirmée
      addStatus(`⏳ Attente de confirmation de la transaction...`);
      await txDeposit.wait(1); // Attendre 1 confirmation
      
      // Rafraîchir les soldes après la transaction
      addStatus(`⏳ Mise à jour des soldes...`);
      updateBalances(publicKey);
      
      // Navigation vers une page de confirmation après transaction réussie
      addStatus(`✅ Transaction confirmée, redirection vers la page de confirmation...`);
      navigate("/rmr-m/confirmation-depot", {
        state: {
          transactionId: txDeposit.hash,
          montant: montantInvesti,
          adressePool: adressePool,
          duree: dureeInvestissement
        }
      });
    } catch (error) {
      console.error("❌ Erreur lors du dépôt:", error);
      if (error.code) {
        addStatus(`❌ Erreur: Code ${error.code}`);
      } else if (error.reason) {
        addStatus(`❌ Erreur: ${error.reason}`);
      } else {
        addStatus(`❌ Erreur: ${error.message}`);
      }
    }
};

  // Fonction pour formater une adresse blockchain (afficher uniquement début et fin)
  const formatAdresse = (adresse) => {
    if (!adresse || adresse.length < 10) return adresse;
    return `${adresse.substring(0, 6)}...${adresse.substring(adresse.length - 4)}`;
  };

  return (
    <div className="depot-form responsive-container">
      <h1 style={{ fontSize: "1.5em" }}>💰 Dépôt de fonds pour LPFarming</h1>

      {/* Avertissement pour Mainnet */}
      <div className="mainnet-warning responsive-card" style={{ marginTop: '20px', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '5px', border: '1px solid #ffeeba' }}>
        <h3>⚠️ Mode Production - Vraies Cryptomonnaies</h3>
        <p>
          <strong>ATTENTION:</strong> Cette application utilise le réseau principal Binance Smart Chain. 
          Toutes les transactions impliquent de vraies cryptomonnaies ayant une valeur réelle.
        </p>
        <p>
          Nous vous recommandons de:
        </p>
        <ul>
          <li>Commencer avec de petits montants pour tester</li>
          <li>Vérifier toutes les informations de transaction avant confirmation</li>
          <li>Ne jamais investir plus que ce que vous pouvez vous permettre de perdre</li>
        </ul>
      </div>

      {/* Récapitulatif de l'investissement */}
      <div className="investment-summary responsive-card">
        <h2>📋 Récapitulatif de votre investissement</h2>
        <div className="summary-item">
          <span>💵 Montant à investir:</span>
          <span>{montantInvesti} {usdcSymbol}</span>
        </div>
        <div className="summary-item">
          <span>⏱️ Durée d'investissement:</span>
          <span>{dureeInvestissement} jours</span>
        </div>
        <div className="summary-item">
          <span>📈 Rendement estimé:</span>
          <span>{rendementEstime.toFixed(2)} {usdcSymbol}</span>
        </div>
        <div className="summary-item">
          <span>💸 Frais de gestion:</span>
          <span>{frais.toFixed(2)} {usdcSymbol}</span>
        </div>
        <div className="summary-item">
          <span>🔗 Adresse du pool:</span>
          <span title={adressePool}>{formatAdresse(adressePool)}</span>
        </div>
      </div>

      {/* Vérification de la connexion au Wallet */}
      <div className="wallet-status responsive-card">
        <h2>👛 Statut du wallet</h2>
        {isConnected ? (
          <>
            <p>✅ Connecté avec l'adresse :</p>
            <p className="wallet-address">{publicKey}</p>
            <p>💰 Solde disponible : <strong>{balanceUSDC} {usdcSymbol}</strong></p>
            <p>🔄 Solde BNB (pour frais) : <strong>{balanceBNB} BNB</strong></p>
          </>
        ) : (
          <p>⚠️ Non connecté. Veuillez connecter votre wallet pour continuer.</p>
        )}
        <button className="connect-btn responsive-button" onClick={handleConnect} disabled={isConnected}>
          {isConnected ? "✅ Déjà connecté" : "🔗 Se connecter à MetaMask"}
        </button>
      </div>

      {/* Montant à déposer */}
      <div className="input-container responsive-form">
        <label>💸 Montant à déposer ({usdcSymbol}) :</label>
        <input
          type="number"
          value={montantInvesti}
          onChange={(e) => {
            const newValue = parseFloat(e.target.value);
            setMontantInvesti(newValue);
            // Réinitialiser l'approbation si le montant change
            if (newValue !== montantInvesti) {
              setUsdcApproved(false);
            }
          }}
          min="0.1"
          step="0.1"
          className="responsive-form"
        />
        <small>Le montant minimum recommandé est de 1 {usdcSymbol}</small>
      </div>

      {/* Boutons d'approbation et d'envoi */}
      <div className="buttons-container">
        {isConnected && !usdcApproved && (
          <button 
            className="approve-btn responsive-button" 
            onClick={handleApproveUSDC}
            disabled={!isConnected || usdcApproved}
          >
            🔓 Approuver l'utilisation de {montantInvesti} {usdcSymbol}
          </button>
        )}
        
        <button 
          className="deposit-btn responsive-button" 
          onClick={handleDepot} 
          disabled={!isConnected || !usdcApproved}
        >
          🚀 Confirmer le dépôt de {montantInvesti} {usdcSymbol}
        </button>
      </div>

      {/* Actions supplémentaires */}
      <div className="form-actions">
        <button 
          type="button" 
          className="btn-retour responsive-button" 
          onClick={() => navigate(-1)}
        >
          ↩️ Retour
        </button>
      </div>

      {/* Message de statut */}
      {status && <p className="status">{status}</p>}
      
      {/* Historique des messages de statut */}
      {statusHistory.length > 0 && (
        <div className="status-history responsive-card" style={{ marginTop: '20px', maxHeight: '200px', overflowY: 'auto' }}>
          <h3>📝 Historique des opérations</h3>
          <ul style={{ padding: '0 0 0 20px', margin: 0 }}>
            {statusHistory.map((msg, idx) => (
              <li key={idx} style={{ marginBottom: '5px' }}>{msg}</li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Informations sur les USDC */}
      <div className="usdc-info responsive-card" style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
        <h3>ℹ️ Informations sur les {usdcSymbol}</h3>
        <p>
          Les {usdcSymbol} (USD Coin) sont des stablecoins dont la valeur est indexée sur le dollar américain (1 {usdcSymbol} = 1 USD).
          Pour pouvoir effectuer un dépôt, vous devez :
        </p>
        <ol>
          <li>Avoir suffisamment d'{usdcSymbol} dans votre portefeuille</li>
          <li>Avoir un peu de BNB (0.005 minimum) pour payer les frais de transaction</li>
          <li>Approuver l'utilisation de vos {usdcSymbol} par le contrat de pool</li>
        </ol>
      </div>
      
      {/* Informations de sécurité */}
      <div className="security-info responsive-card">
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