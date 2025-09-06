import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { toast } from 'react-hot-toast';

// Common file validation
export const validateFile = (file, allowedExtensions = ['csv', 'xlsx', 'xls', 'txt']) => {
  const fileExtension = file.name.toLowerCase().split('.').pop();
  const allowedTypes = [
    'text/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/octet-stream',
    'text/plain'
  ];
  
  const isValidExtension = allowedExtensions.includes(fileExtension);
  const isValidType = allowedTypes.includes(file.type) || file.type === '';
  
  if (!isValidExtension && !isValidType) {
    return {
      valid: false,
      error: `Invalid file type. Please upload a ${allowedExtensions.join(', ')} file. Received: ${file.type || fileExtension}`
    };
  }
  
  return { valid: true };
};

// Common file parsing
export const parseFile = (file, fileExtension) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        let parsedData = [];
        
        if (fileExtension === 'csv' || file.type === 'text/csv') {
          const result = Papa.parse(e.target.result, { 
            header: true, 
            skipEmptyLines: true,
            transform: (value) => value.trim()
          });
          parsedData = result.data;
        } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
          const workbook = XLSX.read(e.target.result, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          parsedData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        } else if (fileExtension === 'txt') {
          const text = e.target.result;
          parsedData = text.split('\n').filter(line => line.trim());
        }
        
        resolve(parsedData);
      } catch (error) {
        reject(new Error(`Error parsing file: ${error.message}`));
      }
    };
    
    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsText(file);
  });
};

// Common preview generation
export const generatePreview = (data, validationFunction, maxPreviewItems = 10) => {
  const preview = [];
  let validCount = 0;
  let invalidCount = 0;
  
  data.slice(0, maxPreviewItems).forEach((item, index) => {
    const validation = validationFunction(item);
    if (validation.valid) {
      preview.push({ ...item, status: 'Valid', index });
      validCount++;
    } else {
      preview.push({ ...item, status: 'Invalid', error: validation.error, index });
      invalidCount++;
    }
  });
  
  return {
    preview,
    validCount,
    invalidCount,
    totalCount: data.length
  };
};

// Common upload success handler
export const handleUploadSuccess = (response, moduleName, levelName) => {
  if (response.data.success) {
    toast.success(`Successfully uploaded ${response.data.count || 0} questions to ${moduleName} - ${levelName}`);
    return true;
  } else {
    toast.error(response.data.message || 'Upload failed');
    return false;
  }
};

// Common error handler
export const handleUploadError = (error, defaultMessage = 'Upload failed') => {
  console.error('Upload error:', error);
  const message = error.response?.data?.message || error.message || defaultMessage;
  toast.error(message);
};

// Common file removal
export const removeFile = (setFile, setError, setSuccess) => {
  setFile(null);
  setError('');
  setSuccess('');
};

// Common loading state management
export const withLoading = async (setLoading, asyncFunction) => {
  setLoading(true);
  try {
    const result = await asyncFunction();
    return result;
  } finally {
    setLoading(false);
  }
};

// Common CSV template generation
export const generateCSVTemplate = (headers, filename = 'template.csv') => {
  const csvContent = headers.join(',') + '\n';
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// Common validation helpers
export const validateRequired = (value, fieldName) => {
  if (!value || value.trim() === '') {
    return { valid: false, error: `${fieldName} is required` };
  }
  return { valid: true };
};

export const validateLength = (value, minLength, maxLength, fieldName) => {
  if (value.length < minLength) {
    return { valid: false, error: `${fieldName} must be at least ${minLength} characters` };
  }
  if (value.length > maxLength) {
    return { valid: false, error: `${fieldName} must be no more than ${maxLength} characters` };
  }
  return { valid: true };
};

// Common preview modal component
export const PreviewModal = ({ isOpen, onClose, title, children, onConfirm, confirmText = 'Confirm Upload' }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <div className="mb-4">
          {children}
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}; 