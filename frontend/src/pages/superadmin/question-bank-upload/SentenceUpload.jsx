import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Upload, 
  Download, 
  AlertCircle, 
  CheckCircle, 
  Headphones, 
  Mic,
  Volume2,
  Play,
  Pause
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api, { uploadSentences } from '../../../services/api';
import { 
  validateFile, 
  parseFile, 
  handleUploadSuccess, 
  handleUploadError, 
  removeFile, 
  withLoading,
  generateCSVTemplate,
  PreviewModal,
  validateRequired,
  validateLength
} from './CommonUploadUtils';

const SentenceUpload = ({ moduleType = 'LISTENING', moduleName, levelId, onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewSentences, setPreviewSentences] = useState([]);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  
  // Audio configuration for Listening module
  const [audioConfig, setAudioConfig] = useState({
    speed: 1.0,
    accent: 'en-US'
  });
  
  // Transcript validation settings
  const [transcriptValidation, setTranscriptValidation] = useState({
    enabled: true,
    tolerance: 0.8, // Similarity threshold
    checkMismatchedWords: true,
    allowPartialMatches: true
  });


  
  const moduleConfig = {
    LISTENING: {
      icon: Headphones,
      title: 'Listening Comprehension',
      description: 'Upload listening comprehension sentences with audio prompts and transcript validation',
      color: 'yellow',
      supportsAudio: true
    },
    SPEAKING: {
      icon: Mic,
      title: 'Speaking Practice',
      description: 'Upload speaking practice sentences with transcript validation',
      color: 'pink',
      supportsAudio: false,
      supportsTranscriptValidation: true
    }
  };

  const config = moduleConfig[moduleType] || moduleConfig.LISTENING;
  const IconComponent = config.icon;

  // Sentence validation
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

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const validation = validateFile(selectedFile, ['csv', 'txt']);
      if (!validation.valid) {
        setError(validation.error);
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const handleAudioFileChange = (e) => {
    const selectedAudioFile = e.target.files[0];
    if (selectedAudioFile) {
      // Validate audio file type and extension
      const validExtensions = ['.mp3', '.wav', '.m4a', '.ogg', '.aac'];
      const validMimeTypes = ['audio/mp3', 'audio/wav', 'audio/m4a', 'audio/ogg', 'audio/aac', 'audio/mpeg'];
      
      const fileExtension = selectedAudioFile.name.toLowerCase().split('.').pop();
      const hasValidExtension = validExtensions.some(ext => selectedAudioFile.name.toLowerCase().endsWith(ext));
      const hasValidMimeType = validMimeTypes.includes(selectedAudioFile.type);
      
      if (!hasValidExtension && !hasValidMimeType) {
        setError('Please upload a valid audio file (MP3, WAV, M4A, OGG, AAC)');
        return;
      }
      
      // Check file size (max 50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (selectedAudioFile.size > maxSize) {
        setError('Audio file size must be less than 50MB');
        return;
      }
      
      setAudioFile(selectedAudioFile);
      setError('');
    }
  };

  const processFileForPreview = async () => {
    if (!file) return;

    try {
      const fileExtension = file.name.toLowerCase().split('.').pop();
      const parsedData = await parseFile(file, fileExtension);
      
      let sentences = [];
      
      if (fileExtension === 'txt') {
        // Parse text file - one sentence per line
        sentences = parsedData
          .filter(line => line.trim())
          .map((line, index) => ({
            sentence: line.trim(),
            level: levelId,
            index: index + 1
          }));
      } else {
        // Parse CSV format
        sentences = parsedData.map((row, index) => ({
          sentence: row.sentence || row.Sentence || row.SENTENCE || row.text || row.Text || row.TEXT || '',
          level: row.level || row.Level || row.LEVEL || levelId,
          instructions: row.instructions || row.Instructions || row.INSTRUCTIONS || '',
          index: index + 1
        }));
      }

      // Validate sentences
      const validatedSentences = sentences.map(sentence => {
        const validation = validateSentence(sentence.sentence);
        return {
          ...sentence,
          status: validation.valid ? 'Valid' : 'Invalid',
          error: validation.error
        };
      });

      setPreviewSentences(validatedSentences);
      setIsPreviewModalOpen(true);
      
      const validCount = validatedSentences.filter(s => s.status === 'Valid').length;
      const invalidCount = validatedSentences.filter(s => s.status === 'Invalid').length;
      
      if (validCount > 0) {
        toast.success(`${validCount} valid sentences found`);
      }
      if (invalidCount > 0) {
        toast.error(`${invalidCount} invalid sentences found`);
      }
      
    } catch (error) {
      setError(`Error processing file: ${error.message}`);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    const validSentences = previewSentences.filter(s => s.status === 'Valid');
    if (validSentences.length === 0) {
      setError('No valid sentences to upload');
      return;
    }

    await withLoading(setUploading, async () => {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('module_id', moduleName);
        formData.append('level_id', levelId);
        formData.append('question_type', 'sentence');
        formData.append('module_type', moduleType);
        
        // Add audio file if present (for listening module)
        if (audioFile && moduleType === 'LISTENING') {
          formData.append('audio_file', audioFile);
        }
        
        // Add configuration
        formData.append('audio_config', JSON.stringify(audioConfig));
        formData.append('transcript_validation', JSON.stringify(transcriptValidation));

        const response = await uploadSentences(formData);

        if (handleUploadSuccess(response, moduleName, levelId)) {
          setSuccess('Upload completed successfully');
          setFile(null);
          setAudioFile(null);
          setIsPreviewModalOpen(false);
          if (onUploadSuccess) {
            onUploadSuccess();
          }
        }
      } catch (error) {
        handleUploadError(error, 'Failed to upload sentences');
      }
    });
  };

  const downloadTemplate = () => {
    const headers = ['Sentence', 'Level', 'Instructions'];
    generateCSVTemplate(headers, `${moduleName}_Sentence_Template.csv`);
  };

  const downloadTextTemplate = () => {
    const template = `The weather is beautiful today.
I love learning new languages.
Can you help me with this question?
The restaurant serves delicious food.
She works as a teacher.`;
    
    const blob = new Blob([template], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${moduleName}_Sentence_Template.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <IconComponent className="h-8 w-8 text-blue-500" />
          <h2 className="text-2xl font-bold text-gray-900">{config.title} - {moduleName}</h2>
        </div>
        <p className="text-gray-600">{config.description}</p>
      </div>



      {/* File Upload Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Upload Sentences</h3>
          <div className="flex space-x-2">
            <button
              onClick={downloadTemplate}
              className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Download className="h-4 w-4" />
              <span>CSV Template</span>
            </button>
            <button
              onClick={downloadTextTemplate}
              className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <FileText className="h-4 w-4" />
              <span>Text Template</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sentence File Upload */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">Upload Sentence File</p>
            <p className="text-sm text-gray-500 mb-4">CSV or TXT format</p>
            <input
              type="file"
              onChange={handleFileChange}
              accept=".csv,.txt"
              className="hidden"
              id="sentence-file-upload"
            />
            <label
              htmlFor="sentence-file-upload"
              className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer"
            >
              Choose File
            </label>
          </div>

          {/* Audio File Upload (for Listening module) */}
          {moduleType === 'LISTENING' && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Volume2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Upload Audio File (Optional)</p>
              <p className="text-sm text-gray-500 mb-4">MP3, WAV, M4A, OGG</p>
              <input
                type="file"
                onChange={handleAudioFileChange}
                accept="audio/*"
                className="hidden"
                id="audio-file-upload"
              />
              <label
                htmlFor="audio-file-upload"
                className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 cursor-pointer"
              >
                Choose Audio
              </label>
            </div>
          )}
        </div>

        {/* File Display */}
        {(file || audioFile) && (
          <div className="mt-4 space-y-2">
            {file && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-gray-500" />
                    <span className="text-sm font-medium">{file.name}</span>
                    <span className="text-xs text-gray-500">
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <button
                    onClick={() => removeFile(setFile, setError, setSuccess)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}

            {audioFile && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Volume2 className="h-5 w-5 text-gray-500" />
                    <span className="text-sm font-medium">{audioFile.name}</span>
                    <span className="text-xs text-gray-500">
                      ({(audioFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <button
                    onClick={() => setAudioFile(null)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-green-700">{success}</span>
            </div>
          </div>
        )}
      </div>

             {/* Configuration Section */}
       {moduleType === 'LISTENING' && (
         <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
           <h3 className="text-lg font-semibold text-gray-900 mb-4">Audio Configuration</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">Speed</label>
               <select
                 value={audioConfig.speed}
                 onChange={(e) => setAudioConfig({...audioConfig, speed: parseFloat(e.target.value)})}
                 className="w-full p-2 border border-gray-300 rounded-lg"
               >
                 <option value={0.5}>0.5x (Slow)</option>
                 <option value={0.75}>0.75x</option>
                 <option value={1.0}>1.0x (Normal)</option>
                 <option value={1.25}>1.25x</option>
                 <option value={1.5}>1.5x (Fast)</option>
               </select>
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">Accent</label>
               <select
                 value={audioConfig.accent}
                 onChange={(e) => setAudioConfig({...audioConfig, accent: e.target.value})}
                 className="w-full p-2 border border-gray-300 rounded-lg"
               >
                 <option value="en-US">American English</option>
                 <option value="en-GB">British English</option>
                 <option value="en-AU">Australian English</option>
               </select>
             </div>
           </div>
         </div>
       )}

      {/* Upload Button */}
      {file && (
        <div className="flex justify-center">
          <button
            onClick={processFileForPreview}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Preview Sentences
          </button>
        </div>
      )}

      {/* Preview Modal */}
      <PreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        title="Sentence Preview"
        onConfirm={handleUpload}
        confirmText="Upload Sentences"
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium">Preview of Sentences</h4>
            <div className="text-sm text-gray-500">
              Level: {levelId} | Showing {previewSentences.length} sentences
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto space-y-3">
            {previewSentences.map((sentence, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  sentence.status === 'Valid' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-sm font-medium">Sentence {sentence.index}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    sentence.status === 'Valid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {sentence.status}
                  </span>
                </div>
                
                <div className="text-sm">
                  <strong>Text:</strong> {sentence.sentence}
                </div>
                
                {sentence.instructions && (
                  <div className="text-sm mt-1">
                    <strong>Instructions:</strong> {sentence.instructions}
                  </div>
                )}
                
                {sentence.error && (
                  <div className="mt-2 text-xs text-red-600">
                    {sentence.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </PreviewModal>
    </div>
  );
};

export default SentenceUpload; 