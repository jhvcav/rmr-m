import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useNavigate } from "react-router-dom"; // Importez useNavigate
import "./LPFarming.css"; // Tes styles CSS

const LPFarming = () => {
  const navigate = useNavigate(); // Initialisez useNavigate
  const [capital, setCapital] = useState(250);
  const [duration, setDuration] = useState(1);
  const [profit, setProfit] = useState(0);
  const [loading, setLoading] = useState(false);
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);

  // Style de décalage vers la droite - ajustez la valeur selon vos besoins
  const containerStyle = {
    position: 'relative',
    left: '780px'
  };

  // Détection automatique du wallet (MetaMask ou autres)
  useEffect(() => {
    if (window.ethereum) {
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(web3Provider);

      // Demande de connexion avec MetaMask
      web3Provider.send("eth_requestAccounts", []).then((accounts) => {
        setAccount(accounts[0]);
        console.log("Wallet connecté :", accounts[0]);
      });
    } else {
      alert("Aucun wallet compatible détecté !");
    }
  }, []);

  useEffect(() => {
    if (provider) {
      // Adresse du contrat BSC
      const contractAddress = "0xbc3F488c5A9a7909aE07802c2b9002Efaa7EdB9F"; // Adresse de ton contrat déployé

      // ABI du contrat
      const contractAbi = [
        "function totalInvestment() public view returns (uint256)",
        "function deposit() public payable",
        "function withdraw(uint256 amount) public",
        "function distributeInterest() public",
        // Ajoute d'autres fonctions selon les besoins
      ];

      const contractInstance = new ethers.Contract(contractAddress, contractAbi, provider.getSigner());
      setContract(contractInstance);

      // Obtenir le solde du contrat
      contractInstance.totalInvestment().then((balance) => {
        console.log("Solde du contrat :", ethers.utils.formatEther(balance));
      });
    }
  }, [provider]);

  // Calcul des gains
  const calculateProfit = () => {
    const monthlyRate = 0.10; // Par exemple 10% par mois
    const totalProfit = capital * Math.pow(1 + monthlyRate, duration) - capital;
    setProfit(totalProfit.toFixed(2));
  };

  // Fonction pour transférer vers le formulaire de dépôt
  const goToDepotForm = () => {
    // Calculer les frais (par exemple, 2% du capital)
    const frais = capital * 0.02;
    
    // Calculer le rendement estimé si ce n'est pas déjà fait
    if (profit === 0) {
      calculateProfit();
    }
    
    // Convertir la durée de mois en jours pour la cohérence avec DepotForm
    const dureeJours = duration * 30;
    
    // Adresse du pool (utiliser l'adresse du contrat si disponible)
    const poolAddress = contract ? contract.address : "0xbc3F488c5A9a7909aE07802c2b9002Efaa7EdB9F";
    
    // Navigation vers le formulaire de dépôt avec les données de la simulation
    navigate("/rmr-m/depot-form", {
      state: {
        montant: capital,
        adressePool: poolAddress,
        duree: dureeJours,
        rendementEstime: parseFloat(profit),
        frais: frais
      }
    });
  };

  // Fonction pour effectuer un investissement
  const handleInvest = async () => {
    if (!account) {
      alert("Veuillez connecter votre wallet avant d'investir !");
      return;
    }

    try {
      setLoading(true);
      
      // Au lieu d'interagir directement avec le contrat, 
      // naviguer vers la page DepotForm
      goToDepotForm();
      
    } catch (error) {
      console.error("Erreur:", error);
      alert("❌ Erreur lors de l'investissement !");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lp-container" style={containerStyle}>
      <h1>LP Farming - Génération de Rendement</h1>
      <p>
        <b>Liquidity Provider (LP) Farming</b> vous permet d'investir des fonds dans des pools de liquidités et d'obtenir un rendement stable de
        <b> 10% par mois</b>. Grâce à l'optimisation automatique, votre capital est réinvesti pour maximiser les gains.
      </p>

      {/* Connexion au Wallet */}
      <div className="wallet-connection">
        <h3>Connexion au Wallet</h3>
        {account ? (
          <button className="wallet-button btn btn-success">
            ✅ {account.substring(0, 6)}...{account.slice(-4)}
          </button>
        ) : (
          <button className="wallet-button btn btn-primary" onClick={handleInvest}>
            Connecter mon Wallet MetaMask
          </button>
        )}
      </div>

      {/* Simulateur de Gains */}
      <h2>Simulateur de Gains</h2>
      <div className="simulator">
        <label>Capital à investir ($) :</label>
        <input
          type="number"
          min="250"
          value={capital}
          onChange={(e) => setCapital(Number(e.target.value))}
        />

        <label>Durée (mois) :</label>
        <input
          type="number"
          min="1"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
        />

        <button onClick={calculateProfit}>Calculer</button>
        <h3>Gains estimés : <span>${profit}</span></h3>
      </div>

      {/* Bouton Investir */}
      <button className="validate-btn" onClick={handleInvest} disabled={loading}>
        {loading ? "Transaction en cours..." : "Valider mon choix"}
      </button>
    </div>
  );
};

export default LPFarming;