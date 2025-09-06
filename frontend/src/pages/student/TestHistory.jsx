import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'
import { useNotification } from '../../contexts/NotificationContext'

import LoadingSpinner from '../../components/common/LoadingSpinner'
import api from '../../services/api'
import { BookOpen, BrainCircuit, Award, Calendar, ChevronDown, ChevronUp, Eye } from 'lucide-react'

const TestHistory = () => {
  const { user } = useAuth()
  const { error } = useNotification()
  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState([])
  const [expandedTests, setExpandedTests] = useState(new Set())
  const [selectedAttempt, setSelectedAttempt] = useState(null)

  useEffect(() => {
    fetchTestResults()
  }, [])

  const fetchTestResults = async () => {
    try {
      setLoading(true)
      const response = await api.get('/student/test-history')
      setResults(response.data.data)
    } catch (err) {
      error('Failed to load test history')
    } finally {
      setLoading(false)
    }
  }

  const getModuleIcon = (moduleName) => {
    switch (moduleName) {
      case 'Grammar':
        return <BrainCircuit size={16} className="text-indigo-600" />
      case 'Vocabulary':
        return <BookOpen size={16} className="text-green-600" />
      default:
        return <Award size={16} className="text-blue-600" />
    }
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const formatDateTimeIST = (dateString) => {
    if (!dateString) return 'N/A';
    try {
    const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'Asia/Kolkata',
    });
    } catch (error) {
      console.error('Error formatting date:', error, 'Input:', dateString);
      return 'Invalid Date';
    }
  };

  const toggleTestExpansion = (testId) => {
    const newExpanded = new Set(expandedTests);
    if (newExpanded.has(testId)) {
      newExpanded.delete(testId);
    } else {
      newExpanded.add(testId);
    }
    setExpandedTests(newExpanded);
  };

  const viewAttemptDetails = (attempt) => {
    setSelectedAttempt(attempt);
  };

  const closeAttemptDetails = () => {
    setSelectedAttempt(null);
  };

  if (loading) {
    return <LoadingSpinner size="lg" />
  }

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900">
          Test History
        </h1>
        <p className="mt-2 text-gray-600">
          View your completed tests and detailed results for each attempt
        </p>
      </motion.div>

      <div className="space-y-8">
        {results.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-gray-500 text-lg">No completed tests found.</div>
            <p className="text-gray-400 mt-2">Complete some tests to see your history here.</p>
          </div>
        ) : (
          <>
            {/* Online Tests Section */}
            {results.filter(testGroup => testGroup.test_type === 'online').length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-blue-700 mb-4 flex items-center">
                  <Award className="h-5 w-5 mr-2" />
                  Online Exams
                </h2>
                <div className="space-y-4">
                  {results.filter(testGroup => testGroup.test_type === 'online').map((testGroup) => (
                    <motion.div
                      key={testGroup.test_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-lg shadow-md overflow-hidden"
                    >
                      {/* Test Header */}
                      <div 
                        className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => toggleTestExpansion(testGroup.test_id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              {getModuleIcon(testGroup.module_name)}
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">{testGroup.test_name}</h3>
                                <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                                  <span>{testGroup.module_name}</span>
                                  {testGroup.subcategory && <span>• {testGroup.subcategory}</span>}
                                  <span>• {testGroup.attempt_count} attempt{testGroup.attempt_count !== 1 ? 's' : ''}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                                                <div className="text-right">
                      {(() => {
                        const correctAnswers = testGroup.latest_correct_answers || 0;
                        const totalQuestions = testGroup.total_questions || 0;
                        const calculatedScore = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
                        return (
                          <>
                            <div className={`text-2xl font-bold ${getScoreColor(calculatedScore)}`}>
                              {calculatedScore.toFixed(1)}%
                            </div>
                    <div className="text-sm text-gray-500">
                              {correctAnswers}/{totalQuestions} correct
                            </div>
                          </>
                        );
                      })()}
                    </div>
                            <div className="text-sm text-gray-500">
                    <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                {formatDateTimeIST(testGroup.latest_submitted_at)}
                              </div>
                            </div>
                            <div className="text-gray-400">
                              {expandedTests.has(testGroup.test_id) ? (
                                <ChevronUp className="h-5 w-5" />
                              ) : (
                                <ChevronDown className="h-5 w-5" />
                              )}
                            </div>
                          </div>
                    </div>
                      </div>

                      {/* Expanded Attempts */}
                      {expandedTests.has(testGroup.test_id) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="border-t border-gray-200"
                        >
                          <div className="p-6">
                            <h4 className="text-md font-semibold text-gray-800 mb-4">All Attempts</h4>
                            <div className="space-y-3">
                              {testGroup.attempts.map((attempt, index) => (
                                <div
                                  key={attempt._id}
                                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                  <div className="flex items-center space-x-4">
                                    <div className="text-sm font-medium text-gray-600">
                                      Attempt #{index + 1}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {formatDateTimeIST(attempt.end_time || attempt.submitted_at)}
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center space-x-4">
                                                                <div className="text-right">
                              {(() => {
                                const correctAnswers = attempt.correct_answers || 0;
                                const totalQuestions = attempt.total_questions || 0;
                                const calculatedScore = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
                                return (
                                  <>
                                    <div className={`text-lg font-bold ${getScoreColor(calculatedScore)}`}>
                                      {calculatedScore.toFixed(1)}%
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {correctAnswers}/{totalQuestions} correct
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                                    <button
                                      onClick={() => viewAttemptDetails(attempt)}
                                      className="flex items-center space-x-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                    >
                                      <Eye className="h-4 w-4" />
                                      <span>View Details</span>
                                    </button>
                                  </div>
                                </div>
                              ))}
                      </div>
                    </div>
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </div>
                    </div>
            )}

            {/* Practice Tests Section */}
            {results.filter(testGroup => testGroup.test_type === 'practice').length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-green-700 mb-4 flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Practice Modules
                </h2>
                <div className="space-y-4">
                  {results.filter(testGroup => testGroup.test_type === 'practice').map((testGroup) => (
                    <motion.div
                      key={testGroup.test_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-lg shadow-md overflow-hidden"
                    >
                      {/* Test Header */}
                      <div 
                        className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => toggleTestExpansion(testGroup.test_id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              {getModuleIcon(testGroup.module_name)}
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">{testGroup.test_name}</h3>
                                <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                                  <span>{testGroup.module_name}</span>
                                  {testGroup.subcategory && <span>• {testGroup.subcategory}</span>}
                                  <span>• {testGroup.attempt_count} attempt{testGroup.attempt_count !== 1 ? 's' : ''}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                                                <div className="text-right">
                      {(() => {
                        const correctAnswers = testGroup.latest_correct_answers || 0;
                        const totalQuestions = testGroup.total_questions || 0;
                        const calculatedScore = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
                        return (
                          <>
                            <div className={`text-2xl font-bold ${getScoreColor(calculatedScore)}`}>
                              {calculatedScore.toFixed(1)}%
                            </div>
                    <div className="text-sm text-gray-500">
                              {correctAnswers}/{totalQuestions} correct
                            </div>
                          </>
                        );
                      })()}
                    </div>
                            <div className="text-sm text-gray-500">
                    <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                {formatDateTimeIST(testGroup.latest_submitted_at)}
                              </div>
                            </div>
                            <div className="text-gray-400">
                              {expandedTests.has(testGroup.test_id) ? (
                                <ChevronUp className="h-5 w-5" />
                              ) : (
                                <ChevronDown className="h-5 w-5" />
                              )}
                            </div>
                          </div>
                    </div>
                      </div>

                      {/* Expanded Attempts */}
                      {expandedTests.has(testGroup.test_id) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="border-t border-gray-200"
                        >
                          <div className="p-6">
                            <h4 className="text-md font-semibold text-gray-800 mb-4">All Attempts</h4>
                            <div className="space-y-3">
                              {testGroup.attempts.map((attempt, index) => (
                                <div
                                  key={attempt._id}
                                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                  <div className="flex items-center space-x-4">
                                    <div className="text-sm font-medium text-gray-600">
                                      Attempt #{index + 1}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {formatDateTimeIST(attempt.end_time || attempt.submitted_at)}
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center space-x-4">
                                                                <div className="text-right">
                              {(() => {
                                const correctAnswers = attempt.correct_answers || 0;
                                const totalQuestions = attempt.total_questions || 0;
                                const calculatedScore = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
                                return (
                                  <>
                                    <div className={`text-lg font-bold ${getScoreColor(calculatedScore)}`}>
                                      {calculatedScore.toFixed(1)}%
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {correctAnswers}/{totalQuestions} correct
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                                    <button
                                      onClick={() => viewAttemptDetails(attempt)}
                                      className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                      <Eye className="h-4 w-4" />
                                      <span>View Details</span>
                                    </button>
                                  </div>
                      </div>
                              ))}
                    </div>
                    </div>
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Attempt Details Modal */}
      {selectedAttempt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Attempt Details</h3>
                <button
                  onClick={closeAttemptDetails}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500">Score</div>
                  {(() => {
                    const correctAnswers = selectedAttempt.correct_answers || 0;
                    const totalQuestions = selectedAttempt.total_questions || 0;
                    const calculatedScore = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
                    return (
                      <div className={`text-2xl font-bold ${getScoreColor(calculatedScore)}`}>
                        {calculatedScore.toFixed(1)}%
                      </div>
                    );
                  })()}
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500">Correct Answers</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {selectedAttempt.correct_answers}/{selectedAttempt.total_questions}
                  </div>
                </div>
              </div>

              {selectedAttempt.detailed_results && selectedAttempt.detailed_results.length > 0 && (
                <div>
                  <h4 className="text-md font-semibold text-gray-800 mb-4">Question-wise Results</h4>
                  <div className="space-y-3">
                    {selectedAttempt.detailed_results.map((result, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border-l-4 ${
                          result.is_correct 
                            ? 'bg-green-50 border-green-400' 
                            : 'bg-red-50 border-red-400'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900 mb-2">
                              Question {index + 1}
                            </div>
                            <div className="text-sm text-gray-700 mb-2">
                              {result.question}
                            </div>
                            <div className="text-sm">
                              <span className="text-gray-500">Your answer: </span>
                              <span className={`font-medium ${result.is_correct ? 'text-green-600' : 'text-red-600'}`}>
                                {result.student_answer}
                              </span>
                            </div>
                            {!result.is_correct && (
                              <div className="text-sm mt-1">
                                <span className="text-gray-500">Correct answer: </span>
                                <span className="font-medium text-green-600">
                                  {result.correct_answer_text || result.correct_answer}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className={`ml-4 ${result.is_correct ? 'text-green-600' : 'text-red-600'}`}>
                            {result.is_correct ? (
                              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TestHistory 