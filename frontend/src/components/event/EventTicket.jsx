import { useState, useEffect } from 'react';
import { Download, Ticket, Calendar, Clock, MapPin, ExternalLink, X, User } from 'lucide-react';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';

const EventTicket = ({ event, ticket, user, onClose }) => {
  const [qrCode, setQRCode] = useState('');

  // Generate QR code when component mounts
  useEffect(() => {
    if (ticket?.ticketId) {
      // Create comprehensive ticket data for QR code
      const qrData = JSON.stringify({
        ticketId: ticket.ticketId,
        userName: user?.name,
        userEmail: user?.email,
        eventTitle: event.title,
        eventType: event.type,
        eventDate: event.eventDate,
        eventTime: event.eventTime,
        location: event.location,
        isVirtual: event.isVirtual,
        virtualLink: event.virtualLink,
        rsvpDate: ticket.rsvpDate,
        // You can add more fields as needed
        validatedAt: null, // Will be set when scanned at event
      });

      QRCode.toDataURL(qrData, {
        width: 200,
        margin: 2,
        errorCorrectionLevel: 'H', // High error correction for better scanning
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      }).then(setQRCode).catch(err => console.error('QR Code generation error:', err));
    }
  }, [ticket?.ticketId, event]);

  const downloadTicket = () => {
    // Create a new PDF document
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Set colors
    const primaryRed = [220, 38, 38]; // RGB for red-600
    const lightRed = [254, 226, 226]; // RGB for red-100
    const darkGray = [31, 41, 55]; // RGB for gray-800
    const medGray = [107, 114, 128]; // RGB for gray-500

    // Add red header background
    pdf.setFillColor(...lightRed);
    pdf.rect(0, 0, 210, 40, 'F');

    // Add title
    pdf.setFontSize(24);
    pdf.setTextColor(...primaryRed);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ALUMLINK EVENT TICKET', 105, 20, { align: 'center' });

    // Add ticket icon text
    pdf.setFontSize(12);
    pdf.setTextColor(...medGray);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Please present this ticket at the event entrance', 105, 30, { align: 'center' });

    // Attendee Section
    let yPos = 50;
    pdf.setFillColor(...lightRed);
    pdf.roundedRect(15, yPos, 180, 25, 2, 2, 'F');
    
    pdf.setFontSize(10);
    pdf.setTextColor(...primaryRed);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ATTENDEE', 20, yPos + 8);
    
    pdf.setFontSize(14);
    pdf.setTextColor(...darkGray);
    pdf.text(user?.name || 'N/A', 20, yPos + 16);
    
    if (user?.email) {
      pdf.setFontSize(10);
      pdf.setTextColor(...medGray);
      pdf.text(user.email, 20, yPos + 22);
    }

    // Event Details Section
    yPos += 35;
    pdf.setFontSize(16);
    pdf.setTextColor(...darkGray);
    pdf.setFont('helvetica', 'bold');
    pdf.text(event.title, 20, yPos);

    yPos += 10;
    pdf.setFontSize(10);
    pdf.setTextColor(...medGray);
    pdf.setFont('helvetica', 'normal');
    
    const eventDateFormatted = new Date(event.eventDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    pdf.text(`Event Date: ${eventDateFormatted}`, 20, yPos);
    yPos += 7;
    pdf.text(`Event Time: ${event.eventTime}`, 20, yPos);
    yPos += 7;
    pdf.text(`Event Location: ${event.location}`, 20, yPos);
    
    if (event.isVirtual && event.virtualLink) {
      yPos += 7;
      pdf.setTextColor(...primaryRed);
      pdf.text(`Virtual Link: ${event.virtualLink}`, 20, yPos);
    }

    // QR Code Section
    if (qrCode) {
      yPos += 15;
      
      // Add QR code border
      pdf.setDrawColor(...primaryRed);
      pdf.setLineWidth(1);
      pdf.rect(70, yPos, 70, 70);
      
      // Add QR code image
      pdf.addImage(qrCode, 'PNG', 72, yPos + 2, 66, 66);
      
      yPos += 75;
      pdf.setFontSize(9);
      pdf.setTextColor(...medGray);
      pdf.text('Scan this QR code at the event entrance', 105, yPos, { align: 'center' });
    }

    // Ticket ID Section
    yPos += 10;
    pdf.setFillColor(...lightRed);
    pdf.roundedRect(15, yPos, 180, 20, 2, 2, 'F');
    
    pdf.setFontSize(9);
    pdf.setTextColor(...primaryRed);
    pdf.setFont('helvetica', 'bold');
    pdf.text('TICKET ID', 20, yPos + 8);
    
    pdf.setFontSize(10);
    pdf.setTextColor(...darkGray);
    pdf.setFont('courier', 'normal');
    pdf.text(ticket.ticketId, 20, yPos + 15);

    // RSVP Date
    yPos += 25;
    pdf.setFontSize(9);
    pdf.setTextColor(...medGray);
    pdf.setFont('helvetica', 'normal');
    const rsvpDateFormatted = new Date(ticket.rsvpDate).toLocaleString('en-US', {
      dateStyle: 'full',
      timeStyle: 'short'
    });
    pdf.text(`Confirmed on ${rsvpDateFormatted}`, 105, yPos, { align: 'center' });

    // Footer
    pdf.setDrawColor(...medGray);
    pdf.setLineWidth(0.5);
    pdf.line(15, 280, 195, 280);
    pdf.setFontSize(8);
    pdf.setTextColor(...medGray);
    pdf.text('AlumLink Event Management System', 105, 285, { align: 'center' });

    // Save the PDF
    const fileName = `AlumLink_Ticket_${event.title.replace(/\s+/g, '_')}_${ticket.ticketId.slice(0, 8)}.pdf`;
    pdf.save(fileName);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={24} />
        </button>

        {/* Ticket Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-3">
            <Ticket className="text-red-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Your Event Ticket</h2>
        </div>

        {/* Attendee Information */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <User className="text-red-600" size={18} />
            <p className="text-xs text-red-700 font-semibold">ATTENDEE</p>
          </div>
          <p className="font-semibold text-gray-800">{user?.name || 'N/A'}</p>
          {user?.email && (
            <p className="text-sm text-gray-600">{user.email}</p>
          )}
        </div>

        {/* Event Details */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-lg mb-3">{event.title}</h3>
          
          <div className="space-y-2">
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <Calendar size={16} className="mt-0.5 flex-shrink-0" />
              <span>{new Date(event.eventDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock size={16} className="flex-shrink-0" />
              <span>{event.eventTime}</span>
            </div>

            <div className="flex items-start gap-2 text-sm text-gray-600">
              <MapPin size={16} className="mt-0.5 flex-shrink-0" />
              <span>{event.location}</span>
            </div>

            {event.isVirtual && event.virtualLink && (
              <div className="flex items-start gap-2 text-sm text-red-600">
                <ExternalLink size={16} className="mt-0.5 flex-shrink-0" />
                <a
                  href={event.virtualLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className=" break-all"
                >
                  Join Virtual Event
                </a>
              </div>
            )}
          </div>
        </div>

        {/* QR Code */}
        {qrCode && (
          <div className="flex flex-col items-center mb-4">
            <div className="bg-white p-3 rounded-lg border-2 border-red-200">
              <img src={qrCode} alt="Ticket QR Code" className="w-48 h-48" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Scan this code at the event</p>
          </div>
        )}

        {/* Ticket ID */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-xs text-red-700 mb-1">Ticket ID</p>
          <p className="font-mono text-sm font-semibold text-gray-800 break-all">
            {ticket.ticketId}
          </p>
        </div>

        {/* RSVP Date */}
        <p className="text-xs text-gray-500 text-center mb-4">
          Confirmed on {new Date(ticket.rsvpDate).toLocaleString()}
        </p>

        {/* Download Button */}
        <button
          onClick={downloadTicket}
          className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2"
        >
          <Download size={18} />
          Download PDF Ticket
        </button>
      </div>
    </div>
  );
};

export default EventTicket;
