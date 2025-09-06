import React from 'react';

const Modal = ({ title, children, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] mx-4 relative animate-fade-in flex flex-col">
        <div className="flex justify-between items-center border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none">&times;</button>
        </div>
        <div className="px-6 py-4 overflow-y-auto" style={{maxHeight: 'calc(90vh - 64px)'}}>{children}</div>
      </div>
    </div>
  );
};

export default Modal; 