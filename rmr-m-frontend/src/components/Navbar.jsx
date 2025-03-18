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
        {/* Bouton hamburger pour mobile */}
        {!menuOpen && (
          <button 
            className="menu-toggle menu-open-btn" 
            onClick={() => setMenuOpen(true)}
          >
            ☰
          </button>
        )}

        {/* Liste des menus - Menu latéral en mode mobile */}
        <ul className={`nav-menu ${menuOpen ? "open" : ""}`}>
          {/* Bouton de fermeture - avec inline-style pour assurer qu'il est visible */}
          <button 
            className="menu-toggle menu-close-btn" 
            onClick={() => setMenuOpen(false)}
            style={{ 
              position: 'fixed',
              top: '10px',
              right: '10px',
              zIndex: 9999,
              backgroundColor: '#ff3333',
              color: 'white',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: '2px solid white',
              fontSize: '28px',
              display: menuOpen ? 'flex' : 'none',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 10px rgba(0,0,0,0.8)',
              padding: 0
            }}
          >
            ✕
          </button>
          
          <li className="nav-item"><Link to="/rmr-m" onClick={() => setMenuOpen(false)}>Accueil</Link></li>
          <li className="nav-item"><Link to="/rmr-m/wallet-connect" onClick={() => setMenuOpen(false)}>Connexion Wallet</Link></li>
          <li className="nav-item"><Link to="/rmr-m/dashboard" onClick={() => setMenuOpen(false)}>Tableau de bord</Link></li>
          <li className="nav-item"><Link to="/rmr-m/nft" onClick={() => setMenuOpen(false)}>Achat de NFT</Link></li>
          <li className="nav-item"><Link to="/rmr-m/affiliation" onClick={() => setMenuOpen(false)}>Programme d'affiliation</Link></li>
          <li className="nav-item"><Link to="/rmr-m/historique" onClick={() => setMenuOpen(false)}>Historique des investissements</Link></li>
          <li className="nav-item"><Link to="/rmr-m/contact" onClick={() => setMenuOpen(false)}>Contact</Link></li>
          <li className="nav-item"><Link to="/rmr-m/a-propos" onClick={() => setMenuOpen(false)}>À propos</Link></li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;