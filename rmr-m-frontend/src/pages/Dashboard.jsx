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

// Adresse du contrat USDC sur BSC Testnet
const USDC_CONTRACT_ADDRESS = "0xb48249Ef5b895d6e7AD398186DF2B0c3Cec2BF94";

const Dashboard = () => {
  // États pour le wallet et la connexion
  const [isConnected, setIsConnected] = useState(false);
  const [publicKey, setPublicKey] = useState(null);
  const [balanceBNB, setBalanceBNB] = useState(null);
  const [balanceUSDC, setBalanceUSDC] = useState(null);
  const [usdcDecimals, setUsdcDecimals] = useState(18); // Par défaut 18, sera mis à jour
  const [usdcSymbol, setUsdcSymbol] = useState("USDC");
  const [status, setStatus] = useState("");

  // États pour les données d'investissement
  const [totalInvested, setTotalInvested] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [dailyEarnings, setDailyEarnings] = useState(0);
  const [availableForWithdrawal, setAvailableForWithdrawal] = useState(0);
  const [investmentsList, setInvestmentsList] = useState([]);
  const [matureInvestments, setMatureInvestments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasInvestments, setHasInvestments] = useState(true); // Nouvel état pour vérifier si l'utilisateur a des investissements

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

  // Connexion au wallet et récupération des données
  useEffect(() => {
    const connectWallet = async () => {
      if (!window.ethereum) {
        setStatus("❌ Veuillez installer MetaMask pour accéder au tableau de bord.");
        setIsLoading(false);
        return;
      }

      try {
        // Demander l'accès au compte MetaMask
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        if (accounts.length === 0) {
          setStatus("❌ Aucun compte détecté.");
          setIsLoading(false);
          return;
        }
        
        const account = accounts[0];
        setPublicKey(account);
        
        // Utiliser le provider 
        const provider = getProvider();
        if (!provider) {
          setStatus("❌ Erreur d'initialisation du provider ethers");
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
        setStatus(`❌ Erreur: ${error.message}`);
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
          setStatus("⚠️ Déconnecté de MetaMask.");
        }
      });
    }
    
    // Nettoyer les écouteurs lors du démontage
    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
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
      
    } catch (error) {
      console.error("Erreur lors de la mise à jour des soldes:", error);
    }
  };

  // Fonction pour récupérer les données d'investissement (simulation)
  const fetchInvestmentData = async (address) => {
    setIsLoading(true);
    
    try {
      // En situation réelle, ces données seraient récupérées depuis un contrat smart ou une API
      // Ici, on simule un délai de chargement
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Pour la démo, on peut choisir de simuler un utilisateur sans investissement
      // Dans une vraie application, cela serait déterminé par les données réelles
      
      // Pour simuler un utilisateur sans investissement, décommentez cette ligne et commentez le mockInvestments
      // const mockInvestments = [];
      
      // Données simulées avec des investissements
      const today = new Date();
      const mockInvestments = [
        {
          id: "INV-001",
          amount: 1000,
          startDate: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
          duration: 90,
          endDate: new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000),
          apr: 12,
          dailyReturn: 0.328,
          totalEarned: 9.84,
          status: "active"
        },
        {
          id: "INV-002",
          amount: 500,
          startDate: new Date(today.getTime() - 45 * 24 * 60 * 60 * 1000),
          duration: 30,
          endDate: new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000),
          apr: 8,
          dailyReturn: 0.109,
          totalEarned: 3.27,
          status: "matured"
        },
        {
          id: "INV-003",
          amount: 2000,
          startDate: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000),
          duration: 180,
          endDate: new Date(today.getTime() + 170 * 24 * 60 * 60 * 1000),
          apr: 15,
          dailyReturn: 0.821,
          totalEarned: 8.21,
          status: "active"
        }
      ];
      
      // Vérifier si l'utilisateur a des investissements
      if (mockInvestments.length === 0) {
        setHasInvestments(false);
        setInvestmentsList([]);
        setTotalInvested(0);
        setTotalEarnings(0);
        setDailyEarnings(0);
        setAvailableForWithdrawal(0);
        setMatureInvestments([]);
      } else {
        // Mettre à jour les états avec les données
        setHasInvestments(true);
        setInvestmentsList(mockInvestments);
        
        // Calculer les montants totaux
        const total = mockInvestments.reduce((sum, inv) => sum + inv.amount, 0);
        setTotalInvested(total);
        
        const earnings = mockInvestments.reduce((sum, inv) => sum + inv.totalEarned, 0);
        setTotalEarnings(earnings);
        
        const daily = mockInvestments
          .filter(inv => inv.status === "active")
          .reduce((sum, inv) => sum + inv.dailyReturn, 0);
        setDailyEarnings(daily);
        
        // Définir les montants disponibles pour retrait
        setAvailableForWithdrawal(earnings > 5 ? earnings : 0);
        
        // Identifier les investissements arrivés à maturité
        const mature = mockInvestments.filter(inv => inv.status === "matured");
        setMatureInvestments(mature);
      }
      
      setStatus("");
      setIsLoading(false);
      
    } catch (error) {
      console.error("Erreur lors de la récupération des données:", error);
      setStatus("❌ Erreur lors du chargement des données d'investissement");
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

  // Fonction pour retirer les gains
  const handleWithdrawEarnings = async () => {
    if (availableForWithdrawal < 5) {
      setStatus(`⚠️ Le minimum pour retirer est de 5 ${usdcSymbol}.`);
      return;
    }
    
    setStatus("⏳ Traitement du retrait des gains...");
    
    // Simulation du retrait
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setStatus(`✅ Retrait de ${availableForWithdrawal.toFixed(2)} ${usdcSymbol} effectué avec succès!`);
    setAvailableForWithdrawal(0);
    
    // En situation réelle, appel au contrat smart pour retirer les gains
  };

  // Fonction pour réinvestir les gains
  const handleReinvestEarnings = async () => {
    if (totalEarnings <= 0) {
      setStatus("⚠️ Aucun gain disponible à réinvestir.");
      return;
    }
    
    setStatus("⏳ Réinvestissement des gains en cours...");
    
    // Simulation du réinvestissement
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setStatus(`✅ Réinvestissement de ${totalEarnings.toFixed(2)} ${usdcSymbol} effectué avec succès!`);
    setTotalInvested(totalInvested + totalEarnings);
    setTotalEarnings(0);
    setAvailableForWithdrawal(0);
    
    // En situation réelle, appel au contrat smart pour réinvestir les gains
  };

  // Fonction pour retirer les capitaux arrivés à maturité
  const handleWithdrawCapital = async () => {
    if (matureInvestments.length === 0) {
      setStatus("⚠️ Aucun investissement arrivé à maturité.");
      return;
    }
    
    const totalMature = matureInvestments.reduce((sum, inv) => sum + inv.amount, 0);
    
    setStatus(`⏳ Retrait du capital de ${totalMature.toFixed(2)} ${usdcSymbol} en cours...`);
    
    // Simulation du retrait
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setStatus(`✅ Capital de ${totalMature.toFixed(2)} ${usdcSymbol} retiré avec succès!`);
    
    // Mise à jour des listes
    setInvestmentsList(investmentsList.filter(inv => inv.status !== "matured"));
    setMatureInvestments([]);
    setTotalInvested(totalInvested - totalMature);
    
    // En situation réelle, appel au contrat smart pour retirer le capital
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
            className={`action-btn withdraw-btn responsive-button ${availableForWithdrawal < 5 ? 'disabled' : ''}`}
            onClick={handleWithdrawEarnings} 
            disabled={availableForWithdrawal < 5}
          >
            🔄 Retirer mes gains
            {availableForWithdrawal < 5 && <span className="btn-note">(min. 5 {usdcSymbol})</span>}
          </button>
          
          <button 
            className={`action-btn reinvest-btn responsive-button ${totalEarnings <= 0 ? 'disabled' : ''}`}
            onClick={handleReinvestEarnings} 
            disabled={totalEarnings <= 0}
          >
            🔁 Réinvestir mes gains
          </button>
          
          <button 
            className={`action-btn capital-btn responsive-button ${matureInvestments.length === 0 ? 'disabled' : ''}`}
            onClick={handleWithdrawCapital} 
            disabled={matureInvestments.length === 0}
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
    </div>
  );
};

export default Dashboard;