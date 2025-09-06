import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

import LoadingSpinner from '../../components/common/LoadingSpinner'
import api from '../../services/api'
import { useNotification } from '../../contexts/NotificationContext'
import { BookText, FileText, AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const OnlineExams = () => {
  const [loading, setLoading] = useState(true)
  const [exams, setExams] = useState([])
  const { error: showError } = useNotification()
  const [now, setNow] = useState(Date.now())
  const navigate = useNavigate()
  const [completedExamIds, setCompletedExamIds] = useState([])

  useEffect(() => {
    const fetchExams = async () => {
      try {
        setLoading(true)
        const response = await api.get('/student/online-exams')
        setExams(response.data.data)
      } catch (err) {
        showError('Failed to load online exams. Please try again later.')
        setExams([])
      } finally {
        setLoading(false)
      }
    }
    fetchExams()
  }, [showError])

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Fetch completed exams for the student
    const fetchCompleted = async () => {
      try {
        const res = await api.get('/student/completed-exams')
        setCompletedExamIds(res.data.data || [])
      } catch {
        setCompletedExamIds([])
      }
    }
    fetchCompleted()
  }, [])

  // Helper to format duration
  const formatDuration = (milliseconds) => {
    const seconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    
    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m ${seconds % 60}s`
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }

  // Helper to get exam status and countdown
  const getExamStatus = (exam) => {
    const start = exam.startDateTime ? new Date(exam.startDateTime) : null
    const end = exam.endDateTime ? new Date(exam.endDateTime) : null
    if (!start || !end) return { status: 'invalid', message: 'Invalid exam timing' }
    if (now < start.getTime()) {
      // Not yet open
      const diff = start.getTime() - now
      return {
        status: 'upcoming',
        message: `Opens in ${formatDuration(diff)}`
      }
    } else if (now > end.getTime()) {
      // Already closed
      return { status: 'closed', message: 'Exam closed' }
    } else {
      // Open
      return { status: 'open', message: 'Exam is open' }
    }
  }

  // Sort exams: open first, then upcoming, then closed
  const sortedExams = exams.slice().sort((a, b) => {
    const aStatus = getExamStatus(a).status
    const bStatus = getExamStatus(b).status
    const order = { open: 0, upcoming: 1, closed: 2, invalid: 3 }
    return order[aStatus] - order[bStatus]
  })

  const handleExamClick = (exam) => {
    if (completedExamIds.includes(exam._id)) {
      showError('You have already submitted this test.');
      return;
    }
    const { status } = getExamStatus(exam);
    if (status === 'open') {
      navigate(`/student/exam/${exam._id}`);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-800">Online Exams</h1>
        <p className="mt-2 text-gray-500">
          View and start your scheduled online exams.
        </p>
          
          <div className="mt-8">
            {loading ? (
              <LoadingSpinner />
            ) : sortedExams.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {sortedExams.map((exam) => {
                  const { status, message } = getExamStatus(exam)
                  return (
                    <motion.div
                      key={exam._id}
                      whileHover={{ scale: 1.05, boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}
                      className="bg-white p-6 rounded-2xl shadow-lg flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                            {exam.module_name}
                          </span>
                          <span className="text-xs font-medium text-gray-500">{exam.level_name}</span>
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 mb-2">{exam.name}</h2>
                        <div className="text-sm text-gray-600 mb-2">
                          {exam.startDateTime && exam.endDateTime ? (
                            <>
                              <span>From: {formatDateTime(exam.startDateTime)}</span><br />
                              <span>To: {formatDateTime(exam.endDateTime)}</span>
                            </>
                          ) : (
                            <span>Timing not set</span>
                          )}
                        </div>
                        <div className="text-xs font-medium mb-2">
                          <span className={
                            status === 'open' ? 'text-green-600' :
                            status === 'upcoming' ? 'text-yellow-600' :
                            'text-red-600'
                          }>
                            {message}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                        <p className="text-sm text-gray-600">
                          {exam.question_count} Questions
                        </p>
                        <button
                          className={
                            `px-4 py-2 text-white text-sm font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ` +
                            (completedExamIds.includes(exam._id)
                              ? 'bg-gray-400 cursor-not-allowed'
                              : status === 'open'
                                ? 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
                                : 'bg-gray-300 cursor-not-allowed')
                          }
                          onClick={() => handleExamClick(exam)}
                          disabled={completedExamIds.includes(exam._id) || status !== 'open'}
                        >
                          {completedExamIds.includes(exam._id)
                            ? 'Test Submitted'
                            : status === 'open'
                              ? 'Start Exam'
                              : status === 'upcoming'
                                ? 'Not Yet Available'
                                : 'Closed'}
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16 px-6 bg-white rounded-2xl shadow-lg"
              >
                <div className="mx-auto bg-gray-100 h-20 w-20 flex items-center justify-center rounded-full">
                  <FileText className="h-12 w-12 text-gray-400" />
                </div>
                <h2 className="mt-6 text-2xl font-semibold text-gray-800">No Online Exams Available</h2>
                <p className="mt-2 text-gray-500">
                  There are currently no online exams scheduled for you. Please check back later.
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    )
}

export default OnlineExams 