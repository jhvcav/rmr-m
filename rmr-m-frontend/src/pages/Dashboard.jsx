/**
 * Copyright (c) 2025 Jean Hugues CAVALIE
 * Tous droits réservés.
 * Ce code ne peut pas être utilisé ou redistribué sans autorisation.
 */

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import * as ethers from "ethers";
import "./Dashboard.css";
import "./ResponsiveStyles.css"; // Import des styles responsifs

// ABI minimal pour un contrat ERC-20
const ERC20_ABI = [
  // Récupérer le solde
  "function balanceOf(address owner) view returns (uint256)",
  // Récupérer le nombre de décimales
  "function decimals() view returns (uint8)",
  // Récupérer le symbole
  "function symbol() view returns (string)",
];

// ABI pour le contrat LPFarming
const LPFARMING_ABI = [
  // Récupérer les investissements d'un utilisateur
  "function getUserInvestments(address user) view returns (uint256[] memory ids, uint256[] memory amounts, uint256[] memory startTimes, uint256[] memory endTimes, uint256[] memory periods, uint256[] memory aprs, bool[] memory activeStatus)",
  // Récupérer le solde de l'utilisateur
  "function getUserBalance(address user) view returns (uint256 totalInvested, uint256 pendingRewards, uint256 totalEarned, uint256 activeInvestments)",
  // Récupérer le rendement quotidien
  "function getDailyYield(address user) view returns (uint256)",
  // Réclamer les récompenses
  "function claimRewards() external",
  // Réinvestir les récompenses
  "function reinvestRewards(uint256 period) external",
  // Retirer le capital
  "function withdrawCapital(uint256 investmentId) external"
];

// Adresse du contrat USDC sur BSC Mainnet
const USDC_CONTRACT_ADDRESS = "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d"; // Adresse Token USDC sur BSC Mainnet

// Adresse du contrat de pool sur Mainnet
const POOL_CONTRACT_ADDRESS = "0x405412D71847eCb8Fa5a98A1F91B90b1231A93dc"; // Adresse du pool LPFraming

const Dashboard = () => {
  // États pour le wallet et la connexion
  const [isConnected, setIsConnected] = useState(false);
  const [publicKey, setPublicKey] = useState(null);
  const [balanceBNB, setBalanceBNB] = useState(null);
  const [balanceUSDC, setBalanceUSDC] = useState(null);
  const [usdcDecimals, setUsdcDecimals] = useState(18); // Par défaut 18, sera mis à jour
  const [usdcSymbol, setUsdcSymbol] = useState("USDC");
  const [status, setStatus] = useState("");
  const [statusHistory, setStatusHistory] = useState([]);

  // États pour les données d'investissement
  const [totalInvested, setTotalInvested] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [dailyEarnings, setDailyEarnings] = useState(0);
  const [availableForWithdrawal, setAvailableForWithdrawal] = useState(0);
  const [investmentsList, setInvestmentsList] = useState([]);
  const [matureInvestments, setMatureInvestments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasInvestments, setHasInvestments] = useState(true); // Nouvel état pour vérifier si l'utilisateur a des investissements

  // Fonction pour ajouter un message de statut avec historique
  const addStatus = (message) => {
    setStatus(message);
    setStatusHistory(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Fonction pour créer un provider compatible avec plusieurs versions d'ethers
  const getProvider = () => {
    if (!window.ethereum) return null;
    
    // Pour ethers v5
    if (ethers.providers && ethers.providers.Web3Provider) {
      return new ethers.providers.Web3Provider(window.ethereum);
    }
    
    throw new Error("Version d'ethers non supportée");
  };

  // Connexion au wallet et récupération des données
  useEffect(() => {
    const connectWallet = async () => {
      if (!window.ethereum) {
        addStatus("❌ Veuillez installer MetaMask pour accéder au tableau de bord.");
        setIsLoading(false);
        return;
      }

      try {
        // Vérifier et changer le réseau si nécessaire
        try {
          const chainId = await window.ethereum.request({ method: 'eth_chainId' });
          if (chainId !== '0x38') { // 0x38 est l'ID de chaîne pour BSC Mainnet
            addStatus("⏳ Changement vers le réseau BSC Mainnet...");
            try {
              await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x38' }],
              });
            } catch (switchError) {
              // Si le réseau n'est pas configuré, l'ajouter
              if (switchError.code === 4902) {
                await window.ethereum.request({
                  method: 'wallet_addEthereumChain',
                  params: [
                    {
                      chainId: '0x38',
                      chainName: 'Binance Smart Chain',
                      nativeCurrency: {
                        name: 'BNB',
                        symbol: 'BNB',
                        decimals: 18,
                      },
                      rpcUrls: ['https://bsc-dataseed.binance.org/'],
                      blockExplorerUrls: ['https://bscscan.com/'],
                    },
                  ],
                });
              } else {
                throw switchError;
              }
            }
          }
        } catch (networkError) {
          addStatus(`❌ Erreur lors du changement de réseau: ${networkError.message}`);
          setIsLoading(false);
          return;
        }

        // Demander l'accès au compte MetaMask
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        if (accounts.length === 0) {
          addStatus("❌ Aucun compte détecté.");
          setIsLoading(false);
          return;
        }
        
        const account = accounts[0];
        setPublicKey(account);
        addStatus(`✅ Compte connecté: ${account.substring(0, 6)}...${account.substring(account.length - 4)}`);
        
        // Utiliser le provider 
        const provider = getProvider();
        if (!provider) {
          addStatus("❌ Erreur d'initialisation du provider ethers");
          setIsLoading(false);
          return;
        }
        
        // Récupérer les soldes
        await updateBalances(account, provider);
        
        // Définir comme connecté
        setIsConnected(true);
        
        // Charger les données d'investissement
        fetchInvestmentData(account);
        
      } catch (error) {
        console.error("Erreur lors de la connexion au wallet:", error);
        addStatus(`❌ Erreur: ${error.message}`);
        setIsLoading(false);
      }
    };

    // Lancement de la connexion
    connectWallet();

    // Écouter les changements de compte
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', async (accounts) => {
        if (accounts.length > 0) {
          setPublicKey(accounts[0]);
          addStatus(`✅ Compte changé: ${accounts[0].substring(0, 6)}...${accounts[0].substring(accounts[0].length - 4)}`);
          // Utiliser le provider 
          const provider = getProvider();
          if (provider) {
            await updateBalances(accounts[0], provider);
          }
          fetchInvestmentData(accounts[0]);
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
        if (chainId !== '0x38') { // BSC Mainnet
          addStatus("⚠️ Veuillez vous connecter au réseau BSC Mainnet.");
          setIsConnected(false);
        } else {
          addStatus("✅ Connecté au réseau BSC Mainnet.");
          // Recharger les données si nous avons déjà un compte
          if (publicKey) {
            const provider = getProvider();
            if (provider) {
              updateBalances(publicKey, provider);
              fetchInvestmentData(publicKey);
            }
          }
        }
      });
    }
    
    // Nettoyer les écouteurs lors du démontage
    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, []);

  // Fonction pour mettre à jour les soldes BNB et USDC
  const updateBalances = async (address, provider) => {
    try {
      // Récupérer le solde BNB
      const balanceWei = await provider.getBalance(address);
      const balanceInBNB = ethers.utils.formatEther(balanceWei);
      setBalanceBNB(balanceInBNB);
      addStatus(`💰 Solde BNB mis à jour: ${parseFloat(balanceInBNB).toFixed(4)} BNB`);
      
      // Récupérer les informations et le solde USDC
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
      } catch (error) {
        console.error("Erreur lors de la récupération des décimales:", error);
        // Utiliser la valeur par défaut (18)
      }
      
      // Récupérer le solde USDC
      const usdcBalance = await usdcContract.balanceOf(address);
      const formattedUsdcBalance = ethers.utils.formatUnits(usdcBalance, usdcDecimals);
      setBalanceUSDC(formattedUsdcBalance);
      addStatus(`💰 Solde ${usdcSymbol} mis à jour: ${parseFloat(formattedUsdcBalance).toFixed(2)} ${usdcSymbol}`);
      
    } catch (error) {
      console.error("Erreur lors de la mise à jour des soldes:", error);
      addStatus(`❌ Erreur lors de la mise à jour des soldes: ${error.message}`);
    }
  };

  // Fonction pour récupérer les données d'investissement (réelle)
  const fetchInvestmentData = async (address) => {
    setIsLoading(true);
    addStatus("⏳ Récupération des données d'investissement...");
    
    try {
      const provider = getProvider();
      if (!provider) {
        throw new Error("Provider non disponible");
      }
      
      // Créer une instance du contrat LPFarming
      const lpFarmingContract = new ethers.Contract(POOL_CONTRACT_ADDRESS, LPFARMING_ABI, provider);
      
      // Récupérer les investissements de l'utilisateur
      const [ids, amounts, startTimes, endTimes, periods, aprs, activeStatus] = 
        await lpFarmingContract.getUserInvestments(address);
      
      // Récupérer le solde de l'utilisateur
      const [totalInvested, pendingRewards, totalEarned, activeInvestmentsCount] = 
        await lpFarmingContract.getUserBalance(address);
      
      // Récupérer le rendement quotidien
      const dailyYield = await lpFarmingContract.getDailyYield(address);
      
      // Formater les données pour l'affichage
      const investmentsData = [];
      
      for (let i = 0; i < ids.length; i++) {
        investmentsData.push({
          id: ids[i].toString(),
          amount: parseFloat(ethers.utils.formatUnits(amounts[i], usdcDecimals)),
          startDate: new Date(startTimes[i].toNumber() * 1000),
          duration: periods[i].toNumber(),
          endDate: new Date(endTimes[i].toNumber() * 1000),
          apr: aprs[i].toNumber() / 100, // Convertir de points de base en pourcentage
          dailyReturn: (parseFloat(ethers.utils.formatUnits(amounts[i], usdcDecimals)) * aprs[i] / 100) / 365, // Calcul approximatif du rendement quotidien
          totalEarned: 0, // Nous n'avons pas cette information par investissement
          status: activeStatus[i] ? "active" : "matured"
        });
      }
      
      // Vérifier si l'utilisateur a des investissements
      if (investmentsData.length === 0) {
        setHasInvestments(false);
        setInvestmentsList([]);
        setTotalInvested(0);
        setTotalEarnings(0);
        setDailyEarnings(0);
        setAvailableForWithdrawal(0);
        setMatureInvestments([]);
        addStatus("📊 Aucun investissement actif trouvé");
      } else {
        // Mettre à jour les états avec les données réelles
        setHasInvestments(true);
        investmentsData.forEach(investment => {
          // Recalculer le rendement quotidien avec la formule correcte
          investment.dailyReturn = (investment.amount * investment.apr / 100) / 365;
        });
        setInvestmentsList(investmentsData);
        console.log("Connecté au contrat LPFarming à l'adresse:", POOL_CONTRACT_ADDRESS);
        
        // Formater les montants
        const formattedTotalInvested = parseFloat(ethers.utils.formatUnits(totalInvested, usdcDecimals));
        const formattedPendingRewards = parseFloat(ethers.utils.formatUnits(pendingRewards, usdcDecimals));
        const formattedTotalEarned = parseFloat(ethers.utils.formatUnits(totalEarned, usdcDecimals));
        const formattedDailyYield = parseFloat(ethers.utils.formatUnits(dailyYield, usdcDecimals));
        
        setTotalInvested(formattedTotalInvested);
        setTotalEarnings(formattedTotalEarned);
        setDailyEarnings(formattedDailyYield);
        
        // Définir les montants disponibles pour retrait (récompenses en attente)
        setAvailableForWithdrawal(formattedPendingRewards);
        
        // Identifier les investissements arrivés à maturité
        const mature = investmentsData.filter(inv => inv.status === "matured");
        setMatureInvestments(mature);
        
        addStatus(`📊 ${investmentsData.length} investissements trouvés, total investi: ${formattedTotalInvested.toFixed(2)} ${usdcSymbol}`);
      }
      
      setIsLoading(false);
      
    } catch (error) {
      console.error("Erreur lors de la récupération des données:", error);
      addStatus(`❌ Erreur lors du chargement des données d'investissement: ${error.message}`);
      setIsLoading(false);
      setHasInvestments(false); // En cas d'erreur, on suppose qu'il n'y a pas d'investissement
    }
  };

  // Fonction pour formater les dates
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Fonction pour calculer les jours restants
  const calculateDaysLeft = (endDate) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Fonction pour retirer les gains (réelle)
  const handleWithdrawEarnings = async () => {
    if (availableForWithdrawal <= 0) {
      addStatus(`⚠️ Le minimum pour retirer est de 0.1 ${usdcSymbol}.`);
      return;
    }
    
    addStatus("⏳ Traitement du retrait des gains...");
    
    try {
      const provider = getProvider();
      const signer = provider.getSigner();
      const lpFarmingContract = new ethers.Contract(POOL_CONTRACT_ADDRESS, LPFARMING_ABI, signer);
      
      // Appel au contrat pour réclamer les récompenses
      const tx = await lpFarmingContract.claimRewards();
      addStatus(`✅ Transaction de retrait envoyée ! ID : ${tx.hash}`);
      
      // Attendre la confirmation
      await tx.wait(1);
      
      addStatus(`✅ Retrait de ${availableForWithdrawal.toFixed(2)} ${usdcSymbol} effectué avec succès!`);
      setAvailableForWithdrawal(0);
      
      // Mettre à jour les soldes et les données
      updateBalances(publicKey, provider);
      fetchInvestmentData(publicKey);
    } catch (error) {
      console.error("Erreur lors du retrait des gains:", error);
      addStatus(`❌ Erreur lors du retrait: ${error.message}`);
    }
  };

  // Fonction pour réinvestir les gains (réelle)
  const handleReinvestEarnings = async () => {
    if (availableForWithdrawal <= 0) {
      addStatus("⚠️ Aucun gain disponible à réinvestir.");
      return;
    }
    
    // Demander à l'utilisateur la période pour le réinvestissement
    // Dans une application réelle, cela pourrait être un formulaire ou un modal
    const periodInDays = window.prompt("Entrez la période d'investissement en jours (30, 90 ou 180):", "90");
    if (!periodInDays) return; // L'utilisateur a annulé
    
    // Convertir en nombre
    const period = parseInt(periodInDays);
    
    // Vérifier que la période est valide
    if (![30, 90, 180].includes(period)) {
      addStatus("⚠️ Période invalide. Veuillez choisir 30, 90 ou 180 jours.");
      return;
    }
    
    addStatus("⏳ Réinvestissement des gains en cours...");
    
    try {
      const provider = getProvider();
      const signer = provider.getSigner();
      const lpFarmingContract = new ethers.Contract(POOL_CONTRACT_ADDRESS, LPFARMING_ABI, signer);
      
      // Appel au contrat pour réinvestir les récompenses
      const tx = await lpFarmingContract.reinvestRewards(period);
      addStatus(`✅ Transaction de réinvestissement envoyée ! ID : ${tx.hash}`);
      
      // Attendre la confirmation
      await tx.wait(1);
      
      addStatus(`✅ Réinvestissement pour ${period} jours effectué avec succès!`);
      
      // Mettre à jour les données
      fetchInvestmentData(publicKey);
    } catch (error) {
      console.error("Erreur lors du réinvestissement:", error);
      addStatus(`❌ Erreur lors du réinvestissement: ${error.message}`);
    }
  };

  // Fonction pour retirer les capitaux arrivés à maturité (réelle)
  const handleWithdrawCapital = async () => {
    if (matureInvestments.length === 0) {
      addStatus("⚠️ Aucun investissement arrivé à maturité.");
      return;
    }
    
    // Demander à l'utilisateur de confirmer le retrait
    const confirmWithdraw = window.confirm(`Voulez-vous retirer le capital de ${matureInvestments.length} investissements arrivés à maturité?`);
    if (!confirmWithdraw) return;
    
    // Boucle pour retirer chaque investissement arrivé à maturité
    for (const investment of matureInvestments) {
      addStatus(`⏳ Retrait du capital pour l'investissement ${investment.id} en cours...`);
      
      try {
        const provider = getProvider();
        const signer = provider.getSigner();
        const lpFarmingContract = new ethers.Contract(POOL_CONTRACT_ADDRESS, LPFARMING_ABI, signer);
        
        // Appel au contrat pour retirer le capital
        const tx = await lpFarmingContract.withdrawCapital(investment.id);
        addStatus(`✅ Transaction de retrait envoyée pour l'investissement ${investment.id} ! ID : ${tx.hash}`);
        
        // Attendre la confirmation
        await tx.wait(1);
        
        addStatus(`✅ Capital de l'investissement ${investment.id} retiré avec succès!`);
      } catch (error) {
        console.error(`Erreur lors du retrait du capital pour l'investissement ${investment.id}:`, error);
        addStatus(`❌ Erreur lors du retrait du capital pour l'investissement ${investment.id}: ${error.message}`);
      }
    }
    
    // Mettre à jour les données après tous les retraits
    const provider = getProvider();
    updateBalances(publicKey, provider);
    fetchInvestmentData(publicKey);
  };

  // Contenu du tableau de bord pour un utilisateur sans investissement
  const renderEmptyDashboard = () => {
    return (
      <div className="empty-dashboard">
        <div className="empty-state-icon">💼</div>
        <h2>Vous n'avez pas encore d'investissement actif</h2>
        <p>Commencez votre parcours d'investissement dès aujourd'hui pour générer des revenus passifs.</p>
        
        <div className="dashboard-summary responsive-grid">
          <div className="summary-card responsive-card">
            <h3>💰 Total Investi</h3>
            <p className="summary-value">0.00 {usdcSymbol}</p>
          </div>
          
          <div className="summary-card responsive-card">
            <h3>📈 Gains Cumulés</h3>
            <p className="summary-value">0.00 {usdcSymbol}</p>
          </div>
          
          <div className="summary-card responsive-card">
            <h3>📆 Gains Quotidiens</h3>
            <p className="summary-value">0.00 {usdcSymbol}</p>
          </div>
        </div>
        
        <div className="investment-options">
          <h3>Options d'investissement disponibles</h3>
          <div className="options-grid responsive-grid">
            <div className="option-card responsive-card">
              <h4>📅 Plan 30 jours</h4>
              <p>Taux annuel: 8%</p>
              <p>Idéal pour: Court terme</p>
            </div>
            <div className="option-card responsive-card">
              <h4>📅 Plan 90 jours</h4>
              <p>Taux annuel: 12%</p>
              <p>Idéal pour: Moyen terme</p>
            </div>
            <div className="option-card responsive-card">
              <h4>📅 Plan 180 jours</h4>
              <p>Taux annuel: 15%</p>
              <p>Idéal pour: Long terme</p>
            </div>
          </div>
          
          <Link to="/rmr-m/lpfarming" className="start-investing-btn responsive-button">
            🚀 Commencer à investir maintenant
          </Link>
        </div>
        
        <div className="dashboard-faq">
          <h3>Questions fréquentes</h3>
          <div className="faq-item responsive-card">
            <h4>💡 Comment fonctionne l'investissement LPFarming?</h4>
            <p>Le LPFarming vous permet de gagner des rendements passifs en fournissant des liquidités à des pools spécifiques. Vous recevez une part des frais de transaction générés par ces pools.</p>
          </div>
          <div className="faq-item responsive-card">
            <h4>💡 Quand puis-je retirer mes investissements?</h4>
            <p>Vous pouvez retirer votre capital une fois la période d'investissement terminée. Les gains peuvent être retirés à tout moment une fois qu'ils atteignent 5 {usdcSymbol}.</p>
          </div>
          <div className="faq-item responsive-card">
            <h4>💡 Y a-t-il des frais?</h4>
            <p>Des frais de 2% sont appliqués lors de l'entrée dans un plan d'investissement. Il n'y a pas de frais de sortie lorsque vous retirez votre capital après la période d'investissement.</p>
          </div>
        </div>
      </div>
    );
  };

  // Contenu du tableau de bord pour un utilisateur avec des investissements
  const renderActiveDashboard = () => {
    return (
      <>
        {/* Résumé des investissements */}
        <div className="dashboard-summary responsive-grid">
          <div className="summary-card responsive-card">
            <h3>💰 Total Investi</h3>
            <p className="summary-value">{totalInvested.toFixed(2)} {usdcSymbol}</p>
          </div>
          
          <div className="summary-card responsive-card">
            <h3>📈 Gains Cumulés</h3>
            <p className="summary-value">{totalEarnings.toFixed(2)} {usdcSymbol}</p>
          </div>
          
          <div className="summary-card responsive-card">
            <h3>📆 Gains Quotidiens</h3>
            <p className="summary-value">{dailyEarnings.toFixed(2)} {usdcSymbol}</p>
          </div>
          
          <div className="summary-card responsive-card">
            <h3>💸 Disponible pour Retrait</h3>
            <p className="summary-value">{availableForWithdrawal.toFixed(2)} {usdcSymbol}</p>
          </div>
        </div>
        
        {/* Actions rapides */}
        <div className="dashboard-actions">
          <button 
            className={`action-btn withdraw-btn responsive-button ${availableForWithdrawal <= 0  ? 'disabled' : ''}`}
            onClick={handleWithdrawEarnings} 
            //disabled={availableForWithdrawal < 0}
          >
            🔄 Retirer mes gains
            {availableForWithdrawal > 1 && <span className="btn-note">(min. 1 {usdcSymbol})</span>}
          </button>
          
          <button 
            className={`action-btn reinvest-btn responsive-button ${totalEarnings <= 0 ? 'disabled' : ''}`}
            onClick={handleReinvestEarnings} 
          >
            🔁 Réinvestir mes gains
          </button>
          
          <button 
            className={`action-btn capital-btn responsive-button`}
            onClick={handleWithdrawCapital} 
          >
            💵 Retirer mes capitaux disponibles
          </button>
        </div>
        
        {/* Liste des investissements */}
        <div className="investments-section">
          <h2>📋 Mes Investissements</h2>
          
          <div className="investments-list">
            {investmentsList.map((investment) => (
              <div key={investment.id} className={`investment-card ${investment.status} responsive-card`}>
                <div className="investment-header">
                  <h3>{investment.id}</h3>
                  <span className={`status-badge ${investment.status}`}>
                    {investment.status === "active" ? "Actif" : "Arrivé à maturité"}
                  </span>
                </div>
                
                <div className="investment-details">
                  <div className="detail-item">
                    <span className="detail-label">Montant:</span>
                    <span className="detail-value">{investment.amount.toFixed(2)} {usdcSymbol}</span>
                  </div>
                  
                  <div className="detail-item">
                    <span className="detail-label">Date de début:</span>
                    <span className="detail-value">{formatDate(investment.startDate)}</span>
                  </div>
                  
                  <div className="detail-item">
                    <span className="detail-label">Durée:</span>
                    <span className="detail-value">{investment.duration} jours</span>
                  </div>
                  
                  <div className="detail-item">
                    <span className="detail-label">Date de fin:</span>
                    <span className="detail-value">{formatDate(investment.endDate)}</span>
                  </div>
                  
                  <div className="detail-item">
                    <span className="detail-label">APR:</span>
                    <span className="detail-value">{investment.apr}%</span>
                  </div>
                  
                  <div className="detail-item">
                    <span className="detail-label">Rendement quotidien:</span>
                    <span className="detail-value">{investment.dailyReturn.toFixed(3)} {usdcSymbol}</span>
                  </div>
                  
                  <div className="detail-item">
                    <span className="detail-label">Total gagné:</span>
                    <span className="detail-value">{investment.totalEarned.toFixed(2)} {usdcSymbol}</span>
                  </div>

                  {investment.status === "active" && (
                    <div className="detail-item">
                      <span className="detail-label">Jours restants:</span>
                      <span className="detail-value">{calculateDaysLeft(investment.endDate)} jours</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="add-investment">
            <Link to="/rmr-m/lpfarming" className="add-investment-btn responsive-button">
              ➕ Ajouter un nouvel investissement
            </Link>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="dashboard-container responsive-container">
      <h1>📊 Tableau de Bord</h1>
      
      {/* Avertissement pour Mainnet */}
      <div className="mainnet-warning responsive-card" style={{ marginTop: '20px', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '5px', border: '1px solid #ffeeba' }}>
        <h3>⚠️</h3>
        <p>
          <strong>ATTENTION:</strong> Cette application utilise le réseau principal Binance Smart Chain. 
          Toutes les transactions impliquent de vraies cryptomonnaies ayant une valeur réelle.
        </p>
        <p>
          Nous vous recommandons de:
        </p>
        <ul>
          <li>Commencer avec le montant minimum recquis pour tester</li>
          <li>Vérifier toutes les informations de transaction avant confirmation</li>
          <li>Ne jamais investir plus que ce que vous pouvez vous permettre de perdre</li>
        </ul>
      </div>
      
      {isLoading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement de vos données d'investissement...</p>
        </div>
      ) : isConnected ? (
        <>
          {/* Informations du wallet */}
          <div className="wallet-info-card responsive-card">
            <h2>👛 Informations du wallet</h2>
            <p className="wallet-address">
              <span>Adresse: </span>
              <span>{publicKey ? `${publicKey.substring(0, 6)}...${publicKey.substring(publicKey.length - 4)}` : "-"}</span>
            </p>
            <p>
              <span>Solde BNB: </span>
              <span>{balanceBNB ? `${parseFloat(balanceBNB).toFixed(4)} BNB` : "-"}</span>
            </p>
            <p>
              <span>Solde {usdcSymbol}: </span>
              <span>{balanceUSDC ? `${parseFloat(balanceUSDC).toFixed(2)} ${usdcSymbol}` : "-"}</span>
            </p>
          </div>
          
          {/* Affichage adapté selon que l'utilisateur a des investissements ou non */}
          {hasInvestments ? renderActiveDashboard() : renderEmptyDashboard()}
          
          {/* Lien vers l'historique complet */}
          <div className="view-history-container">
            <Link to="/rmr-m/historique" className="view-history-btn responsive-button">
              📜 Voir l'historique complet des transactions
            </Link>
          </div>
        </>
      ) : (
        <div className="not-connected responsive-card">
          <p>Veuillez connecter votre wallet pour accéder à votre tableau de bord.</p>
          <button className="connect-wallet-btn responsive-button" onClick={() => window.location.reload()}>
            🔗 Connecter avec MetaMask
          </button>
        </div>
      )}
      
      {/* Message de statut */}
      {status && (
        <div className="status-message">
          <p>{status}</p>
        </div>
      )}
      
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
    </div>
  );
};

export default Dashboard;