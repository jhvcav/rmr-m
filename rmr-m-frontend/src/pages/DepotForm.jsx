import { useEffect, useState } from "react";
import Web3Modal from "web3modal";
import { ethers } from "ethers";
import "./DepotForm.css"; // Conserve la mise en page originale

const DepotForm = () => {
  const [amount, setAmount] = useState(0.05); // Montant par défaut 0.05 BNB
  const [destinationAddress, setDestinationAddress] = useState("");
  const [status, setStatus] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [publicKey, setPublicKey] = useState(null);
  const [balance, setBalance] = useState(null);

  const [web3Modal, setWeb3Modal] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);

  // URL RPC privé pour BSC Testnet
  const RPC_PRIVATE_URL = "https://hidden-lingering-putty.bsc-testnet.quiknode.pro/2a3d280c36b92efa575cf529eb48de2999ccf7f8/";

  // Initialisation de Web3Modal
  useEffect(() => {
    const modal = new Web3Modal({
      cacheProvider: true,
      providerOptions: {
        metamask: {
          display: {
            name: "MetaMask",
            description: "Connectez MetaMask",
          },
          package: null,
        },
        walletconnect: {
          package: require("@walletconnect/web3-provider"),
          options: {
            infuraId: "INFURA_PROJECT_ID", // Remplacez avec votre ID Infura si nécessaire
          },
        },
      },
    });
    setWeb3Modal(modal);
  }, []);

  // Connexion à MetaMask ou Trust Wallet
  const handleConnect = async () => {
    const modalProvider = await web3Modal.connect();
    const newProvider = new ethers.providers.Web3Provider(modalProvider);
    const newSigner = newProvider.getSigner();

    setProvider(newProvider);
    setSigner(newSigner);

    const account = await newSigner.getAddress();
    setPublicKey(account);
    setIsConnected(true);

    const balanceWei = await newProvider.getBalance(account);
    const balanceInBNB = ethers.utils.formatEther(balanceWei);
    setBalance(balanceInBNB);
  };

  // Fonction pour effectuer un dépôt
  const handleDepot = async () => {
    if (!isConnected) {
      setStatus("⚠️ Veuillez vous connecter à MetaMask.");
      return;
    }

    if (!destinationAddress) {
      setStatus("⚠️ Veuillez entrer une adresse de destination.");
      return;
    }

    if (amount <= 0 || isNaN(amount)) {
      setStatus("⚠️ Montant invalide.");
      return;
    }

    try {
      const tx = {
        to: destinationAddress,
        value: ethers.utils.parseEther(amount.toString()), // Convertir le montant en wei
      };

      const txResponse = await signer.sendTransaction(tx);
      setStatus(`✅ Transaction envoyée avec succès ! ID : ${txResponse.hash}`);
      console.log("Transaction envoyée :", txResponse.hash);
    } catch (error) {
      console.error("❌ Erreur lors du dépôt de fonds :", error);
      setStatus("❌ Une erreur est survenue lors de la transaction.");
    }
  };

  return (
    <div className="depot-form">
      <h1 style={{ fontSize: "1.5em" }}>💰 Dépôt de fonds</h1>

      {/* État du Wallet */}
      <div className="wallet-status">
        {isConnected ? (
          <>
            <p>✅ Connecté avec l'adresse :</p>
            <p className="wallet-address">{publicKey}</p>
            <p>💰 Solde disponible : <strong>{balance} BNB</strong></p>
          </>
        ) : (
          <p>⚠️ Non connecté.</p>
        )}
        <button onClick={handleConnect} disabled={isConnected}>
          {isConnected ? "✅ Déjà connecté" : "🔗 Se connecter à MetaMask"}
        </button>
      </div>

      {/* Adresse de destination */}
      <div className="input-container">
        <label>🔹 Adresse de destination :</label>
        <input
          type="text"
          value={destinationAddress}
          onChange={(e) => setDestinationAddress(e.target.value)}
          placeholder="Entrez l'adresse BSC"
        />
      </div>

      {/* Montant */}
      <div className="input-container">
        <label>💸 Montant (en BNB) :</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Entrez le montant"
          min="0.0001"
          step="0.0001"
        />
      </div>

      {/* Bouton d'envoi */}
      <button onClick={handleDepot} disabled={!isConnected}>
        🚀 Envoyer {amount} BNB
      </button>

      {/* Message de statut */}
      <p className="status">{status}</p>
    </div>
  );
};

export default DepotForm;