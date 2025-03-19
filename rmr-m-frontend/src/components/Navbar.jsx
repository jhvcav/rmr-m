/**
 * Copyright (c) 2025 Jean Hugues CAVALIE
 * Tous droits réservés.
 * Ce code ne peut pas être utilisé ou redistribué sans autorisation.
 */

import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="container">
        {/* Bouton hamburger pour mobile avec span pour un meilleur centrage */}
        {!menuOpen && (
          <button className="menu-toggle menu-open-btn" onClick={() => setMenuOpen(true)}>
            <span>☰</span>
          </button>
        )}

        {/* Liste des menus - Menu latéral en mode mobile */}
        <ul className={`nav-menu ${menuOpen ? "open" : ""}`}>
          {/* Bouton de fermeture - utilise le CSS existant */}
          {menuOpen && (
            <button className="menu-toggle menu-close-btn" onClick={() => setMenuOpen(false)}>
              ✕
            </button>
          )}
          
          <li className="nav-item"><Link to="/rmr-m" onClick={() => setMenuOpen(false)}>Accueil</Link></li>
          <li className="nav-item"><Link to="/rmr-m/wallet-connect" onClick={() => setMenuOpen(false)}>Connexion Wallet</Link></li>
          <li className="nav-item"><Link to="/rmr-m/dashboard" onClick={() => setMenuOpen(false)}>Tableau de bord</Link></li>
          <li className="nav-item"><Link to="/rmr-m/nft" onClick={() => setMenuOpen(false)}>Achat de NFT</Link></li>
          <li className="nav-item"><Link to="/rmr-m/affiliation" onClick={() => setMenuOpen(false)}>Programme d'affiliation</Link></li>
          <li className="nav-item"><Link to="/rmr-m/historique" onClick={() => setMenuOpen(false)}>Historique des investissements</Link></li>
          <li className="nav-item"><Link to="/rmr-m/contact" onClick={() => setMenuOpen(false)}>Contact</Link></li>
          <li className="nav-item"><Link to="/rmr-m/a-propos" onClick={() => setMenuOpen(false)}>À propos</Link></li>
        </ul>
        
        {/* Bouton de fermeture supplémentaire - visible en mode mobile uniquement */}
        {menuOpen && (
          <button 
            className="alternate-close-btn"
            onClick={() => setMenuOpen(false)}
          >
            ✕
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;