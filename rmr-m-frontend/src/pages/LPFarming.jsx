import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./LPFarming.css"; // Tes styles CSS

const LPFarming = () => {
  const [capital, setCapital] = useState(250);
  const [duration, setDuration] = useState(1);
  const [profit, setProfit] = useState(0);
  const [loading, setLoading] = useState(false);
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);

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

  // Fonction pour effectuer un investissement
  const handleInvest = async () => {
    if (!account) {
      alert("Veuillez connecter votre wallet avant d'investir !");
      return;
    }

    if (!contract) {
      alert("Le contrat n'est pas chargé correctement !");
      return;
    }

    // Conversion de l'investissement en wei (unités de BNB)
    const valueInWei = ethers.utils.parseEther(capital.toString());

    try {
      setLoading(true);
      const tx = await contract.deposit({ value: valueInWei });
      await tx.wait(); // Attendre que la transaction soit confirmée
      alert("✅ Transaction réussie !");
    } catch (error) {
      console.error("Erreur transaction :", error);
      alert("❌ Erreur lors de l'investissement !");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lp-container">
      <h1>LP Farming - Génération de Rendement</h1>
      <p>
        <b>Liquidity Provider (LP) Farming</b> vous permet d’investir des fonds dans des pools de liquidités et d'obtenir un rendement stable de
        <b> 10% par mois</b>. Grâce à l’optimisation automatique, votre capital est réinvesti pour maximiser les gains.
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