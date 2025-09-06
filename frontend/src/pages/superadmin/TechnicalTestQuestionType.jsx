import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Code, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const TechnicalTestQuestionType = ({ onNext, onBack, testData, updateTestData }) => {
  const [questionType, setQuestionType] = useState('compiler');
  const [loading, setLoading] = useState(false);

  const handleQuestionTypeSelect = (type) => {
    setQuestionType(type);
  };

  const handleContinue = async () => {
    setLoading(true);
    try {
      // Update test data with question type
      updateTestData({
        technical_question_type: questionType,
        question_type: questionType
      });
      
      toast.success(`Selected ${questionType === 'compiler' ? 'Compiler-Integrated' : 'MCQ'} questions`);
      onNext();
    } catch (error) {
      console.error('Error updating question type:', error);
      toast.error('Failed to update question type');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Technical Test Question Type</h2>
        <p className="text-gray-600">
          Choose the type of questions for your technical test. This will determine how students will interact with the questions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Compiler-Integrated Option */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`relative cursor-pointer rounded-lg border-2 p-6 transition-all duration-200 ${
            questionType === 'compiler'
              ? 'border-blue-500 bg-blue-50 shadow-lg'
              : 'border-gray-200 hover:border-gray-300 bg-white'
          }`}
          onClick={() => handleQuestionTypeSelect('compiler')}
        >
          <div className="flex items-start space-x-4">
            <div className={`p-3 rounded-full ${
              questionType === 'compiler' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
            }`}>
              <Code className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Compiler-Integrated Questions
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Students write and run code directly in the browser. Questions include test cases and expected outputs.
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-700">Real-time code execution</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-700">Multiple programming languages</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-700">Automatic test case validation</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-700">Immediate feedback</span>
                </div>
              </div>

              <div className="mt-4 p-3 bg-gray-50 rounded-md">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Required CSV Format:</h4>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>• QuestionTitle, ProblemStatement</div>
                  <div>• TestCaseID, Input, ExpectedOutput</div>
                  <div>• Language (python, java, cpp, etc.)</div>
                </div>
              </div>
            </div>
          </div>
          
          {questionType === 'compiler' && (
            <div className="absolute top-4 right-4">
              <CheckCircle className="h-6 w-6 text-blue-500" />
            </div>
          )}
        </motion.div>

        {/* MCQ Option */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`relative cursor-pointer rounded-lg border-2 p-6 transition-all duration-200 ${
            questionType === 'mcq'
              ? 'border-blue-500 bg-blue-50 shadow-lg'
              : 'border-gray-200 hover:border-gray-300 bg-white'
          }`}
          onClick={() => handleQuestionTypeSelect('mcq')}
        >
          <div className="flex items-start space-x-4">
            <div className={`p-3 rounded-full ${
              questionType === 'mcq' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
            }`}>
              <FileText className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                MCQ Questions
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Traditional multiple choice questions for technical concepts. Students select from predefined options.
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-700">Quick assessment</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-700">Concept testing</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-700">Easy to grade</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-700">Standard format</span>
                </div>
              </div>

              <div className="mt-4 p-3 bg-gray-50 rounded-md">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Required CSV Format:</h4>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>• Question, A, B, C, D</div>
                  <div>• Answer (A/B/C/D)</div>
                  <div>• Instructions (optional)</div>
                </div>
              </div>
            </div>
          </div>
          
          {questionType === 'mcq' && (
            <div className="absolute top-4 right-4">
              <CheckCircle className="h-6 w-6 text-blue-500" />
            </div>
          )}
        </motion.div>
      </div>

      {/* Test Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
        <div className="flex items-center space-x-2 mb-3">
          <AlertCircle className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-blue-900">Test Information</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-medium text-blue-800">Test Name:</span>
            <div className="text-blue-900">{testData.test_name || 'Not set'}</div>
          </div>
          <div>
            <span className="font-medium text-blue-800">Module:</span>
            <div className="text-blue-900">{testData.module || 'Not set'}</div>
          </div>
          <div>
            <span className="font-medium text-blue-800">Type:</span>
            <div className="text-blue-900">{testData.test_type || 'Not set'}</div>
          </div>
          <div>
            <span className="font-medium text-blue-800">Question Type:</span>
            <div className="text-blue-900 capitalize">
              {questionType === 'compiler' ? 'Compiler-Integrated' : 'MCQ'}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center">
        <button
          onClick={onBack}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          ← Back
        </button>
        
        <button
          onClick={handleContinue}
          disabled={loading}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Processing...' : 'Continue'}
        </button>
      </div>
    </div>
  );
};

export default TechnicalTestQuestionType; 