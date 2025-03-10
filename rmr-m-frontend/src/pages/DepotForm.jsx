import React, { useState, useEffect } from 'react';
import { Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import './DepotForm.css';

const DepotForm = () => {
    const [amount, setAmount] = useState(0);
    const [destinationAddress, setDestinationAddress] = useState('');
    const [status, setStatus] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [publicKey, setPublicKey] = useState(null);

    // Vérifier la connexion au wallet
    useEffect(() => {
        checkWalletConnection();

        // Écouter les événements de connexion/déconnexion
        if (window.solflare) {
            window.solflare.on('connect', () => {
                console.log('Wallet connecté !');
                checkWalletConnection();
            });

            window.solflare.on('disconnect', () => {
                console.log('Wallet déconnecté.');
                setIsConnected(false);
                setPublicKey(null);
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

        // Récupérer l'adresse publique de l'utilisateur
        const publicKey = window.solflare.publicKey;
        setIsConnected(true);
        setPublicKey(publicKey.toString());
    };

    const handleConnect = async () => {
        if (!window.solflare) {
            alert('Veuillez installer Solflare.');
            return;
        }

        try {
            await window.solflare.connect();
            checkWalletConnection();
        } catch (error) {
            console.error('Erreur lors de la connexion :', error);
        }
    };

    const handleDepot = async () => {
        if (!isConnected) {
            setStatus('Veuillez vous connecter à Solflare.');
            return;
        }

        try {
            // Configurer la connexion au réseau Solana
            const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');

            // Convertir le montant en lamports (1 SOL = 1000000000 lamports)
            const lamports = amount * 1000000000;

            // Créer la transaction
            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: new PublicKey(publicKey),
                    toPubkey: new PublicKey(destinationAddress),
                    lamports,
                })
            );

            // Configurer la transaction
            const { blockhash } = await connection.getRecentBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = new PublicKey(publicKey);

            // Signer la transaction
            const signedTransaction = await window.solflare.signTransaction(transaction);

            // Envoyer la transaction
            const signature = await connection.sendRawTransaction(signedTransaction.serialize());
            setStatus(`Transaction envoyée avec succès. Signature: ${signature}`);

            // Confirmer la transaction
            await connection.confirmTransaction(signature, 'confirmed');
            setStatus('Transaction confirmée avec succès !');
        } catch (error) {
            console.error('Erreur lors du dépôt de fonds:', error);
            setStatus('Une erreur est survenue. Veuillez réessayer.');
        }
    };

    return (
        <div>
            <h1>Dépôt de fonds vers Solana</h1>
            <div>
                <h2>État du wallet :</h2>
                {isConnected ? (
                    <p>Connecté avec l'adresse : <strong>{publicKey}</strong></p>
                ) : (
                    <p>Non connecté.</p>
                )}
                <button onClick={handleConnect} disabled={isConnected}>
                    {isConnected ? 'Déjà connecté' : 'Se connecter à Solflare'}
                </button>
            </div>
            <div>
                <label>Adresse de destination :</label>
                <input
                    type="text"
                    value={destinationAddress}
                    onChange={(e) => setDestinationAddress(e.target.value)}
                    placeholder="Entrez l'adresse Solana"
                />
            </div>
            <div>
                <label>Montant (en SOL) :</label>
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Entrez le montant"
                />
            </div>
            <button onClick={handleDepot} disabled={!isConnected}>
                Déposer
            </button>
            <p>{status}</p>
        </div>
    );
};

export default DepotForm;