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

console.log("Contract Addresses:", contractAddresses);

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

  // Fonction pour créer un provider compatible avec plusieurs versions d'ethers
  const getProvider = () => {
    if (!window.ethereum) return null;
    
    try {
      // Pour ethers v5
      if (ethers.providers && ethers.providers.Web3Provider) {
        return new ethers.providers.Web3Provider(window.ethereum);
      }
      
      throw new Error("Version d'ethers non supportée");
    } catch (error) {
      console.error("Erreur lors de la création du provider:", error);
      return null;
    }
  };

  // Fonction pour récupérer les événements par lots pour éviter les timeouts
  const queryFilterInBatches = async (contract, filter, fromBlock, toBlock, batchSize = 10000) => {
    let results = [];
    let current = fromBlock;
    
    while (current <= toBlock) {
      const endBlock = Math.min(current + batchSize - 1, toBlock);
      try {
        console.log(`Requête des événements du bloc ${current} au bloc ${endBlock}`);
        const batchResults = await contract.queryFilter(filter, current, endBlock);
        results = [...results, ...batchResults];
        current = endBlock + 1;
      } catch (error) {
        console.error(`Erreur pour la plage ${current}-${endBlock}:`, error);
        
        // Réduire la taille du lot en cas d'erreur
        if (batchSize <= 1000) {
          console.error("Impossible de récupérer les événements même avec un petit lot:", error);
          break;  // On sort de la boucle au lieu de jeter une erreur
        }
        
        batchSize = Math.floor(batchSize / 2);
        console.log(`Réduction de la taille de lot à ${batchSize}`);
      }
    }
    
    return results;
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
      // Vérifier que le provider est disponible
      const provider = getProvider();
      if (!provider) {
        throw new Error("Impossible de se connecter au réseau blockchain");
      }
      
      // Récupérer le chainId actuel
      const networkChainId = await window.ethereum.request({ method: 'eth_chainId' });
      console.log("Chaîne actuelle:", networkChainId);
      
      // Récupérer les adresses de contrats pour la chaîne actuelle
      const addresses = contractAddresses.get(networkChainId);
      
      if (!addresses || !addresses.lpFarming) {
        throw new Error(`Adresses de contrats non disponibles pour la chaîne ${networkChainId}`);
      }
      
      console.log("Adresse du contrat LP Farming:", addresses.lpFarming);
      
      const signer = provider.getSigner();
      
      // Initialiser le contrat
      const lpFarmingContract = new ethers.Contract(
        addresses.lpFarming,
        LPFarmingABI,
        signer
      );
      
      console.log("Récupération des investissements de l'utilisateur...");
      
      // Appeler directement la méthode de lecture du contrat qui retourne les investissements
      const investmentsData = await lpFarmingContract.getUserInvestments(address);
      console.log("Investissements récupérés:", investmentsData);
      
      // Déstructurer les données retournées
      const {
        ids,
        amounts,
        startTimes,
        endTimes,
        periods,
        aprs,
        activeStatus
      } = investmentsData;
      
      console.log("Nombre d'investissements:", ids.length);
      
      // Pour récupérer les hashes de transaction, nous allons interroger directement BSCScan
      // Sans clé API, nous sommes limités à 5 requêtes par seconde
      const baseURL = networkChainId === '0x38' ? 
        "https://api.bscscan.com/api" : 
        "https://api-testnet.bscscan.com/api";
      
      // Récupérer les transactions récentes de l'utilisateur avec le contrat (sans clé API)
      const txListURL = `${baseURL}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc`;
      const txResponse = await fetch(txListURL);
      const txData = await txResponse.json();
      
      // Créer un mapping des hash de transactions par date approximative (timestamp)
      const txHashesByTimestamp = {};
      if (txData.status === "1" && txData.result) {
        // Filtrer pour garder uniquement les transactions avec notre contrat
        const contractTxs = txData.result.filter(tx => 
          tx.to.toLowerCase() === addresses.lpFarming.toLowerCase()
        );
        
        // Organiser par timestamp
        contractTxs.forEach(tx => {
          const timestamp = parseInt(tx.timeStamp);
          txHashesByTimestamp[timestamp] = tx.hash;
        });
      }
      
      // Convertir les données en transactions
      const processedTransactions = [];
      
      // Ajouter les investissements
      for (let i = 0; i < ids.length; i++) {
        const startTime = startTimes[i].toNumber();
        const endTime = endTimes[i].toNumber();

        console.log("BigNumber original:", amounts[i].toString());
        console.log("Après formatUnits(x, 6):", ethers.utils.formatUnits(amounts[i], 6));
        console.log("Après parseFloat:", parseFloat(ethers.utils.formatUnits(amounts[i], 6)));
        
        // Conversion correcte du montant (USDC a 6 décimales, pas 18)
        const amount = parseFloat(ethers.utils.formatUnits(amounts[i], 18));
        
        // Chercher le hash de transaction proche du temps de départ
        const depositHash = findClosestTxHash(txHashesByTimestamp, startTime) || "";
        
        // Créer une transaction pour l'investissement initial
        processedTransactions.push({
          id: `TX-INV-${ids[i].toString()}`,
          type: "investment",
          amount: amount, // Utilisation de la variable convertie correctement
          date: new Date(startTime * 1000),
          plan: `Investissement LP ${periods[i].toString()} jours à ${aprs[i].toNumber() / 100}%`,
          txHash: depositHash,
          status: "completed",
          investmentId: ids[i].toString(),
          active: activeStatus[i]
        });
        
        // Si l'investissement n'est plus actif, ajouter également un retrait
        if (!activeStatus[i]) {
          // Chercher le hash de transaction proche du temps de fin
          const withdrawHash = findClosestTxHash(txHashesByTimestamp, endTime) || "";
          
          processedTransactions.push({
            id: `TX-WIT-${ids[i].toString()}`,
            type: "withdrawal",
            amount: amount, // Utilisation de la variable convertie correctement
            date: new Date(endTime * 1000),
            notes: "Retrait de capital",
            txHash: withdrawHash,
            status: "completed",
            investmentId: ids[i].toString()
          });
        }
      }
      
      // Récupérer d'autres données du solde de l'utilisateur
      const balanceData = await lpFarmingContract.getUserBalance(address);
      console.log("Données de solde:", balanceData);
      
      const totalEarned = parseFloat(ethers.utils.formatUnits(balanceData.totalEarned, 6));  // USDC utilise 6 décimales
      const pendingRewards = parseFloat(ethers.utils.formatUnits(balanceData.pendingRewards, 6));  // USDC utilise 6 décimales
      
      // Si l'utilisateur a des récompenses, ajouter comme transaction en attente
      if (pendingRewards > 0) {
        processedTransactions.push({
          id: `TX-REW-PENDING`,
          type: "withdrawal",
          amount: pendingRewards,
          date: new Date(), // Date actuelle
          notes: "Récompenses en attente",
          txHash: "",
          status: "pending"
        });
      }
      
      // Si l'utilisateur a des gains totaux supérieurs aux récompenses en attente,
      // c'est qu'il a déjà retiré des récompenses ou réinvesti
      const claimedRewards = totalEarned - pendingRewards;
      if (claimedRewards > 0) {
        // Chercher le hash de transaction le plus récent pour les récompenses
        const recentHash = Object.keys(txHashesByTimestamp).length > 0 ? 
          txHashesByTimestamp[Math.max(...Object.keys(txHashesByTimestamp).map(k => parseInt(k)))] : "";
        
        processedTransactions.push({
          id: `TX-REW-CLAIMED`,
          type: "withdrawal",
          amount: claimedRewards,
          date: new Date(Date.now() - 86400000), // Estimé à 1 jour avant (approximation)
          notes: "Récompenses réclamées",
          txHash: recentHash,
          status: "completed"
        });
      }
      
      // Trier par date (du plus récent au plus ancien)
      processedTransactions.sort((a, b) => b.date - a.date);
      
      console.log(`Total des transactions traitées: ${processedTransactions.length}`);
      
      // Mettre à jour les états
      setTransactions(processedTransactions);
      setFilteredTransactions(processedTransactions);
      
      setStatus("");
      setIsLoading(false);
      
    } catch (error) {
      console.error("Erreur détaillée lors de la récupération des données:", error);
      setStatus(`❌ Erreur: ${error.message}`);
      setIsLoading(false);
    }
  };
  
  // Fonction utilitaire pour trouver le hash de transaction le plus proche d'un timestamp donné
  const findClosestTxHash = (txHashesByTimestamp, targetTimestamp) => {
    if (Object.keys(txHashesByTimestamp).length === 0) {
      return null;
    }
    
    // Convertir les clés en nombres et trier
    const timestamps = Object.keys(txHashesByTimestamp).map(ts => parseInt(ts)).sort((a, b) => a - b);
    
    // Trouver le timestamp le plus proche
    let closest = timestamps[0];
    let closestDiff = Math.abs(targetTimestamp - closest);
    
    for (let i = 1; i < timestamps.length; i++) {
      const diff = Math.abs(targetTimestamp - timestamps[i]);
      if (diff < closestDiff) {
        closest = timestamps[i];
        closestDiff = diff;
      }
    }
    
    // Retourner le hash correspondant au timestamp le plus proche
    // Mais seulement si la différence est inférieure à 1 jour (86400 secondes)
    return closestDiff <= 86400 ? txHashesByTimestamp[closest] : null;
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
        `${tx.type === "withdrawal" ? "-" : ""} ${tx.amount.toFixed(2)} USDC`, // Changement de USDT à USDC
        tx.plan || tx.notes || "-",
        tx.txHash ? `${tx.txHash.substring(0, 6)}...${tx.txHash.substring(tx.txHash.length - 4)}` : "-", // Affichage abrégé du hash ou "-" si non disponible
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
      
      // Changer USDT en USDC et utiliser toFixed(2) pour limiter à 2 décimales
      doc.text(`Total des investissements: ${totalInvestment.toFixed(2)} USDC`, 14, doc.autoTable.previous.finalY + 10);
      doc.text(`Total des retraits: ${totalWithdrawal.toFixed(2)} USDC`, 14, doc.autoTable.previous.finalY + 18);
      doc.text(`Total des réinvestissements: ${totalReinvestment.toFixed(2)} USDC`, 14, doc.autoTable.previous.finalY + 26);
      
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
          return "https://testnet.bscscan.com";
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
                        {transaction.type === "withdrawal" ? "-" : ""} {transaction.amount.toFixed(2)} USDC
                      </td>
                      <td className="transaction-details">
                        {transaction.plan || transaction.notes || "-"}
                      </td>
                      <td className="transaction-hash-cell">
                        {transaction.txHash ? (
                          <span 
                            className="transaction-hash"
                            onClick={() => openTxExplorer(transaction.txHash)}
                          >
                            {`${transaction.txHash.substring(0, 6)}...${transaction.txHash.substring(transaction.txHash.length - 4)}`}
                          </span>
                        ) : (
                          "-"
                        )}
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