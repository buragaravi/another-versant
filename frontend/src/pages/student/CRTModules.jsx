import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../services/api';
import { BrainCircuit, BookOpen, ChevronLeft, CheckCircle, XCircle } from 'lucide-react';

const CRTModules = () => {
  const [view, setView] = useState('main'); // 'main', 'module_list', 'taking_module', 'result'
  const [modules, setModules] = useState([]);
  const [currentModule, setCurrentModule] = useState(null);
  const [moduleList, setModuleList] = useState([]);
  const [moduleResult, setModuleResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const { error: showError, success } = useNotification();
  const { user } = useAuth();

  const resetToMain = () => {
    setView('main');
    setCurrentModule(null);
    setModuleList([]);
    setModuleResult(null);
  };

  const handleSelectModule = async (module) => {
    setLoading(true);
    try {
      // Fetch CRT tests for this module
      const res = await api.get('/student/tests', { 
        params: { 
          module: module.id,
          category: 'CRT'
        } 
      });
      setModuleList(res.data.data);
      setCurrentModule(module);
      setView('module_list');
    } catch (err) {
      showError('Failed to load CRT modules.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPracticeModule = (module) => {
    setCurrentModule(module);
    setView('taking_module');
  };

  const handleModuleSubmit = (result) => {
    setModuleResult(result);
    setView('result');
  };

  const fetchModules = useCallback(async () => {
    try {
      setLoading(true);
      // Define CRT modules
      const crtModules = [
        { id: 'CRT_APTITUDE', name: 'Aptitude', icon: '🧮', color: 'bg-blue-500' },
        { id: 'CRT_REASONING', name: 'Reasoning', icon: '🧩', color: 'bg-green-500' },
        { id: 'CRT_TECHNICAL', name: 'Technical', icon: '⚙️', color: 'bg-purple-500' }
      ];
      setModules(crtModules);
    } catch (err) {
      showError('Failed to load CRT modules.');
      setModules([]);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    if (view === 'main') {
      fetchModules();
    } else if (view === 'module_list' && currentModule) {
      const fetchModules = async () => {
        try {
          setLoading(true);
          const res = await api.get('/student/tests', { 
            params: { 
              module: currentModule.id,
              category: 'CRT'
            } 
          });
          setModuleList(res.data.data);
        } catch (err) {
          showError('Failed to load modules for this category.');
        } finally {
          setLoading(false);
        }
      };
      fetchModules();
    }
  }, [view, currentModule, showError, fetchModules]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner />
        </div>
      );
    }

    switch (view) {
      case 'module_list':
        return <ModuleListView category={currentModule} modules={moduleList} onSelectModule={handleSelectPracticeModule} onBack={() => setView('main')} />;
      case 'taking_module':
        return <ModuleTakingView module={currentModule} onSubmit={handleModuleSubmit} onBack={() => setView('module_list')}/>;
      case 'result':
        return <ResultView result={moduleResult} onBack={() => { setView('module_list'); setModuleResult(null); }} />;
      default: // 'main'
        return <MainView modules={modules} onSelectModule={handleSelectModule} />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {renderContent()}
    </div>
  );
};

const MainView = ({ modules, onSelectModule }) => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-8">CRT Modules</h1>
      <p className="text-gray-600 mb-8 text-lg">Practice Campus Recruitment Test modules to improve your skills.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map(module => (
          <motion.div
            key={module.id}
            whileHover={{ scale: 1.05 }}
            className="bg-white p-8 rounded-2xl shadow-lg flex flex-col items-center text-center cursor-pointer transition-all duration-300 hover:shadow-xl"
            onClick={() => onSelectModule(module)}
          >
            <div className={`w-20 h-20 rounded-full ${module.color} flex items-center justify-center text-white text-3xl mb-6`}>
              {module.icon}
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">{module.name}</h2>
            <p className="text-gray-500 text-base">Practice {module.name.toLowerCase()} questions for campus recruitment.</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

const ModuleListView = ({ category, modules, onSelectModule, onBack }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
    <div className="flex items-center mb-8">
      <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-200 mr-4">
        <ChevronLeft className="h-6 w-6" />
      </button>
      <h1 className="text-3xl font-bold text-gray-800">{category.name} Tests</h1>
    </div>
    
    {modules.length > 0 ? (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map(module => (
          <motion.div
            key={module._id}
            whileHover={{ scale: 1.05 }}
            className="bg-white p-6 rounded-xl shadow-lg cursor-pointer flex flex-col justify-between"
            onClick={() => onSelectModule(module)}
          >
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{module.name}</h3>
              <p className="text-gray-500 text-sm mb-4">Test your {category.name.toLowerCase()} skills.</p>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
                  style={{ width: `${module.highest_score || 0}%` }}
                ></div>
              </div>
              <p className="text-right text-sm text-gray-600 mt-2">
                Best Score: {Math.round(module.highest_score || 0)}%
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    ) : (
      <div className="text-center py-16">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <BookOpen className="h-12 w-12 text-gray-400" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">No Tests Available</h2>
        <p className="text-gray-500">Check back later for new {category.name.toLowerCase()} tests.</p>
      </div>
    )}
  </motion.div>
);

const ModuleTakingView = ({ module, onSubmit, onBack }) => {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const { error: showError, success } = useNotification();

  useEffect(() => {
    const fetchModuleDetails = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/student/test/${module._id}`);
        setQuestions(res.data.data.questions || []);
      } catch (err) {
        showError("Failed to load module questions.");
      } finally {
        setLoading(false);
      }
    };

    if (module?._id) {
      fetchModuleDetails();
    }
  }, [module, showError]);

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    try {
      const formData = new FormData();
      formData.append('test_id', module._id);
      
      Object.entries(answers).forEach(([qid, ans]) => {
        formData.append(`answer_${qid}`, ans);
      });
      
      const res = await api.post('/student/submit-practice-test', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (res.data.success) {
        success("Test submitted successfully!");
        onSubmit(res.data.data);
      } else {
        showError(res.data.message || 'Failed to submit your answers.');
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to submit your answers. Please try again.');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (questions.length === 0) return <div className="text-center p-8">This test has no questions.</div>;

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-200">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">{module.name}</h1>
        <div className="text-sm text-gray-500">
          Question {currentQuestionIndex + 1} of {questions.length}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Question {currentQuestionIndex + 1}</h2>
          <p className="text-lg text-gray-700 mb-6">{currentQuestion.question}</p>
          
          {currentQuestion.options && (
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <label
                  key={index}
                  className={clsx(
                    "flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200",
                    {
                      "border-blue-500 bg-blue-50": answers[currentQuestion._id] === option,
                      "border-gray-200 hover:border-gray-300": answers[currentQuestion._id] !== option
                    }
                  )}
                >
                  <input
                    type="radio"
                    name={`question_${currentQuestion._id}`}
                    value={option}
                    checked={answers[currentQuestion._id] === option}
                    onChange={(e) => handleAnswerChange(currentQuestion._id, e.target.value)}
                    className="sr-only"
                  />
                  <span className="w-6 h-6 border-2 border-gray-300 rounded-full mr-3 flex items-center justify-center">
                    {answers[currentQuestion._id] === option && (
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    )}
                  </span>
                  <span className="text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
            className={clsx(
              "px-6 py-2 rounded-lg font-medium transition-colors",
              {
                "bg-gray-200 text-gray-500 cursor-not-allowed": currentQuestionIndex === 0,
                "bg-blue-500 text-white hover:bg-blue-600": currentQuestionIndex > 0
              }
            )}
          >
            Previous
          </button>

          {currentQuestionIndex === questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              className="px-8 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
            >
              Submit Test
            </button>
          ) : (
            <button
              onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const ResultView = ({ result, onBack }) => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex justify-center items-center mb-8">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-200 mr-4">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="text-3xl font-bold text-gray-800">Test Results</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl mx-auto text-center">
        <div className="mb-8">
          {result.average_score >= 60 ? (
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
          ) : (
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="h-12 w-12 text-red-500" />
            </div>
          )}
          
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {result.average_score >= 60 ? 'Great Job!' : 'Keep Practicing!'}
          </h2>
          
          <div className="text-6xl font-bold mb-4">
            <span className={result.average_score >= 60 ? 'text-green-500' : 'text-red-500'}>
              {Math.round(result.average_score)}%
            </span>
          </div>
          
          <p className="text-gray-600 mb-6">
            You answered {result.correct_answers} out of {result.total_questions} questions correctly.
          </p>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="font-semibold text-gray-700">Correct Answers</div>
              <div className="text-2xl font-bold text-green-500">{result.correct_answers}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="font-semibold text-gray-700">Total Questions</div>
              <div className="text-2xl font-bold text-gray-500">{result.total_questions}</div>
            </div>
          </div>
        </div>
        
        <button
          onClick={onBack}
          className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
        >
          Back to Tests
        </button>
      </div>
    </motion.div>
  );
};

export default CRTModules; 