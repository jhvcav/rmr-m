import React, { useState, useEffect } from 'react';
import { Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import './DepotForm.css';

const DepotForm = () => {
    const [amount, setAmount] = useState(0.05);
    const [destinationAddress, setDestinationAddress] = useState('');
    const [status, setStatus] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [publicKey, setPublicKey] = useState(null);
    const [balance, setBalance] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');

    const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');

    // Vérifier la connexion au wallet
    useEffect(() => {
        checkWalletConnection();

        if (window.solflare) {
            window.solflare.on('connect', () => {
                console.log('✅ Wallet connecté !');
                checkWalletConnection();
            });

            window.solflare.on('disconnect', () => {
                console.log('❌ Wallet déconnecté.');
                setIsConnected(false);
                setPublicKey(null);
                setBalance(null);
            });
        }

        return () => {
            if (window.solflare) {
                window.solflare.off('connect');
                window.solflare.off('disconnect');
            }
        };
    }, []);

    const checkWalletConnection = async () => {
        try {
            if (!window.solflare || !window.solflare.isSolflare) {
                setIsConnected(false);
                setErrorMessage("Solflare non détecté !");
                return;
            }

            if (!window.solflare.isConnected) {
                setIsConnected(false);
                setErrorMessage("Wallet non connecté !");
                return;
            }

            const publicKey = window.solflare.publicKey;
            setIsConnected(true);
            setPublicKey(publicKey.toBase58()); // 🔹 Utiliser toBase58()

            console.log(`✅ Wallet connecté : ${publicKey.toBase58()}`);

            // 🔥 Forcer l'affichage du solde
            fetchBalance(publicKey.toBase58());
        } catch (error) {
            console.error("❌ Erreur lors de la connexion au wallet :", error);
            setErrorMessage("Erreur lors de la connexion au wallet.");
        }
    };

    const fetchBalance = async (walletAddress) => {
        if (!walletAddress) {
            console.error("🚨 fetchBalance : Adresse du wallet non fournie !");
            setBalance(null);
            return;
        }

        try {
            console.log(`🔍 Récupération du solde pour ${walletAddress}`);
            const balanceLamports = await connection.getBalance(new PublicKey(walletAddress));

            console.log(`💰 Balance récupérée (lamports) : ${balanceLamports}`);
            setBalance(balanceLamports / 1_000_000_000); // Convertir en SOL
        } catch (error) {
            console.error("❌ Erreur lors de la récupération du solde :", error);
            setErrorMessage("Impossible de récupérer le solde !");
            setBalance(null);
        }
    };

    useEffect(() => {
        if (isConnected && publicKey) {
            console.log("🔄 Exécution de fetchBalance() après connexion.");
            fetchBalance(publicKey);
        }
    }, [isConnected, publicKey]);

    const handleConnect = async () => {
        if (!window.solflare) {
            alert('Veuillez installer Solflare.');
            return;
        }

        try {
            await window.solflare.connect();
            checkWalletConnection();
        } catch (error) {
            console.error('❌ Erreur lors de la connexion :', error);
            setErrorMessage("Connexion échouée.");
        }
    };

    return (
        <div className="depot-form">
            <h1>💰 Dépôt de fonds sur Solana!</h1>
            <div>
                <h2>État du wallet :</h2>
                {isConnected ? (
                    <>
                        <p>✅ Connecté avec l'adresse : <strong>{publicKey}</strong></p>
                        <p>💰 Solde disponible : <strong>{balance !== null ? balance + " SOL" : "⏳ Chargement..."}</strong></p>
                    </>
                ) : (
                    <p>⚠️ Non connecté.</p>
                )}
                <button onClick={handleConnect} disabled={isConnected}>
                    {isConnected ? '✅ Déjà connecté' : '🔗 Se connecter à Solflare'}
                </button>
            </div>

            <button onClick={() => fetchBalance(publicKey)}>🔄 Mettre à jour le solde</button>

            {/* 🔍 Section Debug */}
            <div className="debug-section">
                <h3>🛠️ Debug Info</h3>
                <p><b>Adresse du wallet connecté :</b> {publicKey || "Non détectée"}</p>
                <p><b>Solde récupéré :</b> {balance !== null ? balance + " SOL" : "Solde non récupéré"}</p>
                <p><b>Erreur :</b> {errorMessage || "Aucune erreur"}</p>
            </div>
        </div>
    );
};

export default DepotForm;