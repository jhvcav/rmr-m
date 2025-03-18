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
  
  // Désactiver le défilement quand le menu est ouvert
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [menuOpen]);
  
  // Fermer le menu si la fenêtre est redimensionnée
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && menuOpen) {
        setMenuOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [menuOpen]);

  return (
    <nav className="navbar">
      <div className="container">
        {/* Bouton hamburger */}
        <button 
          className={`menu-toggle menu-open-btn ${menuOpen ? 'hidden' : ''}`} 
          onClick={() => setMenuOpen(true)}
          aria-label="Ouvrir le menu"
        >
          ☰
        </button>

        {/* Menu latéral */}
        <ul className={`nav-menu ${menuOpen ? "open" : ""}`}>
          {/* Bouton de fermeture avec ✕ au lieu de ✖ pour plus de clarté */}
          <button 
            className="menu-toggle menu-close-btn" 
            onClick={() => setMenuOpen(false)}
            aria-label="Fermer le menu"
            style={{
              position: 'fixed', // Position fixe pour s'assurer qu'il reste visible
              display: menuOpen ? 'flex' : 'none',
              alignItems: 'center',
              justifyContent: 'center',
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
        
        {/* Overlay pour fermer le menu en cliquant à l'extérieur */}
        <div 
          className={`menu-overlay ${menuOpen ? 'visible' : ''}`} 
          onClick={() => setMenuOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 995,
            display: menuOpen ? 'block' : 'none'
          }}
        />
      </div>
    </nav>
  );
};

export default Navbar;