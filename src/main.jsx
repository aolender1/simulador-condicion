import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// El redirect 307 de unsldatos.com -> www.unsldatos.com descarta el header
// Authorization de los fetch a /api. Para que la app corra siempre en el
// dominio canónico, se redirige a nivel de SPA si se entró sin www.
if (window.location.hostname === 'unsldatos.com') {
  window.location.replace('https://www.unsldatos.com' + window.location.pathname + window.location.search);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);