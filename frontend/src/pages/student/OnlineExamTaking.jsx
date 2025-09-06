import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

const OnlineExamTaking = () => {
  const { examId } = useParams();
  const { error: showError, success } = useNotification();
  const [questions, setQuestions] = useState([]);
  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [cheatWarning, setCheatWarning] = useState(false);
  const [cheatCount, setCheatCount] = useState(0);
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const examRef = useRef(null);
  const navigate = useNavigate();
  const [startTime, setStartTime] = useState(null);
  const [assignmentId, setAssignmentId] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [examDuration, setExamDuration] = useState(0);
  const [timerWarning, setTimerWarning] = useState(false);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    const fetchExam = async () => {
      try {
        setLoading(true);
        // First, get the test details to check if it's a random assignment test
        try {
          const testRes = await api.get(`/student/test/${examId}`);
          const testData = testRes.data.data;
          
          // Set exam duration from the test data
          const duration = testData.duration || 0;
          setExamDuration(duration);
          setTimeRemaining(duration * 60); // Convert minutes to seconds
          
          // Log duration for debugging
          console.log('Exam duration set to:', duration, 'minutes');
          
          // Check if this is a random assignment test
          if (testData.test_type === 'random_assignment' || testData.has_random_questions) {
            // Try to get the random assignment
            try {
              const res = await api.get(`/student/test/${examId}/random-assignment`);
              setExam(res.data.data);
              setQuestions(res.data.data.questions || []);
              setAssignmentId(res.data.data.assignment_id);
            } catch (randomErr) {
              // If random assignment fails, fall back to regular test
              console.log('Random assignment failed, using regular test:', randomErr);
              setExam(testData);
              setQuestions(testData.questions || []);
              setAssignmentId(null);
            }
          } else {
            // Regular online test - use regular test endpoint
            setExam(testData);
            setQuestions(testData.questions || []);
            setAssignmentId(null);
            
            // Start the test to get attempt_id for regular tests
            try {
              const startRes = await api.post(`/student/tests/${examId}/start`);
              setAttemptId(startRes.data.data.attempt_id);
              console.log('Test started with attempt_id:', startRes.data.data.attempt_id);
            } catch (startErr) {
              console.error('Error starting test:', startErr);
              showError('Failed to start test. Please try again.');
            }
          }
        } catch (err) {
          throw err; // Re-throw to be caught by outer catch
        }
      } catch (err) {
        showError('Failed to load exam.');
        setExam(null);
      } finally {
        setLoading(false);
      }
    };
    if (examId) fetchExam();
  }, [examId, showError]);

  useEffect(() => {
    // Anti-cheating: Prevent tab switching
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setCheatWarning(true);
        setCheatCount(prev => prev + 1);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Prevent copy/cut/paste and text selection
    const preventAction = (e) => e.preventDefault();
    const examNode = examRef.current;
    if (examNode) {
      examNode.addEventListener('copy', preventAction);
      examNode.addEventListener('cut', preventAction);
      examNode.addEventListener('paste', preventAction);
      examNode.addEventListener('contextmenu', preventAction);
      examNode.addEventListener('selectstart', preventAction);
    }
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (examNode) {
        examNode.removeEventListener('copy', preventAction);
        examNode.removeEventListener('cut', preventAction);
        examNode.removeEventListener('paste', preventAction);
        examNode.removeEventListener('contextmenu', preventAction);
        examNode.removeEventListener('selectstart', preventAction);
      }
    };
  }, []);

  // Auto-submit after 2 warnings or when time runs out
  useEffect(() => {
    if (cheatCount >= 2 && !autoSubmitted) {
      setAutoSubmitted(true);
      handleSubmit();
    }
  }, [cheatCount, autoSubmitted]);

  // Auto-submit when time runs out (only if timer is active and properly initialized)
  useEffect(() => {
    if (isTimerActive && timeRemaining <= 0 && examDuration > 0 && !autoSubmitted) {
      setAutoSubmitted(true);
      handleSubmit();
    }
  }, [timeRemaining, isTimerActive, examDuration, autoSubmitted]);

  // Timer persistence - save timer state to localStorage
  useEffect(() => {
    if (isTimerActive && timeRemaining > 0) {
      localStorage.setItem(`exam_timer_${examId}`, JSON.stringify({
        timeRemaining,
        startTime: startTime,
        examDuration
      }));
    }
  }, [timeRemaining, isTimerActive, examId, startTime, examDuration]);

  // Load timer state from localStorage on component mount
  useEffect(() => {
    if (examId && examDuration > 0) {
      const savedTimer = localStorage.getItem(`exam_timer_${examId}`);
      if (savedTimer) {
        try {
          const timerData = JSON.parse(savedTimer);
          const elapsed = startTime ? (Date.now() - startTime) / 1000 : 0;
          const remaining = Math.max(0, timerData.timeRemaining - elapsed);
          console.log('Loading timer from localStorage:', { timerData, elapsed, remaining });
          setTimeRemaining(remaining);
          if (remaining > 0) {
            setIsTimerActive(true);
          }
        } catch (err) {
          console.error('Error loading timer state:', err);
        }
      }
    }
  }, [examId, examDuration, startTime]);

  // Clean up localStorage when exam is submitted
  useEffect(() => {
    return () => {
      if (examId) {
        localStorage.removeItem(`exam_timer_${examId}`);
      }
    };
  }, [examId]);

  useEffect(() => {
    if (!loading && questions.length > 0 && !startTime) {
      setStartTime(Date.now());
      setIsTimerActive(true);
      console.log('Timer activated. Duration:', examDuration, 'minutes, Time remaining:', timeRemaining, 'seconds');
    }
  }, [loading, questions, startTime, examDuration, timeRemaining]);

  // Timer countdown effect
  useEffect(() => {
    if (isTimerActive && timeRemaining > 0) {
      console.log('Starting timer countdown. Initial time:', timeRemaining);
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          const newTime = prev - 1;
          
          // Show warning when 5 minutes or less remain
          if (newTime <= 300 && !timerWarning) {
            setTimerWarning(true);
            showError('Warning: Only 5 minutes remaining!');
          }
          
          // Show critical warning when 1 minute remains
          if (newTime <= 60 && newTime > 0) {
            showError(`Critical: Only ${newTime} seconds remaining!`);
          }
          
          // Auto-submit when time runs out
          if (newTime <= 0) {
            console.log('Time expired, auto-submitting...');
            setIsTimerActive(false);
            setAutoSubmitted(true);
            handleSubmit();
            return 0;
          }
          
          return newTime;
        });
      }, 1000);
    } else if (timeRemaining <= 0 && examDuration > 0) {
      console.log('Timer stopped. Time remaining:', timeRemaining, 'Exam duration:', examDuration);
      setIsTimerActive(false);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTimerActive, timeRemaining, timerWarning, showError, examDuration]);

  // Format time for display (clean MM:SS format)
  const formatTime = (seconds) => {
    const totalSeconds = Math.floor(seconds); // Remove any decimal places
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    try {
      // Stop the timer
      setIsTimerActive(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      const endTime = Date.now();
      const timeTakenMs = startTime ? endTime - startTime : null;

      if (assignmentId) {
        // Submit using random assignment endpoint
        console.log('Submitting via random assignment endpoint with assignment_id:', assignmentId);
        const payload = {
          assignment_id: assignmentId,
          answers: answers,
          time_taken_ms: timeTakenMs
        };
        const res = await api.post(`/student/test/${examId}/submit-random`, payload);
        if (res.data.success) {
          success('Exam submitted successfully!');
          navigate('/student/history');
        } else {
          showError(res.data.message || 'Failed to submit your answers.');
        }
      } else {
        // Submit using regular test endpoint (for tests without random questions)
        console.log('Submitting via regular test endpoint for test_id:', examId);
        
        if (!attemptId) {
          // If we don't have an attempt_id, try to start the test first
          try {
            const startRes = await api.post(`/student/tests/${examId}/start`);
            setAttemptId(startRes.data.data.attempt_id);
            console.log('Got attempt_id during submit:', startRes.data.data.attempt_id);
          } catch (startErr) {
            console.error('Error starting test during submit:', startErr);
            showError('Failed to start test. Please try again.');
            return;
          }
        }
        
        const payload = {
          attempt_id: attemptId,
          answers: answers,
          time_taken_ms: timeTakenMs
        };
        const res = await api.post(`/student/tests/${examId}/submit`, payload);
        if (res.data.success) {
          success('Exam submitted successfully!');
          navigate('/student/history');
        } else {
          showError(res.data.message || 'Failed to submit your answers.');
        }
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to submit your answers. Please try again.');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!exam) return <div className="text-center p-8">Exam not found or unavailable.</div>;
  if (questions.length === 0) return <div className="text-center p-8">This exam has no questions.</div>;

  // Debug logging
  console.log('Exam state:', {
    autoSubmitted,
    isTimerActive,
    timeRemaining,
    examDuration,
    cheatCount,
    questionsLength: questions.length
  });

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <main className="container mx-auto px-4 py-6">
        {/* Header with Timer */}
        <header className="pb-6 mb-6 border-b border-gradient-to-r from-transparent via-slate-200 to-transparent flex justify-between items-center">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-3xl sm:text-4xl font-light text-slate-700 tracking-wide"
          >
            {exam.name}
          </motion.h1>
          <div className="flex items-center space-x-6">
            <motion.span 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-gradient-to-r from-blue-100 to-indigo-100 text-slate-700 px-4 py-2 rounded-full text-sm font-medium shadow-sm border border-blue-200"
            >
              Question {currentQuestionIndex + 1} of {questions.length}
            </motion.span>
            {/* Timer Display - Top Right */}
            {examDuration > 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className={`px-5 py-3 rounded-2xl border-2 font-semibold text-lg shadow-lg backdrop-blur-sm transition-all duration-500 ${
                  timeRemaining <= 300 
                    ? timeRemaining <= 60 
                      ? 'bg-gradient-to-r from-red-50 to-pink-50 border-red-300 text-red-600 animate-pulse shadow-red-200' 
                      : 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-300 text-amber-600 shadow-amber-200'
                    : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300 text-blue-600 shadow-blue-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <motion.svg 
                    className="w-6 h-6" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                    animate={{ rotate: timeRemaining <= 60 ? [0, 10, -10, 0] : 0 }}
                    transition={{ duration: 0.5, repeat: timeRemaining <= 60 ? Infinity : 0 }}
                  >
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </motion.svg>
                  <span className="font-mono tracking-wider">{formatTime(timeRemaining)}</span>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="px-5 py-3 rounded-2xl border-2 font-semibold text-lg bg-gradient-to-r from-slate-50 to-gray-50 border-slate-300 text-slate-600 shadow-lg"
              >
                <div className="flex items-center space-x-3">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <span>No Time Limit</span>
                </div>
              </motion.div>
            )}
          </div>
        </header>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8"
        >
          {/* Warning Messages */}
          {cheatWarning && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl mb-6 text-center shadow-lg"
            >
              <strong className="text-lg">Tab switching or leaving the exam is not allowed!</strong> ({cheatCount} warning{cheatCount > 1 ? 's' : ''})
              {autoSubmitted && <div className="mt-2 font-bold">Exam auto-submitted due to repeated tab switching.</div>}
            </motion.div>
          )}
          {timeRemaining <= 60 && timeRemaining > 0 && !autoSubmitted && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl mb-6 text-center shadow-lg animate-pulse"
            >
              <strong className="text-lg">⚠️ CRITICAL: Only {formatTime(timeRemaining)} remaining!</strong>
              <div className="mt-2 text-sm">Exam will auto-submit when time runs out.</div>
            </motion.div>
          )}
          {timeRemaining <= 300 && timeRemaining > 60 && !timerWarning && !autoSubmitted && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 text-amber-700 px-6 py-4 rounded-2xl mb-6 text-center shadow-lg"
            >
              <strong className="text-lg">⏰ Warning: Only {formatTime(timeRemaining)} remaining!</strong>
              <div className="mt-2 text-sm">Please complete your exam soon.</div>
            </motion.div>
          )}

          {/* Progress Bar */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8"
          >
            <div className="flex justify-between text-sm text-slate-600 mb-3">
              <span className="font-medium">Progress: {Object.keys(answers).length} / {questions.length} answered</span>
              <span className="font-semibold text-slate-700">{Math.round((Object.keys(answers).length / questions.length) * 100)}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
              <motion.div 
                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full shadow-sm"
                initial={{ width: 0 }}
                animate={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Question Area */}
            <div className="lg:col-span-2">
              <motion.div 
                ref={examRef} 
                className="select-none"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <fieldset disabled={autoSubmitted} style={{ opacity: autoSubmitted ? 0.6 : 1 }}>
                  <motion.h3 
                    className="text-2xl font-light mb-8 text-slate-700 leading-relaxed"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  >
                    {currentQuestion.question}
                  </motion.h3>
                  
                  {currentQuestion.question_type === 'mcq' && (
                    <motion.div 
                      className="space-y-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.6, delay: 0.5 }}
                    >
                      {Object.entries(currentQuestion.options).map(([key, value], index) => (
                        <motion.div
                          key={key}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                          className={`border-2 rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${
                            answers[currentQuestion.question_id] === value
                              ? 'border-blue-400 bg-gradient-to-r from-blue-50 to-indigo-50 ring-4 ring-blue-100 shadow-lg scale-[1.02]'
                              : 'border-slate-200 hover:border-blue-300 hover:bg-gradient-to-r hover:from-slate-50 hover:to-blue-50'
                          }`}
                          onClick={() => handleAnswerChange(currentQuestion.question_id, value)}
                        >
                          <div className="flex items-center">
                            <motion.div
                              className={`h-5 w-5 mr-4 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                                answers[currentQuestion.question_id] === value
                                  ? 'border-blue-500 bg-blue-500'
                                  : 'border-slate-300 hover:border-blue-400'
                              }`}
                            >
                              {answers[currentQuestion.question_id] === value && (
                                <motion.div
                                  className="w-2 h-2 bg-white rounded-full"
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ duration: 0.2 }}
                                />
                              )}
                            </motion.div>
                            <input
                              type="radio"
                              name={currentQuestion.question_id}
                              value={value}
                              checked={answers[currentQuestion.question_id] === value}
                              onChange={() => handleAnswerChange(currentQuestion.question_id, value)}
                              className="sr-only"
                            />
                            <span className="font-semibold text-slate-600 mr-3 text-lg">{key}.</span>
                            <span className="text-slate-700 text-lg leading-relaxed">{value}</span>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}

                  {/* Navigation Buttons */}
                  <motion.div 
                    className="flex justify-between mt-10"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                  >
                    <motion.button
                      onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                      disabled={currentQuestionIndex === 0}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-8 py-3 border-2 border-slate-300 text-sm font-medium rounded-2xl text-slate-700 bg-white/80 backdrop-blur-sm hover:bg-gradient-to-r hover:from-slate-50 hover:to-blue-50 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-lg transition-all duration-300"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Previous
                    </motion.button>
                    {currentQuestionIndex === questions.length - 1 ? (
                      <motion.button
                        onClick={handleSubmit}
                        disabled={Object.keys(answers).length !== questions.length || autoSubmitted}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`px-8 py-3 border-2 border-transparent text-sm font-medium rounded-2xl shadow-lg text-white flex items-center transition-all duration-300 ${
                          timeRemaining <= 60 
                            ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 animate-pulse' 
                            : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                        } disabled:bg-gradient-to-r disabled:from-gray-400 disabled:to-gray-500`}
                      >
                        {autoSubmitted ? 'Auto-Submitting...' : 'Submit Exam'}
                        <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </motion.button>
                    ) : (
                      <motion.button
                        onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                        disabled={currentQuestionIndex === questions.length - 1}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-8 py-3 border-2 border-transparent text-sm font-medium rounded-2xl shadow-lg text-white bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 disabled:opacity-50 flex items-center transition-all duration-300"
                      >
                        Next
                        <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </motion.button>
                    )}
                  </motion.div>
                </fieldset>
              </motion.div>
            </div>

            {/* Question Navigation Panel */}
            <motion.div 
              className="lg:col-span-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <div className="bg-white/60 backdrop-blur-sm p-6 rounded-3xl shadow-xl border border-white/20">
                <motion.h5 
                  className="text-center mb-6 font-light text-slate-700 text-lg"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  Question Navigation
                </motion.h5>
                <motion.div 
                  className="grid grid-cols-5 gap-3 mb-6"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                >
                  {questions.map((_, index) => (
                    <motion.button
                      key={index}
                      onClick={() => setCurrentQuestionIndex(index)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className={`w-12 h-12 rounded-2xl text-sm font-medium transition-all duration-300 shadow-lg ${
                        index === currentQuestionIndex
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-blue-200'
                          : answers[questions[index]?.question_id]
                          ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-2 border-green-300 hover:shadow-green-200'
                          : 'bg-white text-slate-700 border-2 border-slate-200 hover:bg-gradient-to-r hover:from-slate-50 hover:to-blue-50 hover:border-blue-300'
                      }`}
                    >
                      {index + 1}
                    </motion.button>
                  ))}
                </motion.div>
                
                {/* Legend */}
                <motion.div 
                  className="mb-6 text-sm text-slate-600 space-y-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                >
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mr-3 shadow-sm"></div>
                    <span className="font-medium">Current Question</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300 rounded-full mr-3"></div>
                    <span className="font-medium">Answered</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-white border-2 border-slate-300 rounded-full mr-3"></div>
                    <span className="font-medium">Not Answered</span>
                  </div>
                </motion.div>

                <motion.div 
                  className="space-y-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                >
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full px-4 py-3 text-sm border-2 border-slate-200 rounded-2xl bg-white/80 backdrop-blur-sm hover:bg-gradient-to-r hover:from-slate-50 hover:to-blue-50 hover:border-blue-300 flex items-center justify-center shadow-lg transition-all duration-300"
                    onClick={() => {
                      // Mark for review functionality (placeholder)
                      console.log('Mark for review');
                    }}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    </svg>
                    Mark for Review
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full px-4 py-3 text-sm border-2 border-slate-200 rounded-2xl bg-white/80 backdrop-blur-sm hover:bg-gradient-to-r hover:from-slate-50 hover:to-red-50 hover:border-red-300 flex items-center justify-center shadow-lg transition-all duration-300"
                    onClick={() => {
                      // Clear response functionality
                      handleAnswerChange(currentQuestion.question_id, '');
                    }}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Clear Response
                  </motion.button>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default OnlineExamTaking; 