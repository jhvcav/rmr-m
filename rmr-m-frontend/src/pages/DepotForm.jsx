import React, { useState, useEffect } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import './DepotForm.css';

const DepotForm = () => {
    const [publicKey, setPublicKey] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [balance, setBalance] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');

    // Connexion Solana Mainnet
    const connection = new Connection('https://restless-wandering-resonance.solana-mainnet.quiknode.pro/a93a0707e1de0c3c12802f06ea68750872c92beb', 'confirmed');
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

            const walletPublicKey = window.solflare.publicKey.toBase58();
            setIsConnected(true);
            setPublicKey(walletPublicKey);

            console.log(`✅ Wallet connecté : ${walletPublicKey}`);

            // 🔥 Tester la récupération du solde immédiatement après connexion
            fetchBalance(walletPublicKey);
        } catch (error) {
            console.error("❌ Erreur lors de la connexion au wallet :", error);
            setErrorMessage("Erreur lors de la connexion au wallet.");
        }
    };

    const fetchBalance = async (walletAddress) => {
        if (!walletAddress) {
            console.error("🚨 fetchBalance : Adresse du wallet non fournie !");
            setBalance(null);
            setErrorMessage("🚨 Aucune adresse de wallet détectée.");
            return;
        }

        try {
            console.log(`🔍 Récupération du solde pour : ${walletAddress}`);
            const balanceLamports = await connection.getBalance(new PublicKey(walletAddress));

            console.log(`💰 Balance récupérée (lamports) : ${balanceLamports}`);
            setBalance(balanceLamports / 1_000_000_000); // Convertir en SOL
            setErrorMessage('');
        } catch (error) {
            console.error("❌ Erreur lors de la récupération du solde :", error);
            setErrorMessage(`Erreur: ${error.message}`);
            setBalance(null);
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
                <button onClick={checkWalletConnection} disabled={isConnected}>
                    {isConnected ? '✅ Déjà connecté' : '🔗 Se connecter à Solflare'}
                </button>
            </div>

            <button onClick={() => fetchBalance(publicKey)}>🔄 Mettre à jour le solde</button>

            {/* 🔍 Section Debug */}
            <div className="debug-section">
                <h3>🛠️ Debug Info</h3>
                <p><b>Adresse du wallet utilisé :</b> {publicKey || "Non détectée"}</p>
                <p><b>Solde récupéré :</b> {balance !== null ? balance + " SOL" : "Solde non récupéré"}</p>
                <p><b>Erreur :</b> {errorMessage || "Aucune erreur"}</p>
            </div>
        </div>
    );
};

export default DepotForm;