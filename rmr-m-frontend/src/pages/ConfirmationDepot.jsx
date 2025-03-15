/**
 * Copyright (c) 2025 Jean Hugues CAVALIE
 * Tous droits réservés.
 * Ce code ne peut pas être utilisé ou redistribué sans autorisation.
 */

import React, { useEffect, useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import "./ConfirmationDepot.css";

const ConfirmationDepot = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);

  // Récupération des données de transaction
  const transactionData = location.state || {
    transactionId: "Unknown",
    montant: 0,
    adressePool: "Unknown",
    duree: 0
  };

  // Redirection automatique après le compte à rebours
  useEffect(() => {
    if (countdown <= 0) {
      navigate("/rmr-m/dashboard");
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, navigate]);

  // Fonction pour formater l'ID de transaction
  const formatTransactionId = (id) => {
    if (!id || id === "Unknown") return "Inconnu";
    if (id.length > 20) {
      return `${id.substring(0, 10)}...${id.substring(id.length - 6)}`;
    }
    return id;
  };

  // Fonction pour formater l'adresse du pool
  const formatAdresse = (adresse) => {
    if (!adresse || adresse === "Unknown") return "Inconnue";
    if (adresse.length > 15) {
      return `${adresse.substring(0, 6)}...${adresse.substring(adresse.length - 4)}`;
    }
    return adresse;
  };

  return (
    <div className="confirmation-container">
      <div className="confirmation-card">
        <div className="success-icon">✅</div>
        <h1>Transaction Réussie !</h1>
        
        <p className="confirmation-message">
          Votre dépôt a été effectué avec succès. Les fonds ont été envoyés au pool et votre investissement est maintenant actif.
        </p>
        
        <div className="transaction-details">
          <h2>Détails de la transaction</h2>
          
          <div className="detail-item">
            <span className="detail-label">ID de transaction:</span>
            <span className="detail-value">{formatTransactionId(transactionData.transactionId)}</span>
          </div>
          
          <div className="detail-item">
            <span className="detail-label">Montant investi:</span>
            <span className="detail-value">{transactionData.montant} USDT</span>
          </div>
          
          <div className="detail-item">
            <span className="detail-label">Pool:</span>
            <span className="detail-value">{formatAdresse(transactionData.adressePool)}</span>
          </div>
          
          <div className="detail-item">
            <span className="detail-label">Durée:</span>
            <span className="detail-value">{transactionData.duree} jours</span>
          </div>
          
          <div className="detail-item">
            <span className="detail-label">Date de transaction:</span>
            <span className="detail-value">{new Date().toLocaleString()}</span>
          </div>
        </div>
        
        <div className="next-steps">
          <h2>Prochaines étapes</h2>
          <ul>
            <li>Votre investissement commencera à générer des rendements dès maintenant</li>
            <li>Vous pouvez suivre vos gains quotidiens dans votre tableau de bord</li>
            <li>Un email de confirmation vous a été envoyé (si configuré)</li>
          </ul>
        </div>
        
        <div className="action-buttons">
          <Link to="/rmr-m/dashboard" className="primary-btn">
            Aller au tableau de bord
          </Link>
          <Link to="/rmr-m/lpfarming" className="secondary-btn">
            Faire un autre investissement
          </Link>
        </div>
        
        <div className="auto-redirect">
          Redirection automatique vers le tableau de bord dans <span className="countdown">{countdown}</span> secondes
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDepot;