// Adresses des contrats sur différents réseaux
export const contractAddresses = {
    // BSC Mainnet
    mainnet: {
      lpFarming: "0x405412D71847eCb8Fa5a98A1F91B90b1231A93dc", // Adresse du contrat LPFarming sur Mainnet
      defiStrategy: "0x8700052206e5742B5F23f119907107487f61199D", // Adresse du contrat DeFiStrategy sur Mainnet
      usdc:"0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", // USDC sur BSC
      busd:"0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56" // BUSD sur BSC
    },
    
    // Fonction pour obtenir les adresses selon le réseau
    get: function(chainId) {
      switch(chainId) {
        case "0x38": // BSC Mainnet
          return this.mainnet;
        default:
          return this.mainnet; // Par défaut, utiliser mainnet
      }
    }
  };
  
  // Exporter les adresses pour une utilisation directe
  export default contractAddresses;