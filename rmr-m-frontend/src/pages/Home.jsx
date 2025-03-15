/**
 * Copyright (c) 2025 Jean Hugues CAVALIE
 * Tous droits réservés.
 * Ce code ne peut pas être utilisé ou redistribué sans autorisation.
 */

import React from "react";
import { Link } from "react-router-dom";
import "./Home.css";
import { motion } from "framer-motion"; // Importer Framer Motion pour les animations

// Ajout d'un style inline pour compenser le décalage vers la gauche
const containerStyle = {
  marginLeft: "50px" // Décalage manuel vers la droite
};

const Home = () => {
  return (
    <div className="home-container" style={containerStyle}>
      {/* Animation du titre */}
      <motion.h1 
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        Bienvenue sur <span className="highlight">RMR-M</span>
      </motion.h1>

      {/* Animation du texte */}
      <motion.p 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        Investissez en toute simplicité et profitez d'un écosystème décentralisé rentable.
      </motion.p>

      {/* Animation du bouton */}
      <motion.div 
        className="button-container"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 1 }}
      >
        <Link to="rmr-m/dashboard" className="btn btn-dark">Je fais mon choix</Link>
        <Link to="App" className="btn btn-dark">Commencer</Link>
      </motion.div>

      {/* Section des solutions de gains */}
      <section className="solutions">
        <h2>Nos solutions pour générer des gains</h2>
        <div className="solution-list">
          <Link to="/rmr-m/lpfarming" className="solution-card">
            <h3>📈 Investissements</h3>
            <p>Placer des fonds dans des pools et obtenir un rendement stable.</p>
          </Link>
          <div className="solution-card">
            <h3>💹 Arbitrage</h3>
            <p>Profitez des variations de prix sur différentes plateformes.</p>
          </div>
          <div className="solution-card">
            <h3>🔗 Staking & Récompenses</h3>
            <p>Bloquez vos actifs et obtenez des intérêts passifs.</p>
          </div>
          <div className="solution-card">
            <h3>🎟️ Achat & Vente de NFT</h3>
            <p>Investissez dans nos NFT exclusifs et bénéficiez d'avantages.</p>
          </div>
          <div className="solution-card">
            <h3>🤝 Programme d'affiliation</h3>
            <p>Gagnez des commissions en invitant d'autres investisseurs.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;