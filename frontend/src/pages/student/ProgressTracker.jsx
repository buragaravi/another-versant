import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNotification } from '../../contexts/NotificationContext'

import LoadingSpinner from '../../components/common/LoadingSpinner'
import api from '../../services/api'
import { BookOpen, BrainCircuit, TrendingUp, Award, Clock, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react'

const ProgressTracker = () => {
  const [loading, setLoading] = useState(true)
  const [progressData, setProgressData] = useState(null)
  const [grammarResults, setGrammarResults] = useState([])
  const [vocabularyResults, setVocabularyResults] = useState([])
  const [expandedSections, setExpandedSections] = useState({})
  const { error } = useNotification()

  // Helper function to safely format numbers
  const safeToFixed = (value, decimals = 1) => {
    if (typeof value === 'number' && !isNaN(value)) {
      return value.toFixed(decimals)
    }
    const num = parseFloat(value || 0)
    return isNaN(num) ? '0.0' : num.toFixed(decimals)
  }

  useEffect(() => {
    fetchProgressData()
  }, [])

  const fetchProgressData = async () => {
    try {
      setLoading(true)
      const [summaryRes, grammarRes, vocabularyRes] = await Promise.all([
        api.get('/student/progress-summary'),
        api.get('/student/grammar-detailed-results'),
        api.get('/student/vocabulary-detailed-results')
      ])
      
      setProgressData(summaryRes.data.data)
      setGrammarResults(grammarRes.data.data)
      setVocabularyResults(vocabularyRes.data.data)
    } catch (err) {
      error('Failed to load progress data')
    } finally {
      setLoading(false)
    }
  }

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }

  const getStatusColor = (status) => {
    return status === 'completed' ? 'text-green-600' : 'text-yellow-600'
  }

  const getStatusIcon = (status) => {
    return status === 'completed' ? <CheckCircle size={16} /> : <XCircle size={16} />
  }

  if (loading) {
    return <LoadingSpinner size="lg" />
  }

  if (!progressData) {
    return (
      <div className="max-w-2xl mx-auto">
        <p className="text-gray-600">No progress data found.</p>
      </div>
    )
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
          Progress Tracker
        </h1>
        <p className="mt-2 text-gray-600">
          Track your detailed progress across all practice modules
        </p>
      </motion.div>

      {/* Overall Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
      >
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="bg-blue-500 rounded-lg p-3 text-white">
              <BookOpen size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Practice Tests</p>
              <p className="text-2xl font-bold text-gray-900">
                {progressData.total_practice_tests || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="bg-green-500 rounded-lg p-3 text-white">
              <TrendingUp size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Modules</p>
              <p className="text-2xl font-bold text-gray-900">
                {progressData.modules?.length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="bg-purple-500 rounded-lg p-3 text-white">
              <Award size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Best Score</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.max(...(progressData.modules?.map(m => m.highest_score) || [0]))}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="bg-orange-500 rounded-lg p-3 text-white">
              <Clock size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Last Activity</p>
              <p className="text-sm font-bold text-gray-900">
                {progressData.recent_activity?.[0]?.submitted_at ? 
                  new Date(progressData.recent_activity[0].submitted_at).toLocaleDateString() : 
                  'N/A'}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Module Progress Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white rounded-lg shadow-md p-6 mb-8"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Module Progress Overview</h2>
        <div className="space-y-4">
          {progressData.modules?.map((module, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium text-gray-900">{module.module_display_name}</h3>
                <span className="text-sm font-semibold text-gray-600">
                  {module.total_attempts} attempts
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${module.progress_percentage}%` }}
                />
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Progress: {safeToFixed(module.progress_percentage)}%</span>
                <span>Best: {safeToFixed(module.highest_score)}%</span>
                <span>Average: {safeToFixed(module.average_score)}%</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Grammar Results */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-white rounded-lg shadow-md p-6 mb-8"
      >
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => toggleSection('grammar')}
        >
          <div className="flex items-center">
            <BrainCircuit className="h-6 w-6 text-indigo-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Grammar Practice Results</h2>
          </div>
          {expandedSections.grammar ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
        
        {expandedSections.grammar && (
          <div className="mt-6 space-y-4">
            {grammarResults.map((category, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium text-gray-900">
                    {category.subcategory_display_name}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <span className={`flex items-center ${getStatusColor(category.status)}`}>
                      {getStatusIcon(category.status)}
                      <span className="ml-1 text-sm font-medium">
                        {category.status === 'completed' ? 'Completed' : 'Needs Improvement'}
                      </span>
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{category.total_attempts}</p>
                    <p className="text-sm text-gray-600">Attempts</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{safeToFixed(category.highest_score)}%</p>
                    <p className="text-sm text-gray-600">Best Score</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{safeToFixed(category.average_score)}%</p>
                    <p className="text-sm text-gray-600">Average</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">{safeToFixed(category.accuracy)}%</p>
                    <p className="text-sm text-gray-600">Accuracy</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Attempts</h4>
                  <div className="space-y-2">
                    {category.attempts.slice(0, 3).map((attempt, attemptIndex) => (
                      <div key={attemptIndex} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{attempt.test_name}</span>
                        <div className="flex items-center space-x-4">
                          <span className="font-medium">{safeToFixed(attempt?.score)}%</span>
                          <span className="text-gray-500">
                            {new Date(attempt.submitted_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Vocabulary Results */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-white rounded-lg shadow-md p-6 mb-8"
      >
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => toggleSection('vocabulary')}
        >
          <div className="flex items-center">
            <BookOpen className="h-6 w-6 text-green-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Vocabulary Practice Results</h2>
          </div>
          {expandedSections.vocabulary ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
        
        {expandedSections.vocabulary && (
          <div className="mt-6 space-y-4">
            {vocabularyResults.map((level, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium text-gray-900">
                    {level.level_display_name} Level
                  </h3>
                  <div className="flex items-center space-x-2">
                    <span className={`flex items-center ${getStatusColor(level.status)}`}>
                      {getStatusIcon(level.status)}
                      <span className="ml-1 text-sm font-medium">
                        {level.status === 'completed' ? 'Completed' : 'Needs Improvement'}
                      </span>
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{level.total_attempts}</p>
                    <p className="text-sm text-gray-600">Attempts</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{safeToFixed(level.highest_score)}%</p>
                    <p className="text-sm text-gray-600">Best Score</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{safeToFixed(level.average_score)}%</p>
                    <p className="text-sm text-gray-600">Average</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">{safeToFixed(level.accuracy)}%</p>
                    <p className="text-sm text-gray-600">Accuracy</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Attempts</h4>
                  <div className="space-y-2">
                    {level.attempts.slice(0, 3).map((attempt, attemptIndex) => (
                      <div key={attemptIndex} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{attempt.test_name}</span>
                        <div className="flex items-center space-x-4">
                          <span className="font-medium">{safeToFixed(attempt.score)}%</span>
                          <span className="text-gray-500">
                            {new Date(attempt.submitted_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="bg-white rounded-lg shadow-md p-6"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {progressData.recent_activity?.slice(0, 5).map((activity, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                <span className="text-gray-900">Completed practice test</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700">
                  {safeToFixed(activity.average_score)}%
                </span>
                <span className="text-sm text-gray-500">
                  {new Date(activity.submitted_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

export default ProgressTracker 
