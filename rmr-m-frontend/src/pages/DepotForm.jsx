import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import './DepotForm.css';

const DepotForm = () => {
    const [amount, setAmount] = useState(0.05); // Montant par défaut 0.05 BNB
    const [destinationAddress, setDestinationAddress] = useState("");
    const [status, setStatus] = useState("");
    const [isConnected, setIsConnected] = useState(false);
    const [publicKey, setPublicKey] = useState(null);
    const [balance, setBalance] = useState(null);
    const [provider, setProvider] = useState(null);

    // Vérifier la connexion au wallet (MetaMask)
    useEffect(() => {
        if (window.ethereum) {
            const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
            setProvider(web3Provider);
            checkWalletConnection(web3Provider);
        } else {
            alert("Veuillez installer MetaMask.");
        }
    }, []);

    // Fonction pour vérifier la connexion du wallet
    const checkWalletConnection = async (provider) => {
        try {
            const accounts = await provider.listAccounts();
            if (accounts.length > 0) {
                setPublicKey(accounts[0]);
                setIsConnected(true);
                fetchBalance(accounts[0], provider);
            } else {
                setIsConnected(false);
                setPublicKey(null);
                setBalance(null);
            }
        } catch (error) {
            console.error("Erreur lors de la connexion :", error);
        }
    };

    // Récupérer le solde du wallet
    const fetchBalance = async (account, provider) => {
        if (account) {
            try {
                const balance = await provider.getBalance(account);
                setBalance(ethers.utils.formatEther(balance)); // Conversion en BNB
            } catch (error) {
                console.error("Erreur lors de la récupération du solde:", error);
                setBalance(null);
            }
        }
    };

    // Connexion au wallet
    const handleConnect = async () => {
        if (window.ethereum) {
            try {
                await window.ethereum.request({ method: "eth_requestAccounts" });
                const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
                setProvider(web3Provider);
                checkWalletConnection(web3Provider);
            } catch (error) {
                console.error("Erreur lors de la connexion au wallet :", error);
            }
        } else {
            alert("Veuillez installer MetaMask.");
        }
    };

    // Fonction pour effectuer le dépôt de BNB
    const handleDepot = async () => {
        if (!isConnected) {
            setStatus("⚠️ Veuillez vous connecter à MetaMask.");
            return;
        }

        if (!ethers.utils.isAddress(destinationAddress)) {
            setStatus("⚠️ Adresse de destination invalide.");
            return;
        }

        if (amount <= 0 || isNaN(amount)) {
            setStatus("⚠️ Veuillez entrer un montant valide.");
            return;
        }

        if (parseFloat(balance) < amount) {
            setStatus("⚠️ Fonds insuffisants pour effectuer la transaction.");
            return;
        }

        try {
            setStatus("🔹 Début de la transaction...");

            const signer = provider.getSigner();
            const transaction = {
                to: destinationAddress,
                value: ethers.utils.parseEther(amount.toString()), // Convertir le montant en Wei
            };

            // Envoyer la transaction
            const txResponse = await signer.sendTransaction(transaction);
            setStatus(`✅ Transaction envoyée avec succès ! ID : ${txResponse.hash}`);

            // Attendre la confirmation de la transaction
            await txResponse.wait();
            setStatus("✅ Transaction confirmée avec succès !");
            fetchBalance(publicKey, provider); // Mettre à jour le solde après la transaction
        } catch (error) {
            console.error("❌ Erreur lors du dépôt de fonds :", error);
            setStatus(`❌ Une erreur est survenue : ${error.message}`);
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