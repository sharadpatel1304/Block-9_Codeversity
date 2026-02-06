require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// --- CRITICAL FIX: CORS CONFIGURATION ---
// This allows your Netlify frontend to talk to this backend.
app.use(cors({
  origin: [
    "http://localhost:5173",                      // Allow local development
    "https://block-9-codeversity.netlify.app"     // Allow your deployed Netlify site
  ],
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
  credentials: true // Allow cookies/headers if needed
}));

app.use(express.json());

// --- DATABASE CONNECTION ---
// Connect to MongoDB (Uses .env variable, falls back to your provided string)
const mongoURI = process.env.MONGO_URI || 'mongodb+srv://admin:admin@block-9-codeversity.mxsiriu.mongodb.net/?retryWrites=true&w=majority&appName=block-9-codeversity';

mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// --- SCHEMA DEFINITION ---
const CertificateSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  name: String,
  recipientAddress: { type: String, lowercase: true }, 
  issuerAddress: { type: String, lowercase: true },
  issuerName: String,
  certificateType: String,
  issueDate: Date,
  expiryDate: Date,
  metadata: Object,
  ipfsHash: String,
  blockchainHash: String,
  signature: String,
  status: String,
  revocationReason: String,
  revocationDate: Date
});

const CertificateModel = mongoose.model('Certificate', CertificateSchema);

// --- API ROUTES ---

// 1. Get Certificates for a Wallet Address (Session Sync)
app.get('/api/certificates/:address', async (req, res) => {
  if (!req.params.address) {
    return res.status(400).json({ error: 'Address is required' });
  }
  
  const address = req.params.address.toLowerCase();
  
  try {
    const certificates = await CertificateModel.find({
      $or: [
        { recipientAddress: address }, // Certificates I received
        { issuerAddress: address }     // Certificates I issued
      ]
    });
    res.json(certificates);
  } catch (err) {
    console.error('Error fetching certificates:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. Issue (Save) a New Certificate
app.post('/api/certificates', async (req, res) => {
  try {
    const newCert = new CertificateModel(req.body);
    await newCert.save();
    console.log(`Certificate saved: ${newCert.id}`);
    res.json({ message: 'Certificate saved successfully', certificate: newCert });
  } catch (err) {
    console.error('Error saving certificate:', err);
    res.status(500).json({ error: err.message });
  }
});

// 3. Revoke a Certificate
app.patch('/api/certificates/revoke/:id', async (req, res) => {
  const { reason, address } = req.body; 
  
  if (!address) {
    return res.status(400).json({ error: 'Issuer address is required for verification' });
  }

  try {
    const cert = await CertificateModel.findOne({ id: req.params.id });
    if (!cert) return res.status(404).json({ error: 'Certificate not found' });
    
    // Ownership check
    if (cert.issuerAddress.toLowerCase() !== address.toLowerCase()) {
      return res.status(403).json({ error: 'Unauthorized: Only the issuer can revoke this certificate' });
    }

    cert.status = 'revoked';
    cert.revocationReason = reason;
    cert.revocationDate = new Date();
    await cert.save();
    
    res.json({ message: 'Certificate revoked', certificate: cert });
  } catch (err) {
    console.error('Error revoking certificate:', err);
    res.status(500).json({ error: err.message });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));