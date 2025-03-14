import { useEffect, useState } from "react";
import { ethers } from "ethers";
import Web3Modal from "web3modal";
import "./DepotForm.css"; // Conserve la mise en page originale

const DepotForm = () => {
  const [amount, setAmount] = useState(0.05); // Montant par défaut 0.05 BNB
  const [destinationAddress, setDestinationAddress] = useState("");
  const [status, setStatus] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [publicKey, setPublicKey] = useState(null);
  const [balance, setBalance] = useState(null);
  const [provider, setProvider] = useState(null); // Initialisation correcte du provider
  const [signer, setSigner] = useState(null); // Initialisation du signer

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
      },
    });
    setWeb3Modal(modal);
  }, []);

  // Connexion à MetaMask
  const handleConnect = async () => {
    try {
      // Demander à l'utilisateur de se connecter à MetaMask
      const modalProvider = await web3Modal.connect();
      const newProvider = new ethers.providers.Web3Provider(modalProvider); // Utilisation de Web3Provider
      const newSigner = newProvider.getSigner();

      setProvider(newProvider);
      setSigner(newSigner);

      const account = await newSigner.getAddress();
      setPublicKey(account);
      setIsConnected(true);

      // Récupérer le solde BNB du wallet connecté
      const balanceWei = await newProvider.getBalance(account);
      const balanceInBNB = ethers.utils.formatEther(balanceWei);
      setBalance(balanceInBNB);

      alert(`Solde BNB récupéré avec succès : ${balanceInBNB} BNB`); // Affichage du solde BNB

    } catch (error) {
      setStatus("❌ Erreur lors de la connexion à MetaMask.");
      alert("Erreur lors de la connexion à MetaMask : " + error.message); // Affichage de l'erreur
    }
  };

  // Fonction pour effectuer un dépôt
  const handleDepot = async () => {
    if (!isConnected) {
      setStatus("⚠️ Veuillez vous connecter à MetaMask.");
      alert("Veuillez vous connecter à MetaMask."); // Affichage de l'erreur
      return;
    }

    if (!destinationAddress) {
      setStatus("⚠️ Veuillez entrer une adresse de destination.");
      alert("Veuillez entrer une adresse de destination."); // Affichage de l'erreur
      return;
    }

    if (amount <= 0 || isNaN(amount)) {
      setStatus("⚠️ Montant invalide.");
      alert("Veuillez entrer un montant valide."); // Affichage de l'erreur
      return;
    }

    try {
      const tx = {
        to: destinationAddress,
        value: ethers.utils.parseEther(amount.toString()), // Convertir le montant en wei
      };

      const txResponse = await signer.sendTransaction(tx);
      setStatus(`✅ Transaction envoyée avec succès ! ID : ${txResponse.hash}`);
      alert(`Transaction envoyée avec succès : ${txResponse.hash}`); // Affichage de la réussite de la transaction
    } catch (error) {
      setStatus("❌ Une erreur est survenue lors de la transaction.");
      alert("Erreur lors de la transaction : " + error.message); // Affichage de l'erreur
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