import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Pages
import Dashboard from './pages/Dashboard';
import IssueCertificates from './pages/IssueCertificates';
import VerifyCertificate from './pages/VerifyCertificate';
import CertificateWallet from './pages/CertificateWallet';
import CertificateDetails from './pages/CertificateDetails';

// Components
import Navbar from './components/Navbar';
import { WalletProvider } from './context/WalletContext';
import { CertificateProvider } from './context/CertificateContext';
import { DIDProvider } from './context/DIDContext';

function App() {
  return (
    <Router>
      <WalletProvider>
        <DIDProvider>
          <CertificateProvider>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
              <Navbar />
              <div className="container mx-auto px-4 py-8">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/issue" element={<IssueCertificates />} />
                  <Route path="/verify" element={<VerifyCertificate />} />
                  <Route path="/wallet" element={<CertificateWallet />} />
                  <Route path="/certificate/:id" element={<CertificateDetails />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </div>
              <Toaster position="bottom-right" />
            </div>
          </CertificateProvider>
        </DIDProvider>
      </WalletProvider>
    </Router>
  );
}

export default App;