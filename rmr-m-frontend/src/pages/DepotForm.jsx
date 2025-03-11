import React, { useState, useEffect } from "react";
import { Connection, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import "./DepotForm.css"; // Assure-toi d'avoir un fichier CSS adapté
import * as web3 from '@solana/web3.js';

const DepotForm = () => {
    const [amount, setAmount] = useState(0.05); // Valeur par défaut 0.05 SOL
    const [destinationAddress, setDestinationAddress] = useState("");
    const [status, setStatus] = useState("");
    const [isConnected, setIsConnected] = useState(false);
    const [publicKey, setPublicKey] = useState(null);
    const [balance, setBalance] = useState(null);

    const connection = new web3.Connection("https://restless-wandering-resonance.solana-mainnet.quiknode.pro/a93a0707e1de0c3c12802f06ea68750872c92beb/");

    // Vérifier la connexion au wallet
    useEffect(() => {
        checkWalletConnection();

        if (window.solflare) {
            window.solflare.on("connect", () => {
                checkWalletConnection();
            });

            window.solflare.on("disconnect", () => {
                setIsConnected(false);
                setPublicKey(null);
                setBalance(null);
            });
        }

        return () => {
            if (window.solflare) {
                window.solflare.off("connect");
                window.solflare.off("disconnect");
            }
        };
    }, []);

    const checkWalletConnection = async () => {
        if (!window.solflare || !window.solflare.isSolflare) {
            setIsConnected(false);
            return;
        }

        if (!window.solflare.isConnected) {
            setIsConnected(false);
            return;
        }

        const publicKey = window.solflare.publicKey;
        setIsConnected(true);
        setPublicKey(publicKey.toString());

        // Récupérer le solde du wallet connecté
        fetchBalance(publicKey);
    };

    const fetchBalance = async () => {
        if (publicKey) {
            try {
                const balance = await connection.getBalance(new PublicKey(publicKey));
                setBalance(balance / 1000000000); // Conversion en SOL
            } catch (error) {
                console.error("Erreur lors de la récupération du solde:", error);
                setBalance(null);
            }
        }
    };

    useEffect(() => {
        if (isConnected && publicKey) {
            fetchBalance(publicKey);
        }
    }, [isConnected, publicKey]);

    const handleConnect = async () => {
        if (!window.solflare) {
            alert("Veuillez installer Solflare.");
            return;
        }

        try {
            await window.solflare.connect();
            checkWalletConnection();
        } catch (error) {
            console.error("Erreur lors de la connexion :", error);
        }
    };

    const handleDepot = async () => {
        if (!isConnected) {
            setStatus("⚠️ Veuillez vous connecter à Solflare.");
            return;
        }
    
        if (!destinationAddress || !PublicKey.isOnCurve(destinationAddress)) {
            setStatus("⚠️ Adresse de destination invalide.");
            return;
        }
    
        if (amount <= 0 || isNaN(amount)) {
            setStatus("⚠️ Veuillez entrer un montant valide.");
            return;
        }
    
        if (balance < amount + 0.000005) { // Vérifie que le solde couvre aussi les frais
            setStatus("⚠️ Fonds insuffisants pour effectuer la transaction.");
            return;
        }
    
        try {
            console.log("🔹 Début de la transaction...");
            console.log("➡️ Destination :", destinationAddress);
            console.log("💸 Montant :", amount, "SOL");
    
            const lamports = Math.round(amount * 1_000_000_000); // Convertir en lamports
    
            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: new PublicKey(publicKey),
                    toPubkey: new PublicKey(destinationAddress),
                    lamports,
                })
            );
    
            console.log("🔹 Génération du blockhash...");
            const { blockhash } = await connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = new PublicKey(publicKey);
    
            console.log("🔹 Signature de la transaction...");
            const signedTransaction = await window.solflare.signTransaction(transaction);
            console.log("🔹 Transaction signée :", signedTransaction);
    
            console.log("🔹 Envoi de la transaction...");
            const signature = await connection.sendRawTransaction(signedTransaction.serialize());
    
            console.log("✅ Transaction envoyée avec succès ! Signature :", signature);
            setStatus(`✅ Transaction envoyée avec succès ! ID : ${signature}`);
    
            await connection.confirmTransaction(signature);
            setStatus("✅ Transaction confirmée avec succès !");
            fetchBalance(publicKey);
        } catch (error) {
            console.error("❌ Erreur lors du dépôt de fonds :", error);
            setStatus(`❌ Une erreur est survenue : ${error.message}`);
        }
    };

    return (
        <div className="depot-form">
            <h1>💰 Dépôt de fonds</h1>

            {/* État du Wallet */}
            <div className="wallet-status">
                {isConnected ? (
                    <>
                        <p>✅ Connecté avec l'adresse : <strong>{publicKey}</strong></p>
                        <p>💰 Solde disponible : <strong>{balance} SOL</strong></p>
                    </>
                ) : (
                    <p>⚠️ Non connecté.</p>
                )}
                <button onClick={handleConnect} disabled={isConnected}>
                    {isConnected ? "✅ Déjà connecté" : "🔗 Se connecter à Solflare"}
                </button>
            </div>

            {/* Champ pour entrer l'adresse de destination */}
            <div className="input-container">
                <label>🔹 Adresse de destination :</label>
                <input
                    type="text"
                    value={destinationAddress}
                    onChange={(e) => setDestinationAddress(e.target.value)}
                    placeholder="Entrez l'adresse Solana"
                />
            </div>

            {/* Champ pour entrer le montant */}
            <div className="input-container">
                <label>💸 Montant (en SOL) :</label>
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Entrez le montant"
                    min="0.0001"
                    step="0.0001"
                />
            </div>

            {/* Bouton pour envoyer la transaction */}
            <button onClick={handleDepot} disabled={!isConnected}>
                🚀 Envoyer {amount} SOL
            </button>

            {/* Message de statut */}
            <p className="status">{status}</p>
        </div>
    );
};

export default DepotForm;