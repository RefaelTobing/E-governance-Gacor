import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { ProfilProvider } from './context/ProfilContext'
import './index.css'

// FE-49: browser berhenti memulihkan posisi gulir sendiri; reset diatur ScrollToAtas.
window.history.scrollRestoration = 'manual';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <ProfilProvider>
        <App />
      </ProfilProvider>
    </AuthProvider>
  </React.StrictMode>,
)
