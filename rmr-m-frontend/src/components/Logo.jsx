/**
 * Copyright (c) 2025 Jean Hugues CAVALIE
 * Tous droits réservés.
 * Ce code ne peut pas être utilisé ou redistribué sans autorisation.
 */

import React from "react";
import { Link } from "react-router-dom";
import "./Logo.css";

// Composant de logo séparé qui peut être placé au-dessus de la navbar
const Logo = () => {
  return (
    <div className="logo-container">
      <Link to="/" className="logo-link">
        {/* Image du logo - commenter cette ligne si vous n'avez pas encore d'image */}
        {/* <img src="/path/to/your/logo.png" alt="RMR-M Logo" className="logo-image" /> */}
        
        {/* Texte du logo */}
        <span className="logo-text">RMR-M</span>
      </Link>
    </div>
  );
};

export default Logo;