/**
 * Copyright (c) 2025 Jean Hugues CAVALIE
 * Tous droits réservés.
 * Ce code ne peut pas être utilisé ou redistribué sans autorisation.
 */

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Ajouter un effet pour forcer la visibilité de la croix quand le menu est ouvert
  useEffect(() => {
    if (menuOpen) {
      // Force la création et la visibilité de la croix
      const timer = setTimeout(() => {
        const closeBtn = document.querySelector('.menu-close-btn');
        if (closeBtn) {
          closeBtn.style.display = 'flex';
          closeBtn.style.position = 'fixed';
          closeBtn.style.top = '20px';
          closeBtn.style.right = '20px';
          closeBtn.style.zIndex = '9999';
          closeBtn.style.backgroundColor = '#ff3333';
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [menuOpen]);

  return (
    <nav className="navbar">
      <div className="container">
        {/* Bouton hamburger pour mobile avec span pour un meilleur centrage */}
        {!menuOpen && (
          <button 
            className="menu-toggle menu-open-btn" 
            onClick={() => setMenuOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <span style={{ 
              display: 'inline-block', 
              lineHeight: '0.8', 
              marginTop: '-4px' 
            }}>
              ☰
            </span>
          </button>
        )}

        {/* Liste des menus - Menu latéral en mode mobile */}
        <ul className={`nav-menu ${menuOpen ? "open" : ""}`}>
          {/* Bouton de fermeture - en début de liste avec style forcé */}
          <button 
            className="menu-toggle menu-close-btn" 
            onClick={() => setMenuOpen(false)}
            style={{ 
              position: 'fixed',
              top: '20px',
              right: '20px',
              zIndex: 9999,
              backgroundColor: '#ff3333',
              color: 'white',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: '2px solid white',
              fontSize: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 10px rgba(0,0,0,0.8)',
              padding: 0
            }}
          >
            ✕
          </button>
          
          {/* Éléments du menu décalés vers le bas pour laisser de l'espace pour la croix */}
          <div style={{ marginTop: '40px' }}></div>
          
          <li className="nav-item"><Link to="/rmr-m" onClick={() => setMenuOpen(false)}>Accueil</Link></li>
          <li className="nav-item"><Link to="/rmr-m/wallet-connect" onClick={() => setMenuOpen(false)}>Connexion Wallet</Link></li>
          <li className="nav-item"><Link to="/rmr-m/dashboard" onClick={() => setMenuOpen(false)}>Tableau de bord</Link></li>
          <li className="nav-item"><Link to="/rmr-m/nft" onClick={() => setMenuOpen(false)}>Achat de NFT</Link></li>
          <li className="nav-item"><Link to="/rmr-m/affiliation" onClick={() => setMenuOpen(false)}>Programme d'affiliation</Link></li>
          <li className="nav-item"><Link to="/rmr-m/historique" onClick={() => setMenuOpen(false)}>Historique des investissements</Link></li>
          <li className="nav-item"><Link to="/rmr-m/contact" onClick={() => setMenuOpen(false)}>Contact</Link></li>
          <li className="nav-item"><Link to="/rmr-m/a-propos" onClick={() => setMenuOpen(false)}>À propos</Link></li>
        </ul>
        
        {/* Bouton de fermeture supplémentaire en dehors du menu pour garantir sa visibilité */}
        {menuOpen && (
          <button 
            onClick={() => setMenuOpen(false)}
            style={{ 
              position: 'fixed',
              top: '20px',
              right: '20px',
              zIndex: 10000,
              backgroundColor: '#ff3333',
              color: 'white',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: '2px solid white',
              fontSize: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 10px rgba(0,0,0,0.8)',
              padding: 0
            }}
          >
            ✕
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;