import React, { useState, useEffect } from 'react';
import { Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import './DepotForm.css';

const DepotForm = () => {
    const [amount, setAmount] = useState(0.05); // Valeur par défaut 0.05 SOL
    const [destinationAddress, setDestinationAddress] = useState('');
    const [status, setStatus] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [publicKey, setPublicKey] = useState(null);
    const [balance, setBalance] = useState(null);

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
        <div className="debug-section">
            <h3>🛠️ Debug Info</h3>
            <p><b>Adresse du wallet connecté :</b> {publicKey || "Non détectée"}</p>
            <p><b>Solde récupéré :</b> {balance !== null ? balance + " SOL" : "Solde non récupéré"}</p>
            <p><b>Statut :</b> {status}</p>
        </div>
    };

    const fetchBalance = async () => {
        if (publicKey) {
            try {
                console.log("Fetching balance for:", publicKey.toString()); // Test
                const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");
                const balance = await connection.getBalance(new PublicKey(publicKey));
                console.log("Balance récupérée (lamports) :", balance); // Test
                setBalance(balance / 1000000000); // Conversion en SOL
            } catch (error) {
                console.error("Erreur lors de la récupération du solde:", error);
                setBalance(null); // Remettre à zéro si erreur
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
            alert('Veuillez installer Solflare.');
            return;
        }

        try {
            await window.solflare.connect();
            checkWalletConnection();
        } catch (error) {
            console.error('❌ Erreur lors de la connexion :', error);
        }
    };

    const handleDepot = async () => {
        if (!isConnected) {
            setStatus('⚠️ Veuillez vous connecter à Solflare.');
            return;
        }

        if (!destinationAddress || !PublicKey.isOnCurve(destinationAddress)) {
            setStatus('⚠️ Adresse de destination invalide.');
            return;
        }

        if (amount <= 0 || isNaN(amount)) {
            setStatus('⚠️ Veuillez entrer un montant valide.');
            return;
        }

        if (balance < amount + 0.000005) { // Vérifie que le solde couvre aussi les frais
            setStatus('⚠️ Fonds insuffisants pour effectuer la transaction.');
            return;
        }

        try {
            const lamports = Math.round(amount * 1_000_000_000); // Convertir en lamports

            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: new PublicKey(publicKey),
                    toPubkey: new PublicKey(destinationAddress),
                    lamports,
                })
            );

            const { blockhash } = await connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = new PublicKey(publicKey);

            const signedTransaction = await window.solflare.signTransaction(transaction);
            const signature = await connection.sendRawTransaction(signedTransaction.serialize());

            setStatus(`✅ Transaction envoyée avec succès ! ID : ${signature}`);

            await connection.confirmTransaction(signature);
            setStatus('✅ Transaction confirmée avec succès !');
            fetchBalance(publicKey); // Mettre à jour le solde après la transaction
        } catch (error) {
            console.error('❌ Erreur lors du dépôt de fonds:', error);
            setStatus('❌ Une erreur est survenue. Veuillez réessayer.');
        }
    };

    return (
        <div className="depot-form">
            <h1>💰 Dépôt de fonds sur Solana</h1>
            <div>
                <h2>État du wallet :</h2>
                {isConnected ? (
                    <>
                        <p>✅ Connecté avec l'adresse : <strong>{publicKey}</strong></p>
                        <p>💰 Solde disponible : <strong>{balance} SOL</strong></p>
                    </>
                ) : (
                    <p>⚠️ Non connecté.</p>
                )}
                <button onClick={handleConnect} disabled={isConnected}>
                    {isConnected ? '✅ Déjà connecté' : '🔗 Se connecter à Solflare'}
                </button>
            </div>
            <div>
                <label>🔹 Adresse de destination :</label>
                <input
                    type="text"
                    value={destinationAddress}
                    onChange={(e) => setDestinationAddress(e.target.value)}
                    placeholder="Entrez l'adresse Solana"
                />
            </div>
            <div>
                <label>💸 Montant (en SOL) :</label>
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Entrez le montant"
                />
            </div>
            <button onClick={handleDepot} disabled={!isConnected}>
                🚀 Envoyer {amount} SOL
            </button>
            <p className="status">{status}</p>
        </div>
    );
};

export default DepotForm;