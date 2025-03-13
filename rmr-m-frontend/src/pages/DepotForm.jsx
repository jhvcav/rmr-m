import { useEffect, useState } from "react";
import { ethers } from "ethers";
import "./DepotForm.css"; // Conserve la mise en page originale

const DepotForm = () => {
  const [amount, setAmount] = useState(0.05); // Montant par défaut 0.05 SOL
  const [destinationAddress, setDestinationAddress] = useState("");
  const [status, setStatus] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [publicKey, setPublicKey] = useState(null);
  const [balance, setBalance] = useState(null);

  // URL RPC privé - Remplacer par votre RPC privé BSC
  const RPC_PRIVATE_URL = "https://hidden-lingering-putty.bsc-testnet.quiknode.pro/2a3d280c36b92efa575cf529eb48de2999ccf7f8/"; // RPC privé testnet BSC

  // Vérifier si MetaMask est disponible
  useEffect(() => {
    if (window.ethereum) {
      console.log("MetaMask détecté !");
    } else {
      console.log("MetaMask n'est pas détecté.");
    }
  }, []);

  // Connexion à MetaMask
  const handleConnect = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.providers.JsonRpcProvider(RPC_PRIVATE_URL); // Connexion avec RPC privé
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        const account = accounts[0];
        setPublicKey(account);
        setIsConnected(true);

        // Récupérer le solde en BNB
        const balanceInWei = await provider.getBalance(account);
        const balanceInBNB = ethers.utils.formatEther(balanceInWei); // Convertit le solde de wei à BNB
        setBalance(balanceInBNB);
        console.log("🔹 Solde BNB:", balanceInBNB);
      } catch (error) {
        console.error("Erreur de connexion à MetaMask :", error);
        setStatus("❌ Erreur lors de la connexion à MetaMask.");
      }
    } else {
      setStatus("❌ MetaMask n'est pas détecté.");
    }
  };

  // Fonction pour effectuer un dépôt (sans altérer la mise en page)
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

    // Utiliser le provider RPC pour envoyer une transaction
    try {
      setStatus("🔹 Début de la transaction...");
      const provider = new ethers.providers.JsonRpcProvider(RPC_PRIVATE_URL); // Connexion avec RPC privé
      const signer = provider.getSigner();
      const tx = {
        to: destinationAddress,
        value: ethers.utils.parseEther(amount.toString()), // Convertir le montant en wei
      };

      // Envoyer la transaction
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