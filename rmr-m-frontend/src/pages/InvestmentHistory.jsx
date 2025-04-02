/**
 * Copyright (c) 2025 Jean Hugues CAVALIE
 * Tous droits réservés.
 * Ce code ne peut pas être utilisé ou redistribué sans autorisation.
 */

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { LPFarmingABI, DeFiStrategyABI } from "../utils/contractABIs";
import { contractAddresses } from "../utils/contractAddresses";
import * as ethers from "ethers";
import "./InvestmentHistory.css";
import { jsPDF } from "jspdf";
import 'jspdf-autotable';

const InvestmentHistory = () => {
  // États pour le wallet et la connexion
  const [isConnected, setIsConnected] = useState(false);
  const [publicKey, setPublicKey] = useState(null);
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // États pour les données d'historique
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: ""
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [transactionsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [displayedTransactions, setDisplayedTransactions] = useState([]);

  // Suppression du style de décalage vers la droite
  // const containerStyle = {
  //   position: 'relative',
  //   left: '780px'
  // };

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
        setStatus("❌ Veuillez installer MetaMask pour accéder à l'historique.");
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
        
        // Définir comme connecté
        setIsConnected(true);
        
        // Charger les données d'historique
        fetchTransactionHistory(account);
        
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
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setPublicKey(accounts[0]);
          fetchTransactionHistory(accounts[0]);
        } else {
          setIsConnected(false);
          setPublicKey(null);
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

  // Effet pour filtrer les transactions quand les filtres changent
  useEffect(() => {
    filterTransactions();
  }, [activeTab, transactions, dateRange]);

  // Effet pour gérer la pagination
  useEffect(() => {
    if (filteredTransactions.length > 0) {
      // Calculer le nombre total de pages
      const pages = Math.ceil(filteredTransactions.length / transactionsPerPage);
      setTotalPages(pages);
      
      // S'assurer que la page actuelle est dans les limites
      if (currentPage > pages) {
        setCurrentPage(1);
      }
      
      // Obtenir les transactions pour la page actuelle
      const startIndex = (currentPage - 1) * transactionsPerPage;
      const endIndex = Math.min(startIndex + transactionsPerPage, filteredTransactions.length);
      setDisplayedTransactions(filteredTransactions.slice(startIndex, endIndex));
    } else {
      setDisplayedTransactions([]);
      setTotalPages(1);
    }
  }, [filteredTransactions, currentPage, transactionsPerPage]);

  // Fonction pour récupérer l'historique des transactions réelles
const fetchTransactionHistory = async (address) => {
  setIsLoading(true);
  
  try {
    // Créer le provider et se connecter aux contrats
    const provider = getProvider();
    if (!provider) {
      throw new Error("Impossible de se connecter au réseau blockchain");
    }
    
    const signer = provider.getSigner();
    
    // Initialiser les contrats
    const lpFarmingContract = new ethers.Contract(
      contractAddresses.lpFarming,
      LPFarmingABI,
      signer
    );
    
    const defiStrategyContract = new ethers.Contract(
      contractAddresses.defiStrategy,
      DeFiStrategyABI,
      signer
    );
    
    // Récupérer les événements pertinents
    // Remarque: ajustez les filtres et les blocs selon vos besoins
    const fromBlock = 0; // ou une valeur appropriée pour limiter la recherche
    const currentBlock = await provider.getBlockNumber();
    
    // Récupérer les événements d'investissement
    const depositFilter = lpFarmingContract.filters.Deposit(address);
    const depositEvents = await lpFarmingContract.queryFilter(depositFilter, fromBlock, currentBlock);
    
    // Récupérer les événements de retrait
    const withdrawFilter = lpFarmingContract.filters.WithdrawCapital(address);
    const withdrawEvents = await lpFarmingContract.queryFilter(withdrawFilter, fromBlock, currentBlock);
    
    // Récupérer les événements de réclamation de récompenses
    const claimRewardsFilter = lpFarmingContract.filters.ClaimRewards(address);
    const claimRewardsEvents = await lpFarmingContract.queryFilter(claimRewardsFilter, fromBlock, currentBlock);

    // Récupérer les événements de réinvestissement de récompenses
    const reinvestRewardsFilter = lpFarmingContract.filters.ReinvestRewards(address);
    const reinvestRewardsEvents = await lpFarmingContract.queryFilter(reinvestRewardsFilter, fromBlock, currentBlock);

    
    // Transformer les événements en transactions
    const processedTransactions = [
      ...await Promise.all(depositEvents.map(async (event) => {
        const block = await event.getBlock();
        return {
          id: `TX-DEP-${event.transactionHash.substring(0, 6)}`,
          type: "investment",
          amount: parseFloat(ethers.utils.formatUnits(event.args.amount, 6)), // USDC/USDT à 6 décimales
          date: new Date(block.timestamp * 1000),
          plan: "Investissement LP Farming",
          txHash: event.transactionHash,
          status: "completed"
        };
      })),

      ...await Promise.all(claimRewardsEvents.map(async (event) => {
        const block = await event.getBlock();
        return {
          id: `TX-CLA-${event.transactionHash.substring(0, 6)}`,
          type: "withdrawal",
          amount: parseFloat(ethers.utils.formatUnits(event.args.amount, 6)),
          date: new Date(block.timestamp * 1000),
          txHash: event.transactionHash,
          status: "completed",
          notes: "Retrait de récompenses"
        };
      })),
      
      ...await Promise.all(reinvestRewardsEvents.map(async (event) => {
        const block = await event.getBlock();
        return {
          id: `TX-REI-${event.transactionHash.substring(0, 6)}`,
          type: "reinvestment",
          amount: parseFloat(ethers.utils.formatUnits(event.args.amount, 6)),
          date: new Date(block.timestamp * 1000),
          txHash: event.transactionHash,
          status: "completed",
          notes: "Réinvestissement des récompenses",
          newInvestmentId: event.args.newInvestmentId ? event.args.newInvestmentId.toString() : null
        };
      })),
      
      ...await Promise.all(withdrawEvents.map(async (event) => {
        const block = await event.getBlock();
        return {
          id: `TX-WIT-${event.transactionHash.substring(0, 6)}`,
          type: "withdrawal",
          amount: parseFloat(ethers.utils.formatUnits(event.args.amount, 6)), // USDC/USDT à 6 décimales
          date: new Date(block.timestamp * 1000),
          txHash: event.transactionHash,
          status: "completed",
          notes: "Retrait de capital"
        };
      }))];
    
    // Trier par date (du plus récent au plus ancien)
    processedTransactions.sort((a, b) => b.date - a.date);
    
    // Mettre à jour les états
    setTransactions(processedTransactions);
    setFilteredTransactions(processedTransactions);
    
    setStatus("");
    setIsLoading(false);
    
  } catch (error) {
    console.error("Erreur détaillée lors de la récupération de l'historique:", error);
    setStatus(`❌ Erreur: ${error.message}`);
    setIsLoading(false);
  }
};

  // Fonction pour filtrer les transactions
  const filterTransactions = () => {
    let filtered = [...transactions];
    
    // Filtrer par type de transaction
    if (activeTab !== "all") {
      filtered = filtered.filter(tx => tx.type === activeTab);
    }
    
    // Filtrer par plage de dates
    if (dateRange.startDate) {
      const startDate = new Date(dateRange.startDate);
      filtered = filtered.filter(tx => new Date(tx.date) >= startDate);
    }
    
    if (dateRange.endDate) {
      const endDate = new Date(dateRange.endDate);
      endDate.setHours(23, 59, 59, 999); // Fin de la journée
      filtered = filtered.filter(tx => new Date(tx.date) <= endDate);
    }
    
    setFilteredTransactions(filtered);
  };

  // Fonction pour mettre à jour les dates du filtre
  const handleDateChange = (e) => {
    setDateRange({
      ...dateRange,
      [e.target.name]: e.target.value
    });
  };

  // Fonction pour réinitialiser les filtres
  const resetFilters = () => {
    setActiveTab("all");
    setDateRange({
      startDate: "",
      endDate: ""
    });
    setCurrentPage(1);
  };

  // Changement de page
  const changePage = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // Fonction pour formater les dates
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Fonction pour obtenir l'icône en fonction du type de transaction
  const getTransactionIcon = (type) => {
    switch(type) {
      case "investment":
        return "💰";
      case "withdrawal":
        return "💸";
      case "reinvestment":
        return "🔄";
      default:
        return "📝";
    }
  };

  // Fonction pour obtenir le libellé en fonction du type de transaction
  const getTransactionTypeLabel = (type) => {
    switch(type) {
      case "investment":
        return "Investissement";
      case "withdrawal":
        return "Retrait";
      case "reinvestment":
        return "Réinvestissement";
      default:
        return "Transaction";
    }
  };

// Fonction pour générer le PDF de l'historique
const generatePDF = () => {
  setStatus("⏳ Génération du PDF en cours...");
  
  try {
    const doc = new jsPDF();
    
    // Ajouter le titre
    doc.setFontSize(18);
    doc.text("Historique des transactions", 14, 22);
    
    // Ajouter les informations du wallet
    doc.setFontSize(12);
    doc.text(`Wallet: ${publicKey ? `${publicKey.substring(0, 6)}...${publicKey.substring(publicKey.length - 4)}` : "-"}`, 14, 32);
    doc.text(`Date d'export: ${new Date().toLocaleDateString('fr-FR')}`, 14, 40);
    
    // Filtrer les transactions selon les filtres actuels
    let exportData = filteredTransactions.map(tx => [
      tx.id,
      formatDate(tx.date),
      getTransactionTypeLabel(tx.type),
      `${tx.type === "withdrawal" ? "-" : ""} ${tx.amount.toFixed(2)} USDT`,
      tx.plan || tx.notes || "-",
      tx.txHash,
      tx.status === "completed" ? "Complété" : tx.status === "pending" ? "En cours" : "Échoué"
    ]);
    
    // Créer le tableau
    doc.autoTable({
      head: [["ID", "Date", "Type", "Montant", "Détails", "Hash", "Statut"]],
      body: exportData,
      startY: 50,
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 30 },
        2: { cellWidth: 25 },
        3: { cellWidth: 25 },
        4: { cellWidth: 30 },
        5: { cellWidth: 40 },
        6: { cellWidth: 20 }
      }
    });
    
    // Ajouter les totaux
    const totalInvestment = filteredTransactions
      .filter(tx => tx.type === "investment")
      .reduce((sum, tx) => sum + tx.amount, 0);
      
    const totalWithdrawal = filteredTransactions
      .filter(tx => tx.type === "withdrawal")
      .reduce((sum, tx) => sum + tx.amount, 0);
      
    const totalReinvestment = filteredTransactions
      .filter(tx => tx.type === "reinvestment")
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    doc.text(`Total des investissements: ${totalInvestment.toFixed(2)} USDT`, 14, doc.autoTable.previous.finalY + 10);
    doc.text(`Total des retraits: ${totalWithdrawal.toFixed(2)} USDT`, 14, doc.autoTable.previous.finalY + 18);
    doc.text(`Total des réinvestissements: ${totalReinvestment.toFixed(2)} USDT`, 14, doc.autoTable.previous.finalY + 26);
    
    // Sauvegarder le PDF
    doc.save("historique-transactions.pdf");
    
    setStatus("✅ PDF téléchargé avec succès!");
    
    // Réinitialiser le message après quelques secondes
    setTimeout(() => {
      setStatus("");
    }, 3000);
  } catch (error) {
    console.error("Erreur lors de la génération du PDF:", error);
    setStatus("❌ Erreur lors de la génération du PDF");
  }
};

  // Fonction pour ouvrir le hash de transaction dans l'explorateur BSC
const openTxExplorer = async (txHash) => {
  // Utiliser l'explorateur BSC Mainnet
  const explorerUrl = await getExplorerUrl();
  window.open(`${explorerUrl}/tx/${txHash}`, '_blank');
};

// Fonction pour obtenir l'URL de l'explorateur en fonction de la chaîne
const getExplorerUrl = async () => {
  if (!window.ethereum) return "https://bscscan.com";
  
  try {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    switch (chainId) {
      case '0x38': // BSC Mainnet
        return "https://bscscan.com";
      case '0x61': // BSC Testnet
        return "https://bscscan.com";
      default:
        return "https://bscscan.com"; // Par défaut, renvoyer vers BSC Mainnet
    }
  } catch (error) {
    console.error("Erreur lors de la récupération du chainId:", error);
    return "https://bscscan.com";
  }
};

  return (
    <div className="history-container">
      <h1>📜 Historique des Transactions</h1>
      
      {isLoading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement de votre historique de transactions...</p>
        </div>
      ) : isConnected ? (
        <>
          {/* Informations du wallet */}
          <div className="wallet-info">
            <p>
              <span>Wallet: </span>
              <span>{publicKey ? `${publicKey.substring(0, 6)}...${publicKey.substring(publicKey.length - 4)}` : "-"}</span>
            </p>
            
            <Link to="/rmr-m/dashboard" className="back-to-dashboard">
              ↩️ Retour au tableau de bord
            </Link>
          </div>
          
          {/* Filtres */}
          <div className="filters-section">
            <div className="tab-filters">
              <button 
                className={`tab-btn ${activeTab === "all" ? "active" : ""}`}
                onClick={() => setActiveTab("all")}
              >
                Toutes les transactions
              </button>
              <button 
                className={`tab-btn ${activeTab === "investment" ? "active" : ""}`}
                onClick={() => setActiveTab("investment")}
              >
                Investissements
              </button>
              <button 
                className={`tab-btn ${activeTab === "withdrawal" ? "active" : ""}`}
                onClick={() => setActiveTab("withdrawal")}
              >
                Retraits
              </button>
              <button 
                className={`tab-btn ${activeTab === "reinvestment" ? "active" : ""}`}
                onClick={() => setActiveTab("reinvestment")}
              >
                Réinvestissements
              </button>
            </div>
            
            <div className="date-filters">
              <div className="date-input">
                <label>Du:</label>
                <input 
                  type="date" 
                  name="startDate"
                  value={dateRange.startDate}
                  onChange={handleDateChange}
                />
              </div>
              
              <div className="date-input">
                <label>Au:</label>
                <input 
                  type="date" 
                  name="endDate"
                  value={dateRange.endDate}
                  onChange={handleDateChange}
                />
              </div>
              
              <div className="filter-buttons">
                <button 
                  className="reset-filter-btn"
                  onClick={resetFilters}
                >
                  🔄 Réinitialiser les filtres
                </button>
              </div>
            </div>
          </div>
          
          {/* Options d'export */}
          <div className="export-options">
            <button className="export-btn" onClick={generatePDF}>
              📑 Exporter en PDF
            </button>
          </div>
          
          {/* Transactions */}
          {filteredTransactions.length > 0 ? (
            <>
              <div className="transactions-list">
                <div className="responsive-table">
                  <table className="transactions-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Montant</th>
                        <th className="transaction-details">Détails</th>
                        <th className="transaction-hash-cell">Hash</th>
                        <th>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedTransactions.map((transaction) => (
                        <tr key={transaction.id}>
                          <td className="transaction-id">{transaction.id}</td>
                          <td>{formatDate(transaction.date)}</td>
                          <td>
                            <div className="transaction-type">
                              <span className="transaction-type-icon">
                                {getTransactionIcon(transaction.type)}
                              </span>
                              <span>{getTransactionTypeLabel(transaction.type)}</span>
                            </div>
                          </td>
                          <td className={`transaction-amount ${transaction.type}`}>
                            {transaction.type === "withdrawal" ? "-" : ""} {transaction.amount.toFixed(2)} USDT
                          </td>
                          <td className="transaction-details">
                            {transaction.plan || transaction.notes || "-"}
                          </td>
                          <td className="transaction-hash-cell">
                            <span 
                              className="transaction-hash"
                              onClick={() => openTxExplorer(transaction.txHash)}
                            >
                              {transaction.txHash}
                            </span>
                          </td>
                          <td>
                            <span className={`transaction-status ${transaction.status}`}>
                              {transaction.status === "completed" ? "Complété" : transaction.status === "pending" ? "En cours" : "Échoué"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button 
                    className="pagination-btn"
                    onClick={() => changePage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    &laquo;
                  </button>
                  
                  {[...Array(totalPages)].map((_, index) => (
                    <button
                      key={index + 1}
                      className={`pagination-btn ${currentPage === index + 1 ? "active" : ""}`}
                      onClick={() => changePage(index + 1)}
                    >
                      {index + 1}
                    </button>
                  ))}
                  
                  <button 
                    className="pagination-btn"
                    onClick={() => changePage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    &raquo;
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="no-transactions">
              <p>Aucune transaction trouvée pour les filtres sélectionnés.</p>
            </div>
          )}
        </>
      ) : (
        <div className="not-connected">
          <p>Veuillez connecter votre wallet pour accéder à votre historique de transactions.</p>
          <button className="connect-wallet-btn" onClick={() => window.location.reload()}>
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

export default InvestmentHistory;