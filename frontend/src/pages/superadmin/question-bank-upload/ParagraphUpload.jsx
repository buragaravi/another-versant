import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Upload, 
  Download, 
  AlertCircle, 
  CheckCircle, 
  Edit3,
  Clock,
  Type
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api, { uploadParagraphs } from '../../../services/api';
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

const ParagraphUpload = ({ moduleName, levelId, onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewParagraphs, setPreviewParagraphs] = useState([]);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  const levelConfig = {
    Beginner: {
      backspaceAllowed: true,
      minWords: 50,
      maxWords: 100,
      minChars: 150,
      maxChars: 300,
      timeLimit: 10, // minutes
      description: 'Basic writing with backspace allowed',
      color: 'green'
    },
    Intermediate: {
      backspaceAllowed: false,
      minWords: 80,
      maxWords: 150,
      minChars: 250,
      maxChars: 450,
      timeLimit: 8, // minutes
      description: 'Intermediate writing without backspace',
      color: 'yellow'
    },
    Advanced: {
      backspaceAllowed: false,
      minWords: 120,
      maxWords: 200,
      minChars: 400,
      maxChars: 600,
      timeLimit: 6, // minutes
      description: 'Advanced writing without backspace, strict time limit',
      color: 'red'
    }
  };

  // Normalize levelId to match levelConfig keys
  const normalizeLevelId = (id) => {
    if (!id) return null;
    
    // Handle cases like "WRITING_BEGINNER" -> "Beginner"
    if (typeof id === 'string') {
      const parts = id.split('_');
      if (parts.length > 1) {
        const levelPart = parts[parts.length - 1]; // Get the last part
        return levelPart.charAt(0).toUpperCase() + levelPart.slice(1).toLowerCase();
      }
      // Handle direct level names
      return id.charAt(0).toUpperCase() + id.slice(1).toLowerCase();
    }
    return id;
  };

  const normalizedLevelId = normalizeLevelId(levelId);

  // Debug logging to help identify levelId issues
  console.log('ParagraphUpload - original levelId:', levelId, 'type:', typeof levelId);
  console.log('ParagraphUpload - normalized levelId:', normalizedLevelId);
  console.log('ParagraphUpload - available levels:', Object.keys(levelConfig));
  console.log('ParagraphUpload - levelConfig[normalizedLevelId]:', levelConfig[normalizedLevelId]);

  // Paragraph validation
  const validateParagraph = (text, level) => {
    const normalizedLevel = normalizeLevelId(level);
    const config = levelConfig[normalizedLevel];
    
    if (!config) {
      return {
        isValid: false,
        errors: [`Level configuration not found for: ${level}`],
        warnings: []
      };
    }
    
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

    return {
      valid: errors.length === 0,
      errors,
      stats: {
        characterCount,
        wordCount,
        sentenceCount,
        timeLimit: config.timeLimit,
        backspaceAllowed: config.backspaceAllowed
      }
    };
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

  const processFileForPreview = async () => {
    if (!file) return;

    try {
      const fileExtension = file.name.toLowerCase().split('.').pop();
      const parsedData = await parseFile(file, fileExtension);
      
      let paragraphs = [];
      
      if (fileExtension === 'txt') {
        // Parse text file - paragraphs separated by double newlines
        const text = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsText(file);
        });
        
        const paragraphBlocks = text.split(/\n\s*\n/).filter(block => block.trim());
        paragraphs = paragraphBlocks.map((block, index) => ({
          topic: `Topic ${index + 1}`,
          paragraph: block.trim(),
          level: levelId,
          index: index + 1
        }));
      } else {
        // Parse CSV format
        paragraphs = parsedData.map((row, index) => ({
          topic: row.topic || row.Topic || row.TOPIC || row.title || row.Title || row.TITLE || `Topic ${index + 1}`,
          paragraph: row.paragraph || row.Paragraph || row.PARAGRAPH || row.text || row.Text || row.TEXT || '',
          level: row.level || row.Level || row.LEVEL || levelId,
          instructions: row.instructions || row.Instructions || row.INSTRUCTIONS || '',
          index: index + 1
        }));
      }

      // Validate paragraphs
      const validatedParagraphs = paragraphs.map(paragraph => {
        const validation = validateParagraph(paragraph.paragraph, paragraph.level);
        return {
          ...paragraph,
          status: validation.valid ? 'Valid' : 'Invalid',
          errors: validation.errors,
          stats: validation.stats
        };
      });

      setPreviewParagraphs(validatedParagraphs);
      setIsPreviewModalOpen(true);
      
      const validCount = validatedParagraphs.filter(p => p.status === 'Valid').length;
      const invalidCount = validatedParagraphs.filter(p => p.status === 'Invalid').length;
      
      if (validCount > 0) {
        toast.success(`${validCount} valid paragraphs found`);
      }
      if (invalidCount > 0) {
        toast.error(`${invalidCount} invalid paragraphs found`);
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

    const validParagraphs = previewParagraphs.filter(p => p.status === 'Valid');
    if (validParagraphs.length === 0) {
      setError('No valid paragraphs to upload');
      return;
    }

    await withLoading(setUploading, async () => {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('module_id', moduleName);
        formData.append('level_id', levelId);
        formData.append('question_type', 'paragraph');
        formData.append('writing_config', JSON.stringify(levelConfig));

        const response = await uploadParagraphs(formData);

        if (handleUploadSuccess(response, moduleName, levelId)) {
          setSuccess('Upload completed successfully');
          setFile(null);
          setIsPreviewModalOpen(false);
          if (onUploadSuccess) {
            onUploadSuccess();
          }
        }
      } catch (error) {
        handleUploadError(error, 'Failed to upload paragraphs');
      }
    });
  };

  const downloadTemplate = () => {
    const headers = ['Topic', 'Paragraph', 'Level', 'Instructions'];
    generateCSVTemplate(headers, `${moduleName}_Paragraph_Template.csv`);
  };

  const downloadTextTemplate = () => {
    const template = `Topic: My Favorite Hobby
Paragraph: I have always been passionate about reading books. When I was a child, my parents would read bedtime stories to me every night. As I grew older, I discovered the joy of getting lost in different worlds through literature. Reading has taught me empathy, expanded my vocabulary, and provided me with countless hours of entertainment. I believe that books are windows to other lives and experiences that I might never have the chance to encounter in my own life.

Topic: The Importance of Exercise
Paragraph: Regular physical activity is essential for maintaining good health and well-being. Exercise helps strengthen our muscles and bones, improves cardiovascular health, and boosts our immune system. Beyond the physical benefits, working out also has positive effects on mental health by reducing stress and anxiety. Many people find that exercise helps them sleep better and feel more energetic throughout the day. It's important to find an activity that you enjoy, whether it's running, swimming, yoga, or team sports.`;
    
    const blob = new Blob([template], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${moduleName}_Paragraph_Template.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <Edit3 className="h-8 w-8 text-blue-500" />
          <h2 className="text-2xl font-bold text-gray-900">Writing Paragraph Upload - {moduleName}</h2>
        </div>
        <p className="text-gray-600">
          Upload writing prompts and paragraphs for {moduleName} module. Each level has specific requirements for word count, time limits, and writing restrictions.
        </p>
      </div>

      {/* Level Configuration Display */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Level Configuration: {normalizedLevelId || levelId}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {levelConfig[normalizedLevelId] ? (
            Object.entries(levelConfig[normalizedLevelId]).map(([key, value]) => {
              if (typeof value === 'boolean') return null;
              if (key === 'description' || key === 'color') return null;
              
              return (
                <div key={key} className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    {key.includes('Chars') ? `${value} chars` :
                     key.includes('Words') ? `${value} words` :
                     key.includes('Limit') ? `${value} min` :
                     value}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
              <p className="text-yellow-800">
                Level configuration not found for: <strong>{normalizedLevelId || levelId}</strong>
              </p>
              <p className="text-sm text-yellow-600 mt-1">
                Available levels: {Object.keys(levelConfig).join(', ')}
              </p>
            </div>
          )}
        </div>
        {levelConfig[normalizedLevelId] && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-800">
              <strong>Note:</strong> {levelConfig[normalizedLevelId].description}
            </div>
          </div>
        )}
      </div>

      {/* File Upload Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Upload Paragraphs</h3>
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

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">Upload Paragraph File</p>
          <p className="text-sm text-gray-500 mb-4">CSV or TXT format</p>
          <input
            type="file"
            onChange={handleFileChange}
            accept=".csv,.txt"
            className="hidden"
            id="paragraph-file-upload"
          />
          <label
            htmlFor="paragraph-file-upload"
            className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer"
          >
            Choose File
          </label>
        </div>

        {file && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
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

      {/* Upload Button */}
      {file && (
        <div className="flex justify-center">
          <button
            onClick={processFileForPreview}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Preview Paragraphs
          </button>
        </div>
      )}

      {/* Preview Modal */}
      <PreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        title="Paragraph Preview"
        onConfirm={handleUpload}
        confirmText="Upload Paragraphs"
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium">Preview of Paragraphs</h4>
            <div className="text-sm text-gray-500">
              Level: {levelId} | Showing {previewParagraphs.length} paragraphs
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto space-y-3">
            {previewParagraphs.map((paragraph, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  paragraph.status === 'Valid' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-sm font-medium">Paragraph {paragraph.index}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    paragraph.status === 'Valid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {paragraph.status}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm">
                    <strong>Topic:</strong> {paragraph.topic}
                  </div>
                  <div className="text-sm">
                    <strong>Text:</strong> {paragraph.paragraph.substring(0, 200)}...
                  </div>
                  
                  {paragraph.stats && (
                    <div className="grid grid-cols-3 gap-2 text-xs bg-white p-2 rounded">
                      <div><strong>Words:</strong> {paragraph.stats.wordCount}</div>
                      <div><strong>Chars:</strong> {paragraph.stats.characterCount}</div>
                      <div><strong>Time:</strong> {paragraph.stats.timeLimit}min</div>
                    </div>
                  )}
                </div>
                
                {paragraph.errors && paragraph.errors.length > 0 && (
                  <div className="mt-2 text-xs text-red-600">
                    {paragraph.errors.join(', ')}
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

export default ParagraphUpload; 