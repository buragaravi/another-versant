import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';
import api from '../../services/api';

import LoadingSpinner from '../../components/common/LoadingSpinner';
import { motion } from 'framer-motion';
import { FaKeyboard, FaClock, FaExclamationTriangle, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const WritingTestTaking = () => {
  const { testId } = useParams();
  const { error: showError, success } = useNotification();
  const navigate = useNavigate();
  
  // Test state
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTestStarted, setIsTestStarted] = useState(false);
  const [isTestCompleted, setIsTestCompleted] = useState(false);
  const [results, setResults] = useState(null);
  
  // Writing state
  const [currentText, setCurrentText] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [lastKeyTime, setLastKeyTime] = useState(null);
  const [typingStats, setTypingStats] = useState({
    wordsPerMinute: 0,
    charactersTyped: 0,
    mistakes: 0,
    accuracy: 100
  });
  
  // Validation state
  const [grammarErrors, setGrammarErrors] = useState([]);
  const [spellingErrors, setSpellingErrors] = useState([]);
  const [isValidating, setIsValidating] = useState(false);
  
  // Refs
  const textareaRef = useRef(null);
  const timerRef = useRef(null);
  const validationTimeoutRef = useRef(null);
  
  // Level configuration
  const levelConfig = {
    Beginner: {
      backspaceAllowed: true,
      timeLimit: 10,
      description: 'Basic writing with backspace allowed'
    },
    Intermediate: {
      backspaceAllowed: false,
      timeLimit: 8,
      description: 'Intermediate writing without backspace'
    },
    Advanced: {
      backspaceAllowed: false,
      timeLimit: 6,
      description: 'Advanced writing without backspace'
    }
  };

  useEffect(() => {
    fetchTest();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (validationTimeoutRef.current) clearTimeout(validationTimeoutRef.current);
    };
  }, [testId]);

  useEffect(() => {
    if (isTestStarted && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTestComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTestStarted, timeLeft]);

  const fetchTest = async () => {
    try {
      const response = await api.get(`/student/test/${testId}`);
      const testData = response.data.data;
      setTest(testData);
      
      // Initialize time based on level
      const level = testData.level || 'Beginner';
      const config = levelConfig[level] || levelConfig.Beginner;
      setTimeLeft(config.timeLimit * 60); // Convert to seconds
      
      // Initialize answers
      const initialAnswers = {};
      testData.questions?.forEach((_, index) => {
        initialAnswers[index] = '';
      });
      setAnswers(initialAnswers);
      
    } catch (err) {
      showError('Failed to load writing test');
      navigate('/student/practice');
    } finally {
      setLoading(false);
    }
  };

  const startTest = () => {
    setIsTestStarted(true);
    setStartTime(Date.now());
    setLastKeyTime(Date.now());
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleTextChange = useCallback((e) => {
    const newText = e.target.value;
    const currentTime = Date.now();
    
    // Check backspace restrictions
    const level = test?.level || 'Beginner';
    const config = levelConfig[level] || levelConfig.Beginner;
    
    if (!config.backspaceAllowed && newText.length < currentText.length) {
      // Prevent backspace
      e.preventDefault();
      return;
    }
    
    setCurrentText(newText);
    setAnswers(prev => ({ ...prev, [currentParagraphIndex]: newText }));
    
    // Update typing stats
    const timeDiff = (currentTime - startTime) / 1000 / 60; // minutes
    const words = newText.trim().split(/\s+/).filter(word => word.length > 0);
    const wordsPerMinute = timeDiff > 0 ? words.length / timeDiff : 0;
    
    setTypingStats(prev => ({
      ...prev,
      wordsPerMinute: Math.round(wordsPerMinute),
      charactersTyped: newText.length
    }));
    
    setLastKeyTime(currentTime);
    
    // Debounced grammar validation
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }
    
    validationTimeoutRef.current = setTimeout(() => {
      validateText(newText);
    }, 1000);
  }, [currentText, startTime, currentParagraphIndex, test]);

  const validateText = async (text) => {
    if (!text.trim()) {
      setGrammarErrors([]);
      setSpellingErrors([]);
      return;
    }
    
    setIsValidating(true);
    try {
      const response = await api.post('/test-management/validate-writing', {
        text: text,
        level: test?.level || 'Beginner'
      });
      
      if (response.data.success) {
        setGrammarErrors(response.data.data.grammar_errors || []);
        setSpellingErrors(response.data.data.spelling_errors || []);
        
        // Update typing stats with accuracy
        const totalErrors = (response.data.data.grammar_errors || []).length + 
                           (response.data.data.spelling_errors || []).length;
        const accuracy = Math.max(0, 100 - (totalErrors * 2)); // Each error reduces accuracy by 2%
        
        setTypingStats(prev => ({
          ...prev,
          mistakes: totalErrors,
          accuracy: Math.round(accuracy)
        }));
      }
    } catch (err) {
      console.error('Validation failed:', err);
    } finally {
      setIsValidating(false);
    }
  };

  const handleKeyDown = (e) => {
    const level = test?.level || 'Beginner';
    const config = levelConfig[level] || levelConfig.Beginner;
    
    // Prevent backspace for Intermediate and Advanced levels
    if (!config.backspaceAllowed && e.key === 'Backspace') {
      e.preventDefault();
      return;
    }
    
    // Prevent other navigation keys
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'].includes(e.key)) {
      e.preventDefault();
      return;
    }
  };

  const handleNextParagraph = () => {
    if (currentParagraphIndex < (test?.questions?.length || 0) - 1) {
      setCurrentParagraphIndex(prev => prev + 1);
      setCurrentText(answers[currentParagraphIndex + 1] || '');
      setGrammarErrors([]);
      setSpellingErrors([]);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  };

  const handlePreviousParagraph = () => {
    if (currentParagraphIndex > 0) {
      setCurrentParagraphIndex(prev => prev - 1);
      setCurrentText(answers[currentParagraphIndex - 1] || '');
      setGrammarErrors([]);
      setSpellingErrors([]);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  };

  const handleTestComplete = async () => {
    setIsTestCompleted(true);
    
    try {
      const response = await api.post('/student/submit-writing-test', {
        test_id: testId,
        answers: answers,
        typing_stats: typingStats,
        time_taken: test?.timeLimit * 60 - timeLeft
      });
      
      if (response.data.success) {
        setResults(response.data.data);
        success('Writing test completed successfully!');
      }
    } catch (err) {
      showError('Failed to submit writing test');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Check if device is laptop/desktop
  const isLaptop = window.innerWidth >= 1024;

  if (!isLaptop) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
          <FaExclamationTriangle className="mx-auto h-16 w-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Laptop Required</h2>
          <p className="text-gray-600 mb-6">
            Writing tests can only be taken on a laptop or desktop computer for the best experience.
          </p>
          <button
            onClick={() => navigate('/student/practice')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Practice
          </button>
        </div>
      </div>
    );
  }

  if (loading) return <LoadingSpinner />;
  if (!test) return <div>Test not found</div>;
  if (results) {
    return <WritingTestResults results={results} test={test} onBack={() => navigate('/student/practice')} />;
  }

  const currentParagraph = test.questions?.[currentParagraphIndex];
  const level = test.level || 'Beginner';
  const config = levelConfig[level] || levelConfig.Beginner;
  const progress = ((currentParagraphIndex + 1) / (test.questions?.length || 1)) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="px-6 lg:px-10 py-8">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Test Header */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">{test.name}</h1>
                  <p className="text-gray-600">Level: {level} • {config.description}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <FaClock className="text-red-500" />
                      <span className="font-mono text-lg font-bold">
                        {formatTime(timeLeft)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Paragraph {currentParagraphIndex + 1} of {test.questions?.length || 0}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            {!isTestStarted ? (
              <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                <FaKeyboard className="mx-auto h-16 w-16 text-blue-500 mb-6" />
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Ready to Start Writing Test?</h2>
                <p className="text-gray-600 mb-6">
                  You will have {config.timeLimit} minutes to complete {test.questions?.length || 0} paragraphs.
                  {!config.backspaceAllowed && ' Backspace is disabled for this level.'}
                </p>
                <button
                  onClick={startTest}
                  className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                >
                  Start Test
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Writing Area */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        Topic: {currentParagraph?.topic || 'Writing Task'}
                      </h3>
                      <p className="text-gray-700 mb-4">
                        {currentParagraph?.paragraph || 'Write your response here...'}
                      </p>
                      {currentParagraph?.instructions && (
                        <div className="bg-blue-50 p-3 rounded-lg mb-4">
                          <p className="text-sm text-blue-800">
                            <strong>Instructions:</strong> {currentParagraph.instructions}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <textarea
                      ref={textareaRef}
                      value={currentText}
                      onChange={handleTextChange}
                      onKeyDown={handleKeyDown}
                      placeholder="Start typing your response..."
                      className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none font-mono text-lg"
                      disabled={isTestCompleted}
                    />
                    
                    {/* Navigation */}
                    <div className="flex justify-between mt-4">
                      <button
                        onClick={handlePreviousParagraph}
                        disabled={currentParagraphIndex === 0}
                        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      
                      {currentParagraphIndex === (test.questions?.length || 0) - 1 ? (
                        <button
                          onClick={handleTestComplete}
                          className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Complete Test
                        </button>
                      ) : (
                        <button
                          onClick={handleNextParagraph}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Next
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats Panel */}
                <div className="space-y-6">
                  {/* Typing Stats */}
                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Typing Statistics</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Words per minute:</span>
                        <span className="font-semibold">{typingStats.wordsPerMinute}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Characters typed:</span>
                        <span className="font-semibold">{typingStats.charactersTyped}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Mistakes:</span>
                        <span className="font-semibold text-red-600">{typingStats.mistakes}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Accuracy:</span>
                        <span className={`font-semibold ${
                          typingStats.accuracy >= 90 ? 'text-green-600' :
                          typingStats.accuracy >= 70 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {typingStats.accuracy}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Grammar Errors */}
                  {grammarErrors.length > 0 && (
                    <div className="bg-white rounded-lg shadow-lg p-6">
                      <h3 className="text-lg font-semibold text-red-600 mb-4 flex items-center">
                        <FaTimesCircle className="mr-2" />
                        Grammar Errors ({grammarErrors.length})
                      </h3>
                      <div className="space-y-2">
                        {grammarErrors.map((error, index) => (
                          <div key={index} className="text-sm text-red-700 p-2 bg-red-50 rounded">
                            {error.message}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Spelling Errors */}
                  {spellingErrors.length > 0 && (
                    <div className="bg-white rounded-lg shadow-lg p-6">
                      <h3 className="text-lg font-semibold text-orange-600 mb-4 flex items-center">
                        <FaExclamationTriangle className="mr-2" />
                        Spelling Errors ({spellingErrors.length})
                      </h3>
                      <div className="space-y-2">
                        {spellingErrors.map((error, index) => (
                          <div key={index} className="text-sm text-orange-700 p-2 bg-orange-50 rounded">
                            {error.word} - {error.suggestion}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Level Restrictions */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-800 mb-2">Level Restrictions</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Backspace: {config.backspaceAllowed ? 'Allowed' : 'Disabled'}</li>
                      <li>• Time limit: {config.timeLimit} minutes</li>
                      <li>• Level: {level}</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
      </main>
    </div>
  );
};

// Results Component
const WritingTestResults = ({ results, test, onBack }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="px-6 lg:px-10 py-8">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <FaCheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Writing Test Completed!</h1>
              <p className="text-gray-600">Here are your results</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 mb-4">Overall Performance</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Average WPM:</span>
                    <span className="font-semibold">{results.average_wpm || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Mistakes:</span>
                    <span className="font-semibold text-red-600">{results.total_mistakes || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Overall Accuracy:</span>
                    <span className="font-semibold text-green-600">{results.overall_accuracy || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time Taken:</span>
                    <span className="font-semibold">{Math.floor((results.time_taken || 0) / 60)}:{(results.time_taken || 0) % 60}</span>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-green-800 mb-4">Grammar & Spelling</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Grammar Errors:</span>
                    <span className="font-semibold text-red-600">{results.grammar_errors || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Spelling Errors:</span>
                    <span className="font-semibold text-orange-600">{results.spelling_errors || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Grammar Score:</span>
                    <span className="font-semibold text-green-600">{results.grammar_score || 0}%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={onBack}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
              >
                Back to Practice
              </button>
            </div>
          </div>
      </main>
    </div>
  );
};

export default WritingTestTaking; 