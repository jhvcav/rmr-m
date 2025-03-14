/**
 * Copyright (c) 2025 Jean Hugues CAVALIE
 * Tous droits réservés.
 * Ce code ne peut pas être utilisé ou redistribué sans autorisation.
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LPFarming.css"; // Assurez-vous d'avoir un fichier CSS correspondant

const LPFarming = () => {
  const navigate = useNavigate(); // Hook pour la navigation

  // États pour stocker les valeurs de simulation
  const [montantInvesti, setMontantInvesti] = useState("");
  const [dureeInvestissement, setDureeInvestissement] = useState("30"); // Défaut à 30 jours
  const [resultatSimulation, setResultatSimulation] = useState(null);
  
  // Paramètres fictifs du pool (à adapter selon vos besoins réels)
  const poolInfo = {
    adresse: "0x1234567890abcdef1234567890abcdef12345678",
    tauxRendement: 0.12, // 12% par an
    frais: 0.02, // 2% de frais
  };

  // Fonction pour calculer le rendement estimé
  const calculerRendement = () => {
    if (!montantInvesti || montantInvesti <= 0) {
      alert("Veuillez entrer un montant valide");
      return;
    }

    const montant = parseFloat(montantInvesti);
    const duree = parseInt(dureeInvestissement);
    
    // Calcul du rendement annuel proratisé à la durée choisie
    const rendementJournalier = poolInfo.tauxRendement / 365;
    const rendementPeriode = montant * rendementJournalier * duree;
    
    // Calcul des frais
    const fraisMontant = montant * poolInfo.frais;
    
    // Montant final
    const montantFinal = montant + rendementPeriode - fraisMontant;

    // Mise à jour du résultat de simulation
    setResultatSimulation({
      montantInvesti: montant,
      duree: duree,
      rendementEstime: rendementPeriode,
      frais: fraisMontant,
      montantFinal: montantFinal
    });
  };

  // Fonction pour naviguer vers le formulaire de dépôt
  const allerAuDepot = () => {
    // Si la simulation n'a pas été faite, on la fait d'abord
    if (!resultatSimulation) {
      calculerRendement();
      return;
    }
    
    // Navigation vers DepotForm avec les paramètres nécessaires
    navigate("/rmr-m/depot-form", {
      state: {
        montant: resultatSimulation.montantInvesti,
        adressePool: poolInfo.adresse,
        duree: resultatSimulation.duree,
        rendementEstime: resultatSimulation.rendementEstime,
        frais: resultatSimulation.frais
      }
    });
  };

  return (
    <div className="lp-farming-container">
      <h1>Liquid Proof of Farming (LPF)</h1>
      
      <section className="description-section">
        <h2>Qu'est-ce que le LPFarming ?</h2>
        <p>
          Le Liquid Proof of Farming (LPF) est une méthode d'investissement qui permet
          aux détenteurs de crypto-monnaies de générer des rendements passifs en fournissant
          des liquidités à des pools spécifiques. En échange de votre participation, vous recevez
          une part des frais de transaction et des récompenses générées par le pool.
        </p>
        <p>
          Notre plateforme simplifie ce processus en vous permettant d'investir directement
          dans des pools soigneusement sélectionnés pour leur sécurité et leur rendement.
        </p>
      </section>
      
      <section className="simulation-section">
        <h2>Simulez votre investissement</h2>
        
        <div className="simulation-form">
          <div className="form-group">
            <label htmlFor="montant">Montant à investir (USDT):</label>
            <input
              type="number"
              id="montant"
              value={montantInvesti}
              onChange={(e) => setMontantInvesti(e.target.value)}
              placeholder="Ex: 1000"
              min="1"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="duree">Durée d'investissement (jours):</label>
            <select
              id="duree"
              value={dureeInvestissement}
              onChange={(e) => setDureeInvestissement(e.target.value)}
            >
              <option value="30">30 jours</option>
              <option value="60">60 jours</option>
              <option value="90">90 jours</option>
              <option value="180">180 jours</option>
              <option value="365">365 jours</option>
            </select>
          </div>
          
          <button className="btn-calculer" onClick={calculerRendement}>
            Calculer le rendement
          </button>
        </div>
        
        {resultatSimulation && (
          <div className="simulation-results">
            <h3>Résultats de la simulation</h3>
            <div className="result-item">
              <span>Montant investi:</span>
              <span>{resultatSimulation.montantInvesti.toFixed(2)} USDT</span>
            </div>
            <div className="result-item">
              <span>Durée d'investissement:</span>
              <span>{resultatSimulation.duree} jours</span>
            </div>
            <div className="result-item">
              <span>Rendement estimé:</span>
              <span>{resultatSimulation.rendementEstime.toFixed(2)} USDT</span>
            </div>
            <div className="result-item">
              <span>Frais de gestion:</span>
              <span>{resultatSimulation.frais.toFixed(2)} USDT</span>
            </div>
            <div className="result-item total">
              <span>Montant estimé à terme:</span>
              <span>{resultatSimulation.montantFinal.toFixed(2)} USDT</span>
            </div>
            
            <button className="btn-valider" onClick={allerAuDepot}>
              Valider mon choix
            </button>
          </div>
        )}
      </section>
      
      <section className="advantages-section">
        <h2>Avantages du LPFarming sur notre plateforme</h2>
        <ul>
          <li>Sélection rigoureuse des pools pour minimiser les risques</li>
          <li>Rendements attractifs par rapport aux placements traditionnels</li>
          <li>Interface simplifiée pour investir sans connaissance technique</li>
          <li>Flexibilité des durées d'investissement</li>
          <li>Frais transparents et compétitifs</li>
        </ul>
      </section>
    </div>
  );
};

export default LPFarming;