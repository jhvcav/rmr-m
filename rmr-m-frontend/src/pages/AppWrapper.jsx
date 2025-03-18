import React from 'react';

// Ce composant va envelopper votre application pour garantir un fond blanc
// et aucun débordement horizontal
const AppWrapper = ({ children }) => {
  // Styles appliqués directement pour avoir priorité sur tous les autres styles
  const wrapperStyle = {
    width: '100%',
    maxWidth: '100vw',
    minHeight: '100vh',
    backgroundColor: '#ffffff',
    overflowX: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    margin: 0,
    padding: 0
  };

  return (
    <div style={wrapperStyle}>
      {children}
    </div>
  );
};

export default AppWrapper;