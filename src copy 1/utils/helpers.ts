import { read, utils } from 'xlsx';
import { ethers } from 'ethers';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Certificate } from '../context/CertificateContext';

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
};

export const processExcelFile = async (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = utils.sheet_to_json(firstSheet);
        
        if (!jsonData.length) {
          throw new Error('Excel file is empty');
        }
        
        // Check if required columns exist
        const requiredColumns = ['name', 'rollNo', 'walletAddress'];
        const firstRow = jsonData[0] as any;
        const missingColumns = requiredColumns.filter(col => !firstRow.hasOwnProperty(col));
        
        if (missingColumns.length > 0) {
          throw new Error(`Excel file must have these columns: ${missingColumns.join(', ')}`);
        }
        
        // Filter out empty rows and validate data
        const validRows = jsonData
          .filter((row: any) => {
            if (!row.name || !row.rollNo || !row.walletAddress) return false;
            
            const walletAddress = row.walletAddress.toString().trim();
            // Use regex to validate Ethereum address format
            const isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(walletAddress);
            
            return row.name.toString().trim().length > 0 &&
                   row.rollNo.toString().trim().length > 0 &&
                   isValidAddress;
          })
          .map((row: any) => ({
            name: row.name.toString().trim(),
            recipientAddress: row.walletAddress.toString().trim(),
            metadata: {
              rollNo: row.rollNo.toString().trim()
            }
          }));

        if (validRows.length === 0) {
          throw new Error('No valid data found in the Excel file');
        }

        resolve(validRows);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

export const generateHash = async (data: any): Promise<string> => {
  const jsonData = JSON.stringify(data);
  return ethers.keccak256(ethers.toUtf8Bytes(jsonData));
};

export const generateQRCode = (data: string): string => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`;
};

export const generateHighQualityPDF = async (element: HTMLElement, certificate: Certificate): Promise<void> => {
  const canvas = await html2canvas(element, {
    scale: 4,
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: null,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight
  });

  const imgWidth = 297;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  pdf.addImage(
    canvas.toDataURL('image/jpeg', 1.0),
    'JPEG',
    0,
    0,
    imgWidth,
    imgHeight,
    undefined,
    'FAST'
  );

  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  const verificationText = `Verify this certificate at: ${window.location.origin}/verify\nCertificate ID: ${certificate.id}\nBlockchain Hash: ${certificate.blockchainHash}\nIssued by: ${certificate.issuerName} (${certificate.issuerAddress})`;
  pdf.text(verificationText, 10, imgHeight + 10);

  pdf.setProperties({
    title: `Certificate - ${certificate.name}`,
    subject: 'Blockchain Verified Certificate',
    creator: 'Certificate Generator',
    author: certificate.issuerName,
    keywords: 'certificate, blockchain, verification',
    producer: 'Certificate Generator'
  });

  pdf.save(`certificate-${certificate.name.replace(/\s+/g, '-')}.pdf`);
};

export const truncateAddress = (address: string, chars = 4): string => {
  if (!address) return '';
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

export const downloadJSON = (data: any, filename: string): void => {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};