import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'
import { useNotification } from '../../contexts/NotificationContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import api from '../../services/api'
import { BrainCircuit, BookOpen } from 'lucide-react'

const StudentDashboard = () => {
  const { user } = useAuth()
  const { success, error } = useNotification()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [progressData, setProgressData] = useState(null)
  const [grammarResults, setGrammarResults] = useState([])
  const [vocabularyResults, setVocabularyResults] = useState([])
  const [unlockedModules, setUnlockedModules] = useState([])
  const [unlockedLoading, setUnlockedLoading] = useState(true)
  const [unlockedError, setUnlockedError] = useState(null)

  // Helper function to safely format numbers
  const safeToFixed = (value, decimals = 1) => {
    if (typeof value === 'number' && !isNaN(value)) {
      return value.toFixed(decimals)
    }
    const num = parseFloat(value || 0)
    return isNaN(num) ? '0.0' : num.toFixed(decimals)
  }

  const coreModules = [
    { id: 'GRAMMAR', name: 'Grammar', icon: '🧠', color: 'bg-indigo-500' },
    { id: 'VOCABULARY', name: 'Vocabulary', icon: '📚', color: 'bg-green-500' }
  ]

  useEffect(() => {
    fetchDashboardData()
  }, [])

  useEffect(() => {
    const fetchUnlocked = async () => {
      try {
        setUnlockedLoading(true)
        setUnlockedError(null)
        const res = await api.get('/student/unlocked-modules')
        setUnlockedModules(res.data.data || [])
      } catch (e) {
        setUnlockedError('Failed to load unlocked modules.')
      } finally {
        setUnlockedLoading(false)
      }
    }
    fetchUnlocked()
  }, [])

  const fetchDashboardData = async () => {
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
      error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner size="lg" />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900">
            Student Dashboard
          </h1>
          <p className="mt-2 text-gray-600">
            Welcome back, {user?.name}! Ready to improve your English skills?
          </p>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
        >
          <Link
            to="/student/practice"
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border-l-4 border-blue-500"
          >
            <div className="flex items-center mb-4">
              <div className="bg-blue-500 rounded-lg p-2 text-white text-xl">
                📝
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Practice Tests
            </h3>
            <p className="text-gray-600 text-sm">
              Take practice tests to improve your skills
            </p>
          </Link>

          <Link
            to="/student/exams"
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border-l-4 border-green-500"
          >
            <div className="flex items-center mb-4">
              <div className="bg-green-500 rounded-lg p-2 text-white text-xl">
                🎯
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Online Exams
            </h3>
            <p className="text-gray-600 text-sm">
              Scheduled exams and assessments
            </p>
          </Link>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Your Progress */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Your Progress</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {coreModules.map((coreModule) => {
                  const moduleProgress = progressData?.modules?.find(m => m.module_name === coreModule.id)
                  const progressPercentage = moduleProgress?.progress_percentage || 0
                  const highestScore = moduleProgress?.highest_score || 0
                  
                  return (
                    <div key={coreModule.id} className="text-center">
                      <div className={`rounded-lg p-4 text-white text-3xl mb-3 ${coreModule.color}`}>
                        {coreModule.icon}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {coreModule.name}
                      </h3>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${coreModule.color}`}
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{safeToFixed(progressPercentage)}% Complete</p>
                      <p className="text-xs text-gray-500">Best: {safeToFixed(highestScore)}%</p>
                    </div>
                  )
                })}
              </div>
            </motion.div>

            {/* Grammar Progress */}
            {grammarResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <BrainCircuit className="h-6 w-6 text-indigo-600 mr-2" />
                  Grammar Progress
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {grammarResults.map((category, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-900">{category.subcategory_display_name}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          category.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {category.status === 'completed' ? 'Completed' : 'In Progress'}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div
                          className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${category.highest_score}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Best: {safeToFixed(category.highest_score)}%</span>
                        <span>{category.total_attempts} attempts</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
              <div className="space-y-4">
                {progressData?.recent_activity?.slice(0, 5).map((activity, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3" />
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
                {(!progressData?.recent_activity || progressData.recent_activity.length === 0) && (
                  <div className="text-center py-4">
                    <p className="text-gray-500">No recent activity. Start practicing to see your progress!</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Vocabulary Progress */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <BookOpen className="h-6 w-6 text-green-600 mr-2" />
                Vocabulary Progress
              </h2>
              {vocabularyResults.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {vocabularyResults.map((level, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-900">{level.level_display_name} Level</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          level.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {level.status === 'completed' ? 'Completed' : 'In Progress'}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${level.highest_score}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Best: {safeToFixed(level.highest_score)}%</span>
                        <span>{level.total_attempts} attempts</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p>No vocabulary tests taken yet.</p>
                  <p className="text-sm mt-1">Your progress will appear here once you complete a test.</p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StudentDashboard 