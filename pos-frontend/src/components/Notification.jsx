import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

const Notification = ({ message, type = 'success', onClose }) => (
  <div 
    className={`fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 px-4 sm:px-6 py-3 rounded-lg shadow-lg text-white font-semibold flex items-center justify-center sm:justify-start gap-3 animate-fade-in-up ${
      type === 'success' ? 'bg-green-600' : 'bg-red-600'
    }`}
    style={{ animation: 'fade-in-up 0.3s ease-out' }}
  >
    {type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <XCircle className="w-5 h-5 shrink-0" />}
    <span className="text-sm sm:text-base">{message}</span>
  </div>
);

export default Notification;