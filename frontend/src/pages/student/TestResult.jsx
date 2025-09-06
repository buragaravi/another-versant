import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useNotification } from '../../contexts/NotificationContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import api, { getTestResultById } from '../../services/api'
import { 
  Volume2, 
  AudioLines, 
  CheckCircle, 
  XCircle,
  Award,
  TrendingUp,
  Clock,
  Target,
  BookOpen,
  Activity,
  AlertTriangle,
  BarChart3,
  Download,
  Share2,
  RefreshCw
} from 'lucide-react'

const TestResult = () => {
  const { resultId } = useParams()
  const { error, success } = useNotification()
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState(null)
  const [audioPlayer, setAudioPlayer] = useState(null)
  const [playingIndex, setPlayingIndex] = useState(null)
  const [showAutoSubmitWarning, setShowAutoSubmitWarning] = useState(false)
  const [selectedQuestion, setSelectedQuestion] = useState(null)
  const [showQuestionModal, setShowQuestionModal] = useState(false)

  useEffect(() => {
    fetchResult()
    return () => {
      if (audioPlayer) {
        audioPlayer.pause()
      }
    }
    // eslint-disable-next-line
  }, [resultId])

  useEffect(() => {
    if (result && (result.auto_submitted || result.cheat_detected)) {
      setShowAutoSubmitWarning(true)
    }
  }, [result])

  const fetchResult = async () => {
    try {
      setLoading(true)
      const response = await getTestResultById(resultId)
      setResult(response.data.data)
    } catch (err) {
      error('Failed to load test result')
    } finally {
      setLoading(false)
    }
  }

  const playAudio = (audioUrl, index) => {
    if (audioPlayer) {
      audioPlayer.pause()
    }
    const player = new Audio(`https://{YOUR_S3_BUCKET}.s3.amazonaws.com/${audioUrl}`)
    setAudioPlayer(player)
    setPlayingIndex(index)
    player.onended = () => setPlayingIndex(null)
    player.play()
  }

  const handleViewQuestion = (question) => {
    setSelectedQuestion(question)
    setShowQuestionModal(true)
  }

  const handleShareResult = () => {
    if (navigator.share) {
      navigator.share({
        title: 'My Test Result',
        text: `I scored ${result.score_percentage || result.average_score || 0}% on ${result.test_name}`,
        url: window.location.href
      })
    } else {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(window.location.href)
      success('Result link copied to clipboard!')
    }
  }

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600 bg-green-100 border-green-200'
    if (score >= 70) return 'text-blue-600 bg-blue-100 border-blue-200'
    if (score >= 50) return 'text-yellow-600 bg-yellow-100 border-yellow-200'
    return 'text-red-600 bg-red-100 border-red-200'
  }

  const getScoreIcon = (score) => {
    if (score >= 90) return <Award className="w-5 h-5" />
    if (score >= 70) return <TrendingUp className="w-5 h-5" />
    if (score >= 50) return <Target className="w-5 h-5" />
    return <AlertTriangle className="w-5 h-5" />
  }

  const getPerformanceMessage = (score) => {
    if (score >= 90) return 'Excellent! Outstanding performance!'
    if (score >= 70) return 'Good job! You did well!'
    if (score >= 50) return 'Keep practicing! You can improve!'
    return 'Don\'t give up! Practice makes perfect!'
  }

  if (loading) {
    return <LoadingSpinner size="lg" />
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="py-6">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-gray-600">Result not found.</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="py-6">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Test Result
                  </h1>
                  <p className="text-gray-600">
                    {result.test_name} • {new Date(result.submitted_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleShareResult}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                  <button
                    onClick={fetchResult}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </button>
                </div>
              </div>

              {/* Auto Submit Warning */}
              {showAutoSubmitWarning && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <div>
                      <h3 className="font-medium text-yellow-800">
                        {result.auto_submitted ? 'Test Auto-Submitted' : 'Cheat Detection'}
                      </h3>
                      <p className="text-sm text-yellow-700">
                        {result.auto_submitted 
                          ? 'This test was automatically submitted due to time expiration.'
                          : 'Suspicious activity was detected during this test.'
                        }
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Score Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-xl shadow-lg p-6 border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Your Score</p>
                      <p className={`text-3xl font-bold ${getScoreColor(result.score_percentage || result.average_score || 0)}`}>
                        {result.score_percentage || result.average_score || 0}%
                      </p>
                    </div>
                    <div className={`p-3 rounded-lg ${getScoreColor(result.score_percentage || result.average_score || 0)}`}>
                      {getScoreIcon(result.score_percentage || result.average_score || 0)}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    {getPerformanceMessage(result.score_percentage || result.average_score || 0)}
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-xl shadow-lg p-6 border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Test Duration</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {result.duration || 'N/A'} min
                      </p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Clock className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Time taken to complete the test
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-xl shadow-lg p-6 border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Questions</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {result.total_questions || 'N/A'}
                      </p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-lg">
                      <BookOpen className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Total questions attempted
                  </p>
                </motion.div>
              </div>

              {/* Detailed Results */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-gray-400" />
                    Detailed Results
                  </h2>
                </div>

                <div className="p-6">
                  {result.detailed_results && result.detailed_results.length > 0 ? (
                    <div className="space-y-4">
                      {result.detailed_results.map((question, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900 mb-2">
                                Question {index + 1}
                              </h3>
                              <p className="text-gray-700 text-sm">
                                {question.question || question.original_text}
                              </p>
                            </div>
                            <button
                              onClick={() => handleViewQuestion(question)}
                              className="ml-4 p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Activity className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex items-center gap-4">
                            {question.question_type === 'mcq' ? (
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">Your Answer:</span>
                                <span className={`px-2 py-1 rounded text-sm font-medium ${
                                  question.is_correct 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {question.student_answer || 'N/A'}
                                </span>
                                {question.is_correct ? (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-red-600" />
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">Similarity:</span>
                                <span className={`px-2 py-1 rounded text-sm font-medium ${
                                  (question.similarity_score || 0) >= 80 
                                    ? 'bg-green-100 text-green-800'
                                    : (question.similarity_score || 0) >= 60
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {(question.similarity_score || 0).toFixed(1)}%
                                </span>
                              </div>
                            )}
                          </div>

                          {question.student_audio_url && (
                            <div className="mt-3">
                              <button
                                onClick={() => playAudio(question.student_audio_url, index)}
                                className="flex items-center gap-2 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              >
                                {playingIndex === index ? (
                                  <AudioLines className="w-4 h-4" />
                                ) : (
                                  <Volume2 className="w-4 h-4" />
                                )}
                                {playingIndex === index ? 'Playing...' : 'Play Audio'}
                              </button>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No detailed results available</h3>
                      <p className="text-gray-500">Detailed question analysis is not available for this test.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </main>

        {/* Question Detail Modal */}
        {showQuestionModal && selectedQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900">Question Details</h3>
                <button
                  onClick={() => setShowQuestionModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Question</h4>
                  <p className="text-gray-700">{selectedQuestion.question || selectedQuestion.original_text}</p>
                </div>

                {selectedQuestion.question_type === 'mcq' ? (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Options</h4>
                    <div className="space-y-2">
                      {selectedQuestion.options && Object.entries(selectedQuestion.options).map(([key, value]) => {
                        const isCorrect = key === selectedQuestion.correct_answer
                        const isStudent = key === selectedQuestion.student_answer
                        return (
                          <div
                            key={key}
                            className={`p-3 rounded-lg border-2 ${
                              isCorrect 
                                ? 'border-green-500 bg-green-50 text-green-800' 
                                : isStudent 
                                ? 'border-red-500 bg-red-50 text-red-800'
                                : 'border-gray-200 bg-white text-gray-700'
                            }`}
                          >
                            <span className="font-bold mr-2">{key}.</span>
                            <span>{value}</span>
                            {isCorrect && <span className="ml-2 text-green-600 font-bold">(Correct)</span>}
                            {isStudent && !isCorrect && <span className="ml-2 text-red-600 font-bold">(Your Answer)</span>}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Your Response</h4>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-gray-700 font-mono">{selectedQuestion.student_text}</p>
                    </div>
                    
                    {selectedQuestion.missing_words && selectedQuestion.missing_words.length > 0 && (
                      <div className="mt-3">
                        <h5 className="font-medium text-gray-900 mb-1">Missing Words</h5>
                        <div className="flex flex-wrap gap-1">
                          {selectedQuestion.missing_words.map((word, idx) => (
                            <span key={idx} className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm">
                              {word}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {selectedQuestion.extra_words && selectedQuestion.extra_words.length > 0 && (
                      <div className="mt-3">
                        <h5 className="font-medium text-gray-900 mb-1">Extra Words</h5>
                        <div className="flex flex-wrap gap-1">
                          {selectedQuestion.extra_words.map((word, idx) => (
                            <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                              {word}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        )}
    </div>
  )
}

export default TestResult 