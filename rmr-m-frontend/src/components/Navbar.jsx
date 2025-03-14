/**
 * Copyright (c) 2025 Jean Hugues CAVALIE
 * Tous droits réservés.
 * Ce code ne peut pas être utilisé ou redistribué sans autorisation.
 */

import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Navbar.css"; // Assurez-vous d'avoir un fichier CSS

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="container">
        {/* Logo */}
        <Link to="/" className="navbar-brand">RMR-M</Link>

        {/* Bouton hamburger pour mobile (visible uniquement quand le menu est fermé) */}
        {!menuOpen && (
          <button className="menu-toggle menu-open-btn" onClick={() => setMenuOpen(true)}>
            ☰
          </button>
        )}

        {/* Liste des menus - Menu latéral en mode mobile */}
        <ul className={`nav-menu ${menuOpen ? "open" : ""}`}>
          {/* Bouton de fermeture (visible uniquement quand le menu est ouvert) */}
          {menuOpen && (
            <button className="menu-toggle menu-close-btn" onClick={() => setMenuOpen(false)}>
              ✖
            </button>
          )}
          <li className="nav-item"><Link to="/rmr-m" onClick={() => setMenuOpen(false)}>Accueil</Link></li>
          <li className="nav-item"><Link to="/rmr-m/wallet-connect" onClick={() => setMenuOpen(false)}>Connexion Wallet</Link></li>
          <li className="nav-item"><Link to="/rmr-m-m/dashboard" onClick={() => setMenuOpen(false)}>Tableau de bord</Link></li>
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