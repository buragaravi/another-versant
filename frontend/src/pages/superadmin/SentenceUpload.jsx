import React, { useState } from 'react';
import { FaUpload, FaFileAlt, FaTrash, FaHeadphones, FaMicrophone, FaVolumeUp, FaPlay, FaPause } from 'react-icons/fa';
import Papa from 'papaparse';

const SentenceUpload = ({ onUpload, onClose, moduleType = 'LISTENING' }) => {
  const [file, setFile] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('Beginner');
  const [previewSentences, setPreviewSentences] = useState([]);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  
  // Audio configuration for Listening module
  const [audioConfig, setAudioConfig] = useState({
    speed: 1.0,
    accent: 'en-US',
    volume: 1.0
  });
  
  // Transcript validation settings
  const [transcriptValidation, setTranscriptValidation] = useState({
    enabled: true,
    tolerance: 0.8, // Similarity threshold
    checkMismatchedWords: true,
    allowPartialMatches: true
  });

  const levels = ['Beginner', 'Intermediate', 'Advanced'];
  
  const moduleConfig = {
    LISTENING: {
      icon: FaHeadphones,
      title: 'Listening Comprehension',
      description: 'Upload listening comprehension sentences with audio prompts and transcript validation',
      color: 'yellow',
      supportsAudio: true
    },
    SPEAKING: {
      icon: FaMicrophone,
      title: 'Speaking Practice',
      description: 'Upload speaking practice sentences with transcript validation',
      color: 'pink',
      supportsAudio: false,
      supportsTranscriptValidation: true
    }
  };

  const config = moduleConfig[moduleType] || moduleConfig.LISTENING;
  const IconComponent = config.icon;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.name.endsWith('.csv') && !selectedFile.name.endsWith('.txt')) {
        setError('Please upload a CSV or TXT file');
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const handleAudioFileChange = (e) => {
    const selectedAudioFile = e.target.files[0];
    if (selectedAudioFile) {
      // Validate audio file type
      const validAudioTypes = ['audio/mp3', 'audio/wav', 'audio/m4a', 'audio/ogg'];
      if (!validAudioTypes.includes(selectedAudioFile.type)) {
        setError('Please upload a valid audio file (MP3, WAV, M4A, OGG)');
        return;
      }
      setAudioFile(selectedAudioFile);
      setError('');
    }
  };

  const validateSentence = (sentence) => {
    const trimmed = sentence.trim();
    if (!trimmed) return { valid: false, error: 'Empty sentence' };
    
    if (trimmed.length < 10) {
      return { valid: false, error: 'Sentence too short (minimum 10 characters)' };
    }
    
    if (trimmed.length > 200) {
      return { valid: false, error: 'Sentence too long (maximum 200 characters)' };
    }
    
    // Check if sentence ends with proper punctuation
    if (!trimmed.match(/[.!?]$/)) {
      return { valid: false, error: 'Sentence must end with proper punctuation (.!?)' };
    }
    
    return { valid: true };
  };

  const processFileForPreview = () => {
    if (!file) return;

    const processContent = (content) => {
      const sentences = content.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
      const preview = [];
      const existing = new Set();

      sentences.forEach((sentence, index) => {
        const validation = validateSentence(sentence);
        if (validation.valid) {
          if (existing.has(sentence.toLowerCase())) {
            preview.push({ text: sentence, status: 'Duplicate', error: null });
          } else {
            preview.push({ text: sentence, status: 'New', error: null });
            existing.add(sentence.toLowerCase());
          }
        } else {
          preview.push({ text: sentence, status: 'Invalid', error: validation.error });
        }
      });

      return preview;
    };

    if (file.name.endsWith('.csv')) {
      Papa.parse(file, {
        complete: (result) => {
          const sentences = result.data.flat().filter(Boolean);
          const preview = processContent(sentences.join('. '));
          setPreviewSentences(preview);
          setIsPreviewModalOpen(true);
        },
        error: () => setError('Failed to parse CSV file'),
      });
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        const preview = processContent(content);
        setPreviewSentences(preview);
        setIsPreviewModalOpen(true);
      };
      reader.onerror = () => setError('Failed to read file');
      reader.readAsText(file);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    if (!selectedLevel) {
      setError('Please select a level');
      return;
    }

    // For Listening module, require audio file
    if (moduleType === 'LISTENING' && !audioFile) {
      setError('Please upload an audio file for listening comprehension');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('module_id', moduleType);
      formData.append('level_id', `${moduleType}_${selectedLevel.toUpperCase()}`);
      formData.append('level', selectedLevel);
      
      // Add audio configuration for Listening module
      if (moduleType === 'LISTENING') {
        formData.append('audio_file', audioFile);
        formData.append('audio_config', JSON.stringify(audioConfig));
        formData.append('transcript_validation', JSON.stringify(transcriptValidation));
      }
      
      // Add transcript validation for Speaking module
      if (moduleType === 'SPEAKING') {
        formData.append('transcript_validation', JSON.stringify(transcriptValidation));
      }

      const response = await fetch('/api/superadmin/sentence-upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(`${config.title} sentences uploaded successfully!`);
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

  const removeAudioFile = () => {
    setAudioFile(null);
    setError('');
  };

  const handleConfirmPreview = () => {
    const validSentences = previewSentences.filter(s => s.status === 'New');
    if (validSentences.length === 0) {
      setError('No valid sentences to upload');
      setIsPreviewModalOpen(false);
      return;
    }
    setIsPreviewModalOpen(false);
    handleUpload();
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <IconComponent className={`h-8 w-8 text-${config.color}-500 mr-3`} />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{config.title}</h2>
            <p className="text-sm text-gray-600">{config.description}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          ×
        </button>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Requirements:</h3>
        <div className="bg-blue-50 p-4 rounded-lg">
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Sentence length: 10-200 characters</li>
            <li>• Must end with proper punctuation (.!?)</li>
            <li>• CSV or TXT format</li>
            <li>• Levels: Beginner, Intermediate, Advanced</li>
            <li>• One sentence per line (TXT) or column (CSV)</li>
            {moduleType === 'LISTENING' && (
              <>
                <li>• Audio file required (MP3, WAV, M4A, OGG)</li>
                <li>• Transcript validation with configurable tolerance</li>
                <li>• Mismatched words detection enabled</li>
              </>
            )}
            {moduleType === 'SPEAKING' && (
              <>
                <li>• Students record their speech</li>
                <li>• Automatic transcript validation</li>
                <li>• Mismatched words detection enabled</li>
                <li>• Real-time feedback on pronunciation</li>
              </>
            )}
          </ul>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Level
        </label>
        <select
          value={selectedLevel}
          onChange={(e) => setSelectedLevel(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {levels.map(level => (
            <option key={level} value={level}>{level}</option>
          ))}
        </select>
      </div>

      {/* Audio Configuration for Listening Module */}
      {moduleType === 'LISTENING' && (
        <div className="mb-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">Audio Configuration</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Playback Speed
              </label>
              <select
                value={audioConfig.speed}
                onChange={(e) => setAudioConfig(prev => ({ ...prev, speed: parseFloat(e.target.value) }))}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value={0.5}>0.5x (Slow)</option>
                <option value={0.75}>0.75x</option>
                <option value={1.0}>1.0x (Normal)</option>
                <option value={1.25}>1.25x</option>
                <option value={1.5}>1.5x (Fast)</option>
                <option value={2.0}>2.0x (Very Fast)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Accent
              </label>
              <select
                value={audioConfig.accent}
                onChange={(e) => setAudioConfig(prev => ({ ...prev, accent: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="en-US">American English</option>
                <option value="en-GB">British English</option>
                <option value="en-AU">Australian English</option>
                <option value="en-IN">Indian English</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Volume
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={audioConfig.volume}
                onChange={(e) => setAudioConfig(prev => ({ ...prev, volume: parseFloat(e.target.value) }))}
                className="w-full"
              />
              <span className="text-xs text-gray-500">{audioConfig.volume}x</span>
            </div>
          </div>

          {/* Transcript Validation Settings */}
          <div className="border-t pt-4">
            <h4 className="text-md font-semibold text-gray-700 mb-3">Transcript Validation</h4>
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enableValidation"
                  checked={transcriptValidation.enabled}
                  onChange={(e) => setTranscriptValidation(prev => ({ ...prev, enabled: e.target.checked }))}
                  className="mr-2"
                />
                <label htmlFor="enableValidation" className="text-sm text-gray-700">
                  Enable transcript validation
                </label>
              </div>
              
              {transcriptValidation.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Similarity Tolerance
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="1.0"
                      step="0.1"
                      value={transcriptValidation.tolerance}
                      onChange={(e) => setTranscriptValidation(prev => ({ ...prev, tolerance: parseFloat(e.target.value) }))}
                      className="w-full"
                    />
                    <span className="text-xs text-gray-500">{Math.round(transcriptValidation.tolerance * 100)}%</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="checkMismatched"
                        checked={transcriptValidation.checkMismatchedWords}
                        onChange={(e) => setTranscriptValidation(prev => ({ ...prev, checkMismatchedWords: e.target.checked }))}
                        className="mr-2"
                      />
                      <label htmlFor="checkMismatched" className="text-sm text-gray-700">
                        Check mismatched words
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="allowPartial"
                        checked={transcriptValidation.allowPartialMatches}
                        onChange={(e) => setTranscriptValidation(prev => ({ ...prev, allowPartialMatches: e.target.checked }))}
                        className="mr-2"
                      />
                      <label htmlFor="allowPartial" className="text-sm text-gray-700">
                        Allow partial matches
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Transcript Validation Settings for Speaking Module */}
      {moduleType === 'SPEAKING' && (
        <div className="mb-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">Transcript Validation Settings</h3>
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="enableValidation"
                checked={transcriptValidation.enabled}
                onChange={(e) => setTranscriptValidation(prev => ({ ...prev, enabled: e.target.checked }))}
                className="mr-2"
              />
              <label htmlFor="enableValidation" className="text-sm text-gray-700">
                Enable transcript validation
              </label>
            </div>
            
            {transcriptValidation.enabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Similarity Tolerance
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="1.0"
                    step="0.1"
                    value={transcriptValidation.tolerance}
                    onChange={(e) => setTranscriptValidation(prev => ({ ...prev, tolerance: parseFloat(e.target.value) }))}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-500">{Math.round(transcriptValidation.tolerance * 100)}%</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="checkMismatched"
                      checked={transcriptValidation.checkMismatchedWords}
                      onChange={(e) => setTranscriptValidation(prev => ({ ...prev, checkMismatchedWords: e.target.checked }))}
                      className="mr-2"
                    />
                    <label htmlFor="checkMismatched" className="text-sm text-gray-700">
                      Check mismatched words
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="allowPartial"
                      checked={transcriptValidation.allowPartialMatches}
                      onChange={(e) => setTranscriptValidation(prev => ({ ...prev, allowPartialMatches: e.target.checked }))}
                      className="mr-2"
                    />
                    <label htmlFor="allowPartial" className="text-sm text-gray-700">
                      Allow partial matches
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Sentences File
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          {!file ? (
            <div>
              <FaFileAlt className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <input
                type="file"
                accept=".csv,.txt"
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
                or drag and drop a CSV or TXT file here
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
                  Preview
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

      {/* Audio File Upload for Listening Module */}
      {moduleType === 'LISTENING' && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Audio File
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            {!audioFile ? (
              <div>
                <FaVolumeUp className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioFileChange}
                  className="hidden"
                  id="audio-upload"
                />
                <label
                  htmlFor="audio-upload"
                  className="cursor-pointer bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  Choose Audio File
                </label>
                <p className="mt-2 text-sm text-gray-500">
                  MP3, WAV, M4A, or OGG format
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FaVolumeUp className="h-8 w-8 text-green-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">{audioFile.name}</p>
                    <p className="text-xs text-gray-500">
                      {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      const audio = new Audio(URL.createObjectURL(audioFile));
                      audio.play();
                    }}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    <FaPlay className="h-4 w-4" />
                  </button>
                  <button
                    onClick={removeAudioFile}
                    className="text-red-500 hover:text-red-700"
                  >
                    <FaTrash className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
          disabled={!file || !selectedLevel || uploading || (moduleType === 'LISTENING' && !audioFile)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Uploading...
            </>
          ) : (
            'Upload Sentences'
          )}
        </button>
      </div>

      {/* Preview Modal */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-lg">Preview Sentences</h4>
              <button 
                onClick={() => setIsPreviewModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            
            <div className="max-h-96 overflow-y-auto mb-4">
              <div className="grid grid-cols-1 gap-2">
                {previewSentences.map((sentence, i) => (
                  <div 
                    key={i} 
                    className={`p-3 rounded border ${
                      sentence.status === 'New' ? 'bg-green-50 border-green-200' :
                      sentence.status === 'Duplicate' ? 'bg-yellow-50 border-yellow-200' :
                      'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className={`text-sm ${
                          sentence.status === 'New' ? 'text-green-800' :
                          sentence.status === 'Duplicate' ? 'text-yellow-800' :
                          'text-red-800'
                        }`}>
                          {sentence.text}
                        </p>
                        {sentence.error && (
                          <p className="text-xs text-red-600 mt-1">{sentence.error}</p>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ml-2 ${
                        sentence.status === 'New' ? 'bg-green-200 text-green-800' :
                        sentence.status === 'Duplicate' ? 'bg-yellow-200 text-yellow-800' :
                        'bg-red-200 text-red-800'
                      }`}>
                        {sentence.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <span className="text-green-600 font-medium">
                  {previewSentences.filter(s => s.status === 'New').length} new
                </span>
                {' • '}
                <span className="text-yellow-600 font-medium">
                  {previewSentences.filter(s => s.status === 'Duplicate').length} duplicate
                </span>
                {' • '}
                <span className="text-red-600 font-medium">
                  {previewSentences.filter(s => s.status === 'Invalid').length} invalid
                </span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsPreviewModalOpen(false)} 
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConfirmPreview}
                  disabled={previewSentences.filter(s => s.status === 'New').length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  Upload Valid Sentences
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SentenceUpload; 