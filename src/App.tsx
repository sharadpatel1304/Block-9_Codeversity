import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Context Providers
import { WalletProvider } from './context/WalletContext';
import { CertificateProvider } from './context/CertificateContext';
import { LanguageProvider } from './context/LanguageContext';

// Components (Navbar stays in components)
import Navbar from './components/Navbar';

// --- PAGES (Updated paths to match your file structure) ---
import Dashboard from './pages/Dashboard';
import IssueCertificates from './pages/IssueCertificates';
import VerifyCertificate from './pages/VerifyCertificate'; 
// Note: verify filename. If it's named 'Verify.tsx', update this import.

// Mapping 'Wallet' import to your actual 'CertificateWallet.tsx' file
import Wallet from './pages/CertificateWallet'; 

// Mapping 'CertificateView' import to your actual 'CertificateDetails.tsx' file
import CertificateView from './pages/CertificateDetails'; 

function App() {
  return (
    <WalletProvider>
      <CertificateProvider>
        <LanguageProvider>
          <Router>
            <div className="min-h-screen bg-white text-neutral-900 font-sans">
              <Navbar />
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/issue" element={<IssueCertificates />} />
                <Route path="/verify" element={<VerifyCertificate />} />
                <Route path="/wallet" element={<Wallet />} />
                <Route path="/certificate/:id" element={<CertificateView />} />
              </Routes>
              <Toaster position="bottom-right" />
            </div>
          </Router>
        </LanguageProvider>
      </CertificateProvider>
    </WalletProvider>
  );
}

export default App;