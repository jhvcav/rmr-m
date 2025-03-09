import React from "react";
import { Link } from "react-router-dom";
import "./Navbar.css"; // Assurez-vous d'avoir ce fichier CSS

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="container">
        {/* Logo */}
        <Link to="/" className="navbar-brand">
          RMR-M
        </Link>

        {/* Liste des menus */}
        <ul className="nav-menu">
          <li className="nav-item"><Link to="/">Accueil</Link></li>
          <li className="nav-item"><Link to="/dashboard">Tableau de bord</Link></li>
          <li className="nav-item"><Link to="/nft">Achat de NFT</Link></li>
          <li className="nav-item"><Link to="/affiliation">Programme d'affiliation</Link></li>
          <li className="nav-item"><Link to="/historique">Historique des investissements</Link></li>
          <li className="nav-item"><Link to="/contact">Contact</Link></li>
          <li className="nav-item"><Link to="/a-propos">À propos</Link></li>
        </ul>

        {/* Bouton pour accéder à la connexion Wallet */}
        <Link to="/wallet-connect" className="btn btn-primary">
          Connexion Wallet
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;