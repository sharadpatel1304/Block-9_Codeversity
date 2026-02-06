// server/index.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB (You need a MongoDB URL, local or Atlas)
mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://admin:admin@block-9-codeversity.mxsiriu.mongodb.net/')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// Define Schema
const CertificateSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  name: String,
  recipientAddress: { type: String, lowercase: true }, // Store as lowercase for easy matching
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

// --- API Routes ---

// 1. Get Certificates for a Wallet Address (Session Sync)
app.get('/api/certificates/:address', async (req, res) => {
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
    res.status(500).json({ error: err.message });
  }
});

// 2. Issue (Save) a New Certificate
app.post('/api/certificates', async (req, res) => {
  try {
    const newCert = new CertificateModel(req.body);
    await newCert.save();
    res.json({ message: 'Certificate saved successfully', certificate: newCert });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Revoke a Certificate
app.patch('/api/certificates/revoke/:id', async (req, res) => {
  const { reason, address } = req.body; // Address passed to verify ownership
  try {
    const cert = await CertificateModel.findOne({ id: req.params.id });
    if (!cert) return res.status(404).json({ error: 'Certificate not found' });
    
    // Simple ownership check (In production, verify signature)
    if (cert.issuerAddress.toLowerCase() !== address.toLowerCase()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    cert.status = 'revoked';
    cert.revocationReason = reason;
    cert.revocationDate = new Date();
    await cert.save();
    
    res.json({ message: 'Certificate revoked', certificate: cert });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));