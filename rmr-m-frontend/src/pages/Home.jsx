import React from "react";
import { Link } from "react-router-dom";
import "./Home.css";
import { motion } from "framer-motion"; // Importer Framer Motion pour les animations

const Home = () => {
  return (
    <div className="home-container">
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
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 1 }}
      >
        <Link to="/dashboard" className="btn btn-dark">Je fais mon choix</Link>
        <Link to="/wallet-connect" className="btn btn-dark">Commencer</Link>
      </motion.div>

      {/* Section des solutions de gains */}
      <section className="solutions">
        <h2>Nos solutions pour générer des gains</h2>
        <div className="solution-list">
          <div className="solution-card">
            <h3>📈 Investissements</h3>
            <p>Placez vos fonds dans nos pools et obtenez un rendement stable.</p>
          </div>
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
            <h3>🤝 Programme d’affiliation</h3>
            <p>Gagnez des commissions en invitant d'autres investisseurs.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;