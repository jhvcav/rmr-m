/**
 * Copyright (c) 2025 Jean Hugues CAVALIE
 * Tous droits réservés.
 * Ce code ne peut pas être utilisé ou redistribué sans autorisation.
 */

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import * as ethers from "ethers";
import "./InvestmentHistory.css";

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

  // Fonction pour récupérer l'historique des transactions (simulation)
  const fetchTransactionHistory = async (address) => {
    setIsLoading(true);
    
    try {
      // En situation réelle, ces données seraient récupérées depuis un contrat smart ou une API
      // Ici, on simule un délai de chargement
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Données simulées
      const today = new Date();
      const mockTransactions = [
        {
          id: "TX-001",
          type: "investment",
          amount: 1000,
          date: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
          plan: "Plan 90 jours - 12% APR",
          txHash: "0xabc123...",
          status: "completed"
        },
        {
          id: "TX-002",
          type: "investment",
          amount: 500,
          date: new Date(today.getTime() - 45 * 24 * 60 * 60 * 1000),
          plan: "Plan 30 jours - 8% APR",
          txHash: "0xdef456...",
          status: "completed"
        },
        {
          id: "TX-003",
          type: "investment",
          amount: 2000,
          date: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000),
          plan: "Plan 180 jours - 15% APR",
          txHash: "0xghi789...",
          status: "completed"
        },
        {
          id: "TX-004",
          type: "withdrawal",
          amount: 25.75,
          date: new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000),
          txHash: "0xjkl012...",
          status: "completed",
          notes: "Retrait de gains"
        },
        {
          id: "TX-005",
          type: "withdrawal",
          amount: 500,
          date: new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000),
          txHash: "0xmno345...",
          status: "completed",
          notes: "Retrait de capital à maturité"
        },
        {
          id: "TX-006",
          type: "reinvestment",
          amount: 32.50,
          date: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
          plan: "Plan 90 jours - 12% APR",
          txHash: "0xpqr678...",
          status: "completed",
          notes: "Réinvestissement des gains"
        },
        {
          id: "TX-007",
          type: "withdrawal",
          amount: 18.20,
          date: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000),
          txHash: "0xstu901...",
          status: "completed",
          notes: "Retrait de gains"
        },
        {
          id: "TX-008",
          type: "reinvestment",
          amount: 45.75,
          date: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000),
          plan: "Plan 180 jours - 15% APR",
          txHash: "0xvwx234...",
          status: "completed",
          notes: "Réinvestissement des gains"
        },
        {
          id: "TX-009",
          type: "investment",
          amount: 750,
          date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
          plan: "Plan 90 jours - 12% APR",
          txHash: "0xyzA567...",
          status: "completed"
        },
        {
          id: "TX-010",
          type: "withdrawal",
          amount: 12.40,
          date: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000),
          txHash: "0xBCD890...",
          status: "completed",
          notes: "Retrait de gains"
        },
        {
          id: "TX-011",
          type: "investment",
          amount: 1500,
          date: new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000),
          plan: "Plan 180 jours - 15% APR",
          txHash: "0xEFG123...",
          status: "completed"
        },
        {
          id: "TX-012",
          type: "reinvestment",
          amount: 60.25,
          date: new Date(today.getTime() - 20 * 24 * 60 * 60 * 1000),
          plan: "Plan 90 jours - 12% APR",
          txHash: "0xHIJ456...",
          status: "completed",
          notes: "Réinvestissement des gains"
        }
      ];
      
      // Trier par date (du plus récent au plus ancien)
      mockTransactions.sort((a, b) => b.date - a.date);
      
      // Mettre à jour les états
      setTransactions(mockTransactions);
      setFilteredTransactions(mockTransactions);
      
      setStatus("");
      setIsLoading(false);
      
    } catch (error) {
      console.error("Erreur lors de la récupération de l'historique:", error);
      setStatus("❌ Erreur lors du chargement de l'historique des transactions");
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
    
    // Simulation de génération de PDF
    setTimeout(() => {
      setStatus("✅ PDF téléchargé avec succès!");
      
      // Réinitialiser le message après quelques secondes
      setTimeout(() => {
        setStatus("");
      }, 3000);
    }, 2000);
    
    // En situation réelle, appel à une bibliothèque de génération de PDF
  };

  // Fonction pour ouvrir le hash de transaction dans l'explorateur
  const openTxExplorer = (txHash) => {
    // En situation réelle, ouvrir l'explorateur BSC Testnet avec le hash
    alert(`Ouverture de la transaction ${txHash} dans l'explorateur (simulation)`);
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
                        <th>Détails</th>
                        <th>Hash</th>
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
                          <td>
                            {transaction.plan || transaction.notes || "-"}
                          </td>
                          <td>
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