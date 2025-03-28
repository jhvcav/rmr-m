import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useNavigate } from "react-router-dom";
import "./LPFarming.css";

// ABI minimal pour un contrat ERC-20
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
];

// Adresse du contrat USDC sur BSC Testnet
const USDC_CONTRACT_ADDRESS = "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d";

// Périodes et APR associés selon le contrat
const PERIODS = [
  { days: 30, apr: 8, label: "30 jours (8% APR)" },
  { days: 90, apr: 12, label: "90 jours (12% APR)" },
  { days: 180, apr: 15, label: "180 jours (15% APR)" }
];

const LPFarming = () => {
  const navigate = useNavigate();
  const [capital, setCapital] = useState(250);
  const [selectedPeriod, setSelectedPeriod] = useState(PERIODS[0]);
  const [dailyReturn, setDailyReturn] = useState(0);
  const [monthlyReturn, setMonthlyReturn] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [loading, setLoading] = useState(false);
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [usdcBalance, setUsdcBalance] = useState(null);
  const [usdcDecimals, setUsdcDecimals] = useState(18);
  const [usdcSymbol, setUsdcSymbol] = useState("USDC");

  // Fonction pour créer un provider compatible avec plusieurs versions d'ethers
  const getProvider = () => {
    if (!window.ethereum) return null;
    
    // Pour ethers v5
    if (ethers.providers && ethers.providers.Web3Provider) {
      return new ethers.providers.Web3Provider(window.ethereum);
    }
    
    // Pour ethers v6
    if (ethers.BrowserProvider) {
      return new ethers.BrowserProvider(window.ethereum);
    }
    
    throw new Error("Version d'ethers non supportée");
  };

  // Détection automatique du wallet
  useEffect(() => {
    if (window.ethereum) {
      const web3Provider = getProvider();
      setProvider(web3Provider);

      // Vérifier si déjà connecté
      web3Provider.listAccounts().then((accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          console.log("Wallet déjà connecté :", accounts[0]);
          updateUsdcBalance(accounts[0], web3Provider);
        }
      });

      // Écouter les changements de compte
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          updateUsdcBalance(accounts[0], web3Provider);
        } else {
          setAccount(null);
          setUsdcBalance(null);
        }
      });

      // Écouter les changements de réseau
      window.ethereum.on('chainChanged', (_chainId) => {
        window.location.reload();
      });
    } else {
      console.log("Aucun wallet compatible détecté !");
    }

    // Nettoyer les écouteurs lors du démontage du composant
    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, []);

  // Mettre à jour le solde USDC
  const updateUsdcBalance = async (address, web3Provider) => {
    try {
      const usdcContract = new ethers.Contract(USDC_CONTRACT_ADDRESS, ERC20_ABI, web3Provider);
      
      // Récupérer le symbole
      try {
        const symbol = await usdcContract.symbol();
        setUsdcSymbol(symbol);
      } catch (error) {
        console.error("Erreur lors de la récupération du symbole:", error);
      }
      
      // Récupérer le nombre de décimales
      try {
        const decimals = await usdcContract.decimals();
        setUsdcDecimals(decimals);
        console.log(`${usdcSymbol} a ${decimals} décimales`);
      } catch (error) {
        console.error("Erreur lors de la récupération des décimales:", error);
      }
      
      // Récupérer le solde USDC
      const balance = await usdcContract.balanceOf(address);
      const formattedBalance = ethers.utils.formatUnits(balance, usdcDecimals);
      setUsdcBalance(formattedBalance);
      console.log(`Solde ${usdcSymbol}: ${formattedBalance}`);
    } catch (error) {
      console.error("Erreur lors de la mise à jour du solde USDC:", error);
    }
  };

  useEffect(() => {
    if (provider && account) {
      // Adresse du contrat BSC
      const contractAddress = "0xeaD8c08aD5EaA23ebD2EC965725e260307e8f654"; // Adresse du LPFarming

      // ABI du contrat
      const contractAbi = [
        "function totalInvestment() public view returns (uint256)",
        "function deposit() public payable",
        "function withdraw(uint256 amount) public",
        "function distributeInterest() public",
      ];

      const contractInstance = new ethers.Contract(contractAddress, contractAbi, provider.getSigner());
      setContract(contractInstance);

      // Obtenir le solde du contrat
      contractInstance.totalInvestment().then((balance) => {
        console.log("Solde du contrat :", ethers.utils.formatEther(balance));
      });
    }
  }, [provider, account]);

  // Calcul des gains basé sur l'APR défini dans le contrat
  const calculateReturns = () => {
    // Calculer le taux journalier (APR divisé par 36500 pour obtenir le taux journalier)
    const dailyRate = selectedPeriod.apr / 36500; // APR divisé par 365 jours * 100 (car APR est en %)
    
    // Rendement journalier
    const dailyProfit = capital * dailyRate;
    setDailyReturn(dailyProfit.toFixed(2));
    
    // Rendement mensuel (approximativement 30 jours)
    const monthlyProfit = capital * dailyRate * 30;
    setMonthlyReturn(monthlyProfit.toFixed(2));
    
    // Profit total sur la période complète
    const totalPeriodProfit = capital * (selectedPeriod.apr / 100) * (selectedPeriod.days / 365);
    setTotalProfit(totalPeriodProfit.toFixed(2));
  };

  // Connexion au wallet
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Veuillez installer MetaMask ou un wallet compatible !");
      return;
    }

    try {
      // Basculer vers BSC Mainnet
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x38" }], // Chaîne BSC Mainnet (56 en décimal)
        });
      } catch (switchError) {
        // Si le réseau n'existe pas, l'ajouter
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: "0x38",
                  chainName: "Binance Smart Chain",
                  nativeCurrency: {
                    name: "BNB",
                    symbol: "BNB",
                    decimals: 18,
                  },
                  rpcUrls: ["https://bsc-dataseed1.binance.org"],
                  blockExplorerUrls: ["https://bscscan.com/"],
                },
              ],
            });
          } catch (addError) {
            console.error("Erreur lors de l'ajout du réseau:", addError);
          }
        } else {
          console.error("Erreur lors du changement de réseau:", switchError);
        }
      }

      // Demande d'accès au compte
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setAccount(accounts[0]);
      
      // Mettre à jour le provider après la connexion
      const web3Provider = getProvider();
      setProvider(web3Provider);
      
      // Mettre à jour le solde USDC
      updateUsdcBalance(accounts[0], web3Provider);
      
      console.log("Wallet connecté:", accounts[0]);
    } catch (error) {
      console.error("Erreur de connexion au wallet:", error);
    }
  };

  // Fonction pour transférer vers le formulaire de dépôt
  const goToDepotForm = () => {
    // Calculer les frais (2% du capital)
    const frais = capital * 0.02;
    
    // Adresse du pool
    const poolAddress = contract ? contract.address : "0xeaD8c08aD5EaA23ebD2EC965725e260307e8f654";
    
    // Navigation vers le formulaire de dépôt
    navigate("/rmr-m/depot-form", {
      state: {
        montant: capital,
        adressePool: poolAddress,
        duree: selectedPeriod.days,
        rendementEstime: parseFloat(totalProfit),
        frais: frais
      }
    });
  };

  // Fonction pour effectuer un investissement
  const handleInvest = async () => {
    if (!account) {
      connectWallet();
      return;
    }

    try {
      setLoading(true);
      goToDepotForm();
    } catch (error) {
      console.error("Erreur:", error);
      alert("❌ Erreur lors de l'investissement !");
    } finally {
      setLoading(false);
    }
  };

  // Gérer le changement de période
  const handlePeriodChange = (e) => {
    const selectedDays = parseInt(e.target.value);
    const selectedPeriodObj = PERIODS.find(period => period.days === selectedDays);
    setSelectedPeriod(selectedPeriodObj);
  };

  return (
    <div className="lp-container">
      <h1>LP Farming - Génération de Rendement</h1>
      
      <div className="responsive-card">
        <p>
          <b>Liquidity Provider (LP) Farming</b> vous permet d'investir des fonds dans des pools de liquidités et d'obtenir un rendement stable selon la durée d'immobilisation choisie. Grâce à l'optimisation automatique, votre capital est géré pour maximiser les gains.
        </p>
      </div>

      {/* Connexion au Wallet */}
      <div className="responsive-card">
        <h3>Connexion au Wallet</h3>
        {account ? (
          <div className="wallet-info">
            <button className="wallet-button btn btn-success">
              ✅ {account.substring(0, 6)}...{account.slice(-4)}
            </button>
            {usdcBalance !== null && (
              <div className="balance-info">
                <p>Solde {usdcSymbol}: <strong>{parseFloat(usdcBalance).toFixed(2)} {usdcSymbol}</strong></p>
              </div>
            )}
          </div>
        ) : (
          <button className="wallet-button btn btn-primary" onClick={connectWallet}>
            Connecter mon Wallet MetaMask
          </button>
        )}
      </div>

      {/* Simulateur de Gains */}
      <h2>Simulateur de Gains en {usdcSymbol}</h2>
      <div className="responsive-card">
        <div className="simulator">
          <label>Capital à investir ({usdcSymbol}) :</label>
          <input
            type="number"
            min="1"
            value={capital}
            onChange={(e) => setCapital(Number(e.target.value))}
            className="responsive-form"
          />

          <label>Durée d'immobilisation :</label>
          <select
            value={selectedPeriod.days}
            onChange={handlePeriodChange}
            className="responsive-form"
          >
            {PERIODS.map((period) => (
              <option key={period.days} value={period.days}>
                {period.label}
              </option>
            ))}
          </select>

          <button 
            onClick={calculateReturns} 
            className="responsive-button btn btn-primary"
          >
            Calculer
          </button>
          
          <div className="returns-summary">
            <h3>Rendement journalier : <span>{dailyReturn} {usdcSymbol}</span></h3>
            <h3>Rendement mensuel : <span>{monthlyReturn} {usdcSymbol}</span></h3>
            <h3>Gain total estimé sur {selectedPeriod.days} jours : <span>{totalProfit} {usdcSymbol}</span></h3>
          </div>
        </div>
      </div>

      {/* Bouton Investir */}
      <button 
        className="validate-btn responsive-button" 
        onClick={handleInvest} 
        disabled={loading}
      >
        {loading ? "Transaction en cours..." : "Valider mon choix"}
      </button>

      {/* Information sur USDC */}
      <div className="responsive-card">
        <h3>ℹ️ Informations sur les {usdcSymbol}</h3>
        <p>
          Pour utiliser ce service, vous avez besoin de {usdcSymbol} sur le réseau BSC Testnet.
          Assurez-vous également d'avoir un peu de BNB pour payer les frais de transaction.
        </p>
        <p>
          Montant minimum recommandé : 1 {usdcSymbol}<br />
          Pour des rendements optimaux : 250 {usdcSymbol} ou plus
        </p>
      </div>
    </div>
  );
};

export default LPFarming;