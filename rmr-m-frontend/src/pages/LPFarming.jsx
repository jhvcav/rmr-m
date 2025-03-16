import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useNavigate } from "react-router-dom";
import "./LPFarming.css";
import "./ResponsiveStyles.css"; // Import des styles responsifs

// ABI minimal pour un contrat ERC-20
const ERC20_ABI = [
  // Récupérer le solde
  "function balanceOf(address owner) view returns (uint256)",
  // Récupérer le nombre de décimales
  "function decimals() view returns (uint8)",
  // Récupérer le symbole
  "function symbol() view returns (string)",
];

// Adresse du contrat USDC sur BSC Testnet
const USDC_CONTRACT_ADDRESS = "0xb48249Ef5b895d6e7AD398186DF2B0c3Cec2BF94";

const LPFarming = () => {
  const navigate = useNavigate();
  const [capital, setCapital] = useState(250);
  const [duration, setDuration] = useState(1);
  const [profit, setProfit] = useState(0);
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

  // Détection automatique du wallet (MetaMask ou autres)
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
      const contractAddress = "0xbc3F488c5A9a7909aE07802c2b9002Efaa7EdB9F";

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

  // Calcul des gains
  const calculateProfit = () => {
    const monthlyRate = 0.10; // Par exemple 10% par mois
    const totalProfit = capital * Math.pow(1 + monthlyRate, duration) - capital;
    setProfit(totalProfit.toFixed(2));
  };

  // Connexion au wallet
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Veuillez installer MetaMask ou un wallet compatible !");
      return;
    }

    try {
      // Basculer vers BSC Testnet
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x61" }], // Chaîne BSC Testnet (97 en décimal)
        });
      } catch (switchError) {
        // Si le réseau n'existe pas, l'ajouter
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: "0x61",
                  chainName: "BSC Testnet",
                  nativeCurrency: {
                    name: "BNB",
                    symbol: "BNB",
                    decimals: 18,
                  },
                  rpcUrls: ["https://data-seed-prebsc-1-s1.binance.org:8545/"],
                  blockExplorerUrls: ["https://testnet.bscscan.com/"],
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
      connectWallet();
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
    <div className="lp-container responsive-container">
      <h1>LP Farming - Génération de Rendement</h1>
      <p>
        <b>Liquidity Provider (LP) Farming</b> vous permet d'investir des fonds dans des pools de liquidités et d'obtenir un rendement stable de
        <b> 10% par mois</b>. Grâce à l'optimisation automatique, votre capital est réinvesti pour maximiser les gains.
      </p>

      {/* Connexion au Wallet */}
      <div className="wallet-connection responsive-card">
        <h3>Connexion au Wallet</h3>
        {account ? (
          <div>
            <button className="wallet-button btn btn-success responsive-button">
              ✅ {account.substring(0, 6)}...{account.slice(-4)}
            </button>
            {usdcBalance !== null && (
              <div className="balance-info">
                <p>Solde {usdcSymbol}: <strong>{parseFloat(usdcBalance).toFixed(2)} {usdcSymbol}</strong></p>
              </div>
            )}
          </div>
        ) : (
          <button className="wallet-button btn btn-primary responsive-button" onClick={connectWallet}>
            Connecter mon Wallet MetaMask
          </button>
        )}
      </div>

      {/* Simulateur de Gains */}
      <h2>Simulateur de Gains en {usdcSymbol}</h2>
      <div className="simulator responsive-card">
        <label>Capital à investir ({usdcSymbol}) :</label>
        <input
          type="number"
          min="1"
          value={capital}
          onChange={(e) => setCapital(Number(e.target.value))}
          className="responsive-form"
        />

        <label>Durée (mois) :</label>
        <input
          type="number"
          min="1"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          className="responsive-form"
        />

        <button onClick={calculateProfit} className="responsive-button">Calculer</button>
        <h3>Gains estimés : <span>{profit} {usdcSymbol}</span></h3>
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
      <div className="usdc-info responsive-card" style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
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