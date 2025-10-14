// Example QR Code Scanner for Event Check-in
// This can be used by event organizers to scan and validate tickets

import { useState } from 'react';
import { QrCode, CheckCircle, XCircle, Loader } from 'lucide-react';
import { axiosInstance } from '../../lib/axios';
import toast from 'react-hot-toast';

const TicketScanner = ({ eventId }) => {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  // This function would be called when QR code is scanned
  // You would integrate with a QR scanner library like 'react-qr-reader' or 'html5-qrcode'
  const handleScan = async (scannedData) => {
    try {
      setScanning(true);
      
      // Parse the QR code JSON data
      const ticketData = JSON.parse(scannedData);
      
      console.log('Scanned ticket:', ticketData);
      
      // Validate the ticket with backend
      const response = await axiosInstance.post(`/events/${eventId}/validate-ticket`, {
        ticketId: ticketData.ticketId,
        scannedData: ticketData
      });

      if (response.data.valid) {
        setScanResult({
          valid: true,
          attendee: response.data.attendee,
          message: 'Valid ticket - Entry granted!'
        });
        toast.success('Valid ticket!');
      } else {
        setScanResult({
          valid: false,
          message: response.data.message || 'Invalid ticket'
        });
        toast.error('Invalid ticket!');
      }
    } catch (error) {
      console.error('Scan error:', error);
      setScanResult({
        valid: false,
        message: 'Error validating ticket'
      });
      toast.error('Failed to validate ticket');
    } finally {
      setScanning(false);
    }
  };

  const handleScanError = (error) => {
    console.error('QR Scan Error:', error);
    toast.error('Error scanning QR code');
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <QrCode className="text-primary" />
        Ticket Scanner
      </h2>

      {/* QR Scanner would go here */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-4">
        <QrCode className="mx-auto h-16 w-16 text-gray-400 mb-2" />
        <p className="text-gray-600">
          Point camera at ticket QR code to scan
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Integrate with react-qr-reader or html5-qrcode library
        </p>
      </div>

      {/* Scan Result */}
      {scanning && (
        <div className="flex items-center justify-center gap-2 p-4 bg-blue-50 rounded-lg">
          <Loader className="animate-spin text-blue-600" />
          <span className="text-blue-700">Validating ticket...</span>
        </div>
      )}

      {scanResult && !scanning && (
        <div className={`p-4 rounded-lg ${scanResult.valid ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="flex items-center gap-2 mb-2">
            {scanResult.valid ? (
              <CheckCircle className="text-green-600" size={24} />
            ) : (
              <XCircle className="text-red-600" size={24} />
            )}
            <span className={`font-semibold ${scanResult.valid ? 'text-green-700' : 'text-red-700'}`}>
              {scanResult.message}
            </span>
          </div>
          
          {scanResult.valid && scanResult.attendee && (
            <div className="ml-8 text-sm text-gray-700">
              <p><strong>Name:</strong> {scanResult.attendee.name}</p>
              <p><strong>Ticket ID:</strong> {scanResult.attendee.ticketId}</p>
              <p><strong>RSVP Date:</strong> {new Date(scanResult.attendee.rsvpDate).toLocaleString()}</p>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">How to use:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
          <li>Allow camera permissions when prompted</li>
          <li>Point camera at attendee's ticket QR code</li>
          <li>Wait for automatic scan and validation</li>
          <li>Grant entry if ticket is valid</li>
        </ol>
      </div>

      {/* Manual Entry Option */}
      <div className="mt-4">
        <button
          onClick={() => {
            const testData = prompt('Enter ticket ID manually:');
            if (testData) {
              handleScan(JSON.stringify({ ticketId: testData }));
            }
          }}
          className="w-full py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
        >
          Manual Entry (Fallback)
        </button>
      </div>
    </div>
  );
};

export default TicketScanner;
