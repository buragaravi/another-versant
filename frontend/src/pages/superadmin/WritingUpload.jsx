import React, { useState } from 'react';
import { FaUpload, FaFileAlt, FaTrash, FaEdit, FaEye } from 'react-icons/fa';
import Papa from 'papaparse';

const WritingUpload = ({ onUpload, onClose }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewParagraphs, setPreviewParagraphs] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState('Beginner');

  const levels = ['Beginner', 'Intermediate', 'Advanced'];
  
  const levelConfig = {
    Beginner: {
      backspaceAllowed: true,
      minWords: 50,
      maxWords: 100,
      minChars: 150,
      maxChars: 300,
      timeLimit: 10, // minutes
      description: 'Basic writing with backspace allowed'
    },
    Intermediate: {
      backspaceAllowed: false,
      minWords: 80,
      maxWords: 150,
      minChars: 250,
      maxChars: 450,
      timeLimit: 8, // minutes
      description: 'Intermediate writing without backspace'
    },
    Advanced: {
      backspaceAllowed: false,
      minWords: 120,
      maxWords: 200,
      minChars: 400,
      maxChars: 600,
      timeLimit: 6, // minutes
      description: 'Advanced writing without backspace, strict time limit'
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.name.endsWith('.csv')) {
        setError('Please upload a CSV file');
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const validateParagraph = (text, level) => {
    const config = levelConfig[level];
    const characterCount = text.length;
    const wordCount = text.trim().split(/\s+/).length;
    const sentenceCount = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0).length;

    const errors = [];
    
    if (characterCount < config.minChars) {
      errors.push(`Character count (${characterCount}) is below minimum (${config.minChars})`);
    }
    if (characterCount > config.maxChars) {
      errors.push(`Character count (${characterCount}) exceeds maximum (${config.maxChars})`);
    }
    if (wordCount < config.minWords) {
      errors.push(`Word count (${wordCount}) is below minimum (${config.minWords})`);
    }
    if (wordCount > config.maxWords) {
      errors.push(`Word count (${wordCount}) exceeds maximum (${config.maxWords})`);
    }
    if (sentenceCount < 3) {
      errors.push(`Sentence count (${sentenceCount}) is below minimum (3)`);
    }
    if (sentenceCount > 12) {
      errors.push(`Sentence count (${sentenceCount}) exceeds maximum (12)`);
    }

    return errors;
  };

  const processFileForPreview = () => {
    if (!file) return;

    Papa.parse(file, {
      complete: (result) => {
        const paragraphs = [];
        const existing = new Set();

        result.data.forEach((row, index) => {
          if (row.length >= 3) {
            const level = row[0]?.trim() || selectedLevel;
            const topic = row[1]?.trim() || '';
            const paragraph = row[2]?.trim() || '';
            const instructions = row[3]?.trim() || '';

            if (paragraph) {
              const validation = validateParagraph(paragraph, level);
              const key = `${level}-${topic}-${paragraph.substring(0, 50)}`;
              
              if (existing.has(key)) {
                paragraphs.push({
                  level,
                  topic,
                  paragraph,
                  instructions,
                  status: 'Duplicate',
                  errors: ['Duplicate paragraph']
                });
              } else {
                paragraphs.push({
                  level,
                  topic,
                  paragraph,
                  instructions,
                  status: validation.length === 0 ? 'Valid' : 'Invalid',
                  errors: validation
                });
                existing.add(key);
              }
            }
          }
        });

        setPreviewParagraphs(paragraphs);
        setShowPreview(true);
      },
      error: () => setError('Failed to parse CSV file'),
    });
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('selected_level', selectedLevel);

      const response = await fetch('/api/superadmin/writing-upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess('Writing paragraphs uploaded successfully!');
        if (onUpload) {
          onUpload(result.data);
        }
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError(result.message || 'Upload failed');
      }
    } catch (err) {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setError('');
  };

  const handleConfirmPreview = () => {
    const validParagraphs = previewParagraphs.filter(p => p.status === 'Valid');
    if (validParagraphs.length === 0) {
      setError('No valid paragraphs to upload');
      setShowPreview(false);
      return;
    }
    setShowPreview(false);
    handleUpload();
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Upload Writing Paragraphs</h2>
          <p className="text-sm text-gray-600">Configure writing tests with level-based restrictions</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          ×
        </button>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Level Configuration:</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {levels.map(level => {
            const config = levelConfig[level];
            return (
              <div key={level} className={`p-4 rounded-lg border-2 ${
                selectedLevel === level ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}>
                <h4 className="font-semibold text-gray-800 mb-2">{level}</h4>
                <p className="text-sm text-gray-600 mb-2">{config.description}</p>
                <div className="text-xs text-gray-500 space-y-1">
                  <div>Words: {config.minWords}-{config.maxWords}</div>
                  <div>Chars: {config.minChars}-{config.maxChars}</div>
                  <div>Time: {config.timeLimit} min</div>
                  <div>Backspace: {config.backspaceAllowed ? 'Allowed' : 'Disabled'}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Requirements:</h3>
        <div className="bg-blue-50 p-4 rounded-lg">
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• CSV format with columns: level, topic, paragraph, instructions</li>
            <li>• Beginner: Backspace allowed, 50-100 words, 10 min time limit</li>
            <li>• Intermediate: No backspace, 80-150 words, 8 min time limit</li>
            <li>• Advanced: No backspace, 120-200 words, 6 min time limit</li>
            <li>• Each paragraph should have 3-12 sentences</li>
            <li>• Topics should be relevant and engaging</li>
          </ul>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select CSV File
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          {!file ? (
            <div>
              <FaUpload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Choose File
              </label>
              <p className="mt-2 text-sm text-gray-500">
                or drag and drop a CSV file here
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FaFileAlt className="h-8 w-8 text-blue-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-700">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={processFileForPreview}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                >
                  <FaEye className="h-4 w-4" />
                </button>
                <button
                  onClick={removeFile}
                  className="text-red-500 hover:text-red-700"
                >
                  <FaTrash className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      <div className="flex justify-end space-x-3">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Uploading...
            </>
          ) : (
            'Upload Paragraphs'
          )}
        </button>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-lg">Preview Paragraphs</h4>
              <button 
                onClick={() => setShowPreview(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            
            <div className="max-h-96 overflow-y-auto mb-4">
              <div className="grid grid-cols-1 gap-4">
                {previewParagraphs.map((paragraph, i) => (
                  <div 
                    key={i} 
                    className={`p-4 rounded border ${
                      paragraph.status === 'Valid' ? 'bg-green-50 border-green-200' :
                      paragraph.status === 'Duplicate' ? 'bg-yellow-50 border-yellow-200' :
                      'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`text-xs px-2 py-1 rounded ${
                            paragraph.status === 'Valid' ? 'bg-green-200 text-green-800' :
                            paragraph.status === 'Duplicate' ? 'bg-yellow-200 text-yellow-800' :
                            'bg-red-200 text-red-800'
                          }`}>
                            {paragraph.level}
                          </span>
                          <span className="text-sm font-medium text-gray-700">
                            {paragraph.topic}
                          </span>
                        </div>
                        <p className="text-sm text-gray-800 mb-2">{paragraph.paragraph}</p>
                        {paragraph.instructions && (
                          <p className="text-xs text-gray-600 italic">
                            Instructions: {paragraph.instructions}
                          </p>
                        )}
                        {paragraph.errors && paragraph.errors.length > 0 && (
                          <div className="mt-2">
                            {paragraph.errors.map((error, idx) => (
                              <p key={idx} className="text-xs text-red-600">• {error}</p>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ml-2 ${
                        paragraph.status === 'Valid' ? 'bg-green-200 text-green-800' :
                        paragraph.status === 'Duplicate' ? 'bg-yellow-200 text-yellow-800' :
                        'bg-red-200 text-red-800'
                      }`}>
                        {paragraph.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <span className="text-green-600 font-medium">
                  {previewParagraphs.filter(p => p.status === 'Valid').length} valid
                </span>
                {' • '}
                <span className="text-yellow-600 font-medium">
                  {previewParagraphs.filter(p => p.status === 'Duplicate').length} duplicate
                </span>
                {' • '}
                <span className="text-red-600 font-medium">
                  {previewParagraphs.filter(p => p.status === 'Invalid').length} invalid
                </span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowPreview(false)} 
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConfirmPreview}
                  disabled={previewParagraphs.filter(p => p.status === 'Valid').length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  Upload Valid Paragraphs
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WritingUpload; 