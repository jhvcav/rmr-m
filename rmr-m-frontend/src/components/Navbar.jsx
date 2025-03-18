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
  
  // Fermer le menu en cas de redimensionnement de la fenêtre
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && menuOpen) {
        setMenuOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Nettoyer l'écouteur d'événement lors du démontage
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [menuOpen]);
  
  // Empêcher le défilement du body lorsque le menu est ouvert
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    // Nettoyer lors du démontage
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [menuOpen]);

  return (
    <nav className="navbar">
      <div className="container">
        {/* Bouton hamburger pour mobile (visible uniquement quand le menu est fermé) */}
        <button 
          className={`menu-toggle menu-open-btn ${menuOpen ? 'hidden' : ''}`} 
          onClick={() => setMenuOpen(true)}
          aria-label="Ouvrir le menu"
        >
          ☰
        </button>

        {/* Liste des menus - Menu latéral en mode mobile */}
        <ul className={`nav-menu ${menuOpen ? "open" : ""}`}>
          {/* Bouton de fermeture - toujours présent dans le DOM mais affiché conditionnellement */}
          <button 
            className="menu-toggle menu-close-btn" 
            onClick={() => setMenuOpen(false)}
            style={{ display: menuOpen ? 'block' : 'none' }}
            aria-label="Fermer le menu"
          >
            ✖
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
        
        {/* Fond sombre pour fermer le menu en cliquant à l'extérieur (mobile uniquement) */}
        {menuOpen && (
          <div 
            className="menu-overlay" 
            onClick={() => setMenuOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.3)',
              zIndex: 500
            }}
          />
        )}
      </div>
    </nav>
  );
};

export default Navbar;