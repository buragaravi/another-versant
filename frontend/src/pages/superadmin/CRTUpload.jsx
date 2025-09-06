import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const CRT_MODULES = [
  { 
    id: 'CRT_APTITUDE', 
    name: 'Aptitude', 
    color: 'from-blue-500 to-blue-600',
    icon: '🧮',
    description: 'Upload aptitude questions covering numerical, verbal, and logical reasoning'
  },
  { 
    id: 'CRT_REASONING', 
    name: 'Reasoning', 
    color: 'from-green-500 to-green-600',
    icon: '🧩',
    description: 'Upload reasoning questions including analytical and critical thinking'
  },
  { 
    id: 'CRT_TECHNICAL', 
    name: 'Technical', 
    color: 'from-purple-500 to-purple-600',
    icon: '⚙️',
    description: 'Upload technical questions covering programming, algorithms, and system design'
  },
];

const CRTUpload = () => {
  const [selectedModule, setSelectedModule] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentStep, setCurrentStep] = useState('modules');
  const [loading, setLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [showFileDetails, setShowFileDetails] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileQuestions, setFileQuestions] = useState([]);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  
  // Topic management states
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [showCreateTopicModal, setShowCreateTopicModal] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [showEditTopicModal, setShowEditTopicModal] = useState(false);
  const [selectedTopicForView, setSelectedTopicForView] = useState(null);
  const [topicQuestions, setTopicQuestions] = useState([]);
  const [viewMode, setViewMode] = useState('upload'); // 'upload', 'topics', 'topic-questions'

  useEffect(() => {
    fetchUploadedFiles();
  }, []);

  // Fetch topics for the selected module
  useEffect(() => {
    if (selectedModule) {
      fetchTopicsForModule();
    }
  }, [selectedModule]);

  // Fetch topics when viewMode changes to 'topics'
  useEffect(() => {
    if (viewMode === 'topics') {
      fetchTopicsForModule();
    }
  }, [viewMode]);

  const fetchTopicsForModule = async () => {
    try {
      console.log('Fetching topics - viewMode:', viewMode, 'selectedModule:', selectedModule);
      const response = await api.get('/test-management/crt-topics');
      if (response.data.success) {
        if (viewMode === 'topics' && !selectedModule) {
          // Show all topics when accessed from main page - group by module
          console.log('Setting all topics:', response.data.data.length);
          setTopics(response.data.data);
        } else {
          // Filter topics for the selected module
          const moduleTopics = response.data.data.filter(topic => 
            topic.module_id === selectedModule
          );
          console.log('Setting module topics:', moduleTopics.length);
          setTopics(moduleTopics);
        }
      }
    } catch (error) {
      console.error('Error fetching topics:', error);
    }
  };

  const handleCreateTopic = async (moduleId = selectedModule) => {
    if (!moduleId || !newTopicName.trim()) {
      toast.error('Please select a module and enter a topic name');
      return;
    }

    try {
      const response = await api.post('/test-management/crt-topics', {
        topic_name: newTopicName.trim(),
        module_id: moduleId
      });

      if (response.data.success) {
        toast.success('Topic created successfully');
        setShowCreateTopicModal(false);
        setNewTopicName('');
        fetchTopicsForModule();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create topic');
    }
  };

  const handleEditTopic = async (topicId, newName) => {
    if (!newName.trim()) {
      toast.error('Please enter a topic name');
      return;
    }

    try {
      const response = await api.put(`/test-management/crt-topics/${topicId}`, {
        topic_name: newName.trim()
      });

      if (response.data.success) {
        toast.success('Topic updated successfully!');
        setShowEditTopicModal(false);
        setEditingTopic(null);
        setNewTopicName('');
        fetchTopicsForModule();
      } else {
        toast.error(response.data.message || 'Failed to update topic');
      }
    } catch (error) {
      console.error('Error updating topic:', error);
      toast.error('Failed to update topic. Please try again.');
    }
  };

  const handleDeleteTopic = async (topicId) => {
    if (!window.confirm('Are you sure you want to delete this topic? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await api.delete(`/test-management/crt-topics/${topicId}`);

      if (response.data.success) {
        toast.success('Topic deleted successfully!');
        fetchTopicsForModule();
        if (selectedTopic === topicId) {
          setSelectedTopic('');
        }
      } else {
        toast.error(response.data.message || 'Failed to delete topic');
      }
    } catch (error) {
      console.error('Error deleting topic:', error);
      toast.error('Failed to delete topic. Please try again.');
    }
  };

  const handleViewTopicQuestions = async (topic) => {
    try {
      setSelectedTopicForView(topic);
      setViewMode('topic-questions');
      
      // Fetch questions for this topic
      const response = await api.get(`/test-management/crt-topics/${topic._id}/questions`);
      if (response.data.success) {
        setTopicQuestions(response.data.data || []);
      } else {
        setTopicQuestions([]);
      }
    } catch (error) {
      console.error('Error fetching topic questions:', error);
      setTopicQuestions([]);
    }
  };

  const handleBackToTopics = () => {
    setViewMode('topics');
    setSelectedTopicForView(null);
    setTopicQuestions([]);
  };

  const handleBackToUpload = () => {
    if (!selectedModule) {
      // If we're in "all topics" view, go back to modules
      setCurrentStep('modules');
      setViewMode('upload');
    } else {
      // If we're in module-specific view, go back to upload
      setViewMode('upload');
    }
    setSelectedTopicForView(null);
    setTopicQuestions([]);
  };

  // Group topics by module for section-wise display
  const groupTopicsByModule = (topics) => {
    const grouped = {
      'CRT_APTITUDE': [],
      'CRT_REASONING': [],
      'CRT_TECHNICAL': []
    };
    
    topics.forEach(topic => {
      if (grouped[topic.module_id]) {
        grouped[topic.module_id].push(topic);
      }
    });
    
    return grouped;
  };

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredQuestions(questions);
    } else {
      const filtered = questions.filter(question =>
        question.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        question.optionA.toLowerCase().includes(searchTerm.toLowerCase()) ||
        question.optionB.toLowerCase().includes(searchTerm.toLowerCase()) ||
        question.optionC.toLowerCase().includes(searchTerm.toLowerCase()) ||
        question.optionD.toLowerCase().includes(searchTerm.toLowerCase()) ||
        question.answer.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredQuestions(filtered);
    }
  }, [questions, searchTerm]);

  const fetchUploadedFiles = async () => {
    try {
      const response = await api.get('/test-management/uploaded-files');
      if (response.data.success) {
        // Filter for CRT files only
        const crtFiles = response.data.data.filter(file => 
          file.module_id === 'CRT' || file.module_id?.startsWith('CRT_')
        );
        
        // Fetch topic names for files that have topic_id
        const filesWithTopicNames = await Promise.all(
          crtFiles.map(async (file) => {
            if (file.topic_id) {
              try {
                const topicResponse = await api.get(`/test-management/crt-topics/${file.topic_id}`);
                if (topicResponse.data.success) {
                  file.topic_name = topicResponse.data.data.topic_name;
                }
              } catch (error) {
                console.error('Error fetching topic name:', error);
                file.topic_name = 'Unknown Topic';
              }
            } else {
              file.topic_name = 'No Topic';
            }
            
            // Add module display name
            const moduleConfig = CRT_MODULES.find(m => m.id === file.module_id);
            file.module_name = moduleConfig ? moduleConfig.name : file.module_id;
            
            return file;
          })
        );
        
        setUploadedFiles(filesWithTopicNames);
      }
    } catch (error) {
      console.error('Error fetching uploaded files:', error);
    }
  };

  const fetchFileQuestions = async (fileId, moduleId, topicId) => {
    try {
      console.log('Fetching questions for file ID:', fileId, 'module:', moduleId, 'topic:', topicId);
      
      // Build URL with query parameters
      let url = `/test-management/uploaded-files/${fileId}/questions`;
      const params = new URLSearchParams();
      if (moduleId) params.append('module_id', moduleId);
      if (topicId) params.append('topic_id', topicId);
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await api.get(url);
      console.log('File questions response:', response.data);
      if (response.data.success) {
        setFileQuestions(response.data.data);
        setShowFileDetails(true);
        console.log('Questions loaded:', response.data.data.length);
      } else {
        console.error('Failed to fetch file questions:', response.data.message);
        toast.error(response.data.message || 'Failed to fetch file questions');
      }
    } catch (error) {
      console.error('Error fetching file questions:', error);
      toast.error('Failed to fetch file questions');
    }
  };

  const fetchExistingQuestionsForModule = async (moduleId, topicId = null) => {
    try {
      let url = `/test-management/existing-questions?module_id=${moduleId}`;
      if (topicId) {
        url += `&topic_id=${topicId}`;
      }
      const response = await api.get(url);
      if (response.data.success) {
        setQuestions(response.data.data);
        setFilteredQuestions(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching existing questions for module:', error);
    }
  };

  const handleModuleSelect = (module) => {
    setSelectedModule(module.id);
    setCurrentStep('upload');
    fetchExistingQuestionsForModule(module.id);
  };

  // Update questions when topic selection changes
  useEffect(() => {
    if (selectedModule && selectedTopic) {
      fetchExistingQuestionsForModule(selectedModule, selectedTopic);
    } else if (selectedModule) {
      fetchExistingQuestionsForModule(selectedModule);
    }
  }, [selectedTopic, selectedModule]);

  const handleViewQuestions = (file) => {
    setSelectedFile(file);
    setCurrentStep('questions');
    fetchFileQuestions(file._id, file.module_id, file.topic_id);
  };

  const handleBackToModules = () => {
    setSelectedModule(null);
    setCurrentStep('modules');
    setQuestions([]);
    setShowFileDetails(false);
    setSelectedFile(null);
    setEditingQuestion(null);
    setShowAddQuestion(false);
  };

  const handleUploadSuccess = () => {
    fetchUploadedFiles();
    if (currentStep === 'upload' && selectedModule) {
      fetchExistingQuestionsForModule(selectedModule);
    }
  };

  const downloadTemplate = () => {
    let templateData;
    
    if (selectedModule === 'CRT_TECHNICAL') {
      templateData = [
        {
          QuestionTitle: 'Perfect Number',
          ProblemStatement: 'Write a program to check whether a given positive integer is a perfect number. A perfect number is a positive integer equal to the sum of its proper divisors except itself.',
          TestCaseID: 'TC1',
          Input: '6',
          ExpectedOutput: '6 is a perfect number',
          Language: 'python'
        },
        {
          QuestionTitle: 'Perfect Number',
          ProblemStatement: 'Write a program to check whether a given positive integer is a perfect number. A perfect number is a positive integer equal to the sum of its proper divisors except itself.',
          TestCaseID: 'TC2',
          Input: '15',
          ExpectedOutput: '15 is not a perfect number',
          Language: 'python'
        },
        {
          QuestionTitle: 'Non-Repeating Elements Array',
          ProblemStatement: 'Write a program to find and print all elements that do not repeat in a given array of integers.',
          TestCaseID: 'TC1',
          Input: '4 5 4 3 6 3 7',
          ExpectedOutput: '5 6 7',
          Language: 'python'
        },
        {
          QuestionTitle: 'Non-Repeating Elements Array',
          ProblemStatement: 'Write a program to find and print all elements that do not repeat in a given array of integers.',
          TestCaseID: 'TC2',
          Input: '1 2 1 2 3 4 5',
          ExpectedOutput: '3 4 5',
          Language: 'python'
        },
        {
          QuestionTitle: 'Non-Repeating Elements Array',
          ProblemStatement: 'Write a program to find and print all elements that do not repeat in a given array of integers.',
          TestCaseID: 'TC3',
          Input: '10 10 20 30 20',
          ExpectedOutput: '30',
          Language: 'python'
        }
      ];
    } else {
      templateData = [
        {
          Question: 'What is the next number in the sequence: 2, 4, 8, 16, ?',
          A: '24',
          B: '32',
          C: '30',
          D: '28',
          Answer: 'B'
        },
        {
          Question: 'If a train travels 120 km in 2 hours, what is its speed?',
          A: '40 km/h',
          B: '50 km/h',
          C: '60 km/h',
          D: '70 km/h',
          Answer: 'C'
        }
      ];
    }

    const csv = Papa.unparse(templateData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${selectedModule.toLowerCase()}_questions_template.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = async (file) => {
    if (!selectedModule) {
      toast.error('Please select a module first');
      return;
    }

    // Check if topic is selected (optional but recommended)
    if (!selectedTopic) {
      const shouldContinue = window.confirm(
        'No topic selected. Questions will be uploaded without a specific topic. Do you want to continue?'
      );
      if (!shouldContinue) {
        return;
      }
    }

    // Validate file type
    const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    const fileExtension = file.name.toLowerCase().split('.').pop();
    const allowedExtensions = ['csv', 'xlsx', 'xls'];
    
    if (!allowedExtensions.includes(fileExtension)) {
      toast.error('Please upload a CSV or Excel file (.csv, .xlsx, .xls)');
      return;
    }

    setLoading(true);
    try {
      let questions = [];
      
      // Parse the file based on module type
      if (selectedModule === 'CRT_TECHNICAL') {
        questions = await parseTechnicalFile(file);
      } else {
        questions = await parseMCQFile(file);
      }

      if (questions.length === 0) {
        toast.error('No valid questions found in the file');
        return;
      }

      // If topic is selected, upload to topic-specific endpoint
      if (selectedTopic) {
        const response = await api.post(`/test-management/crt-topics/${selectedTopic}/questions`, {
          questions: questions
        });

        if (response.data.success) {
          toast.success(`Questions uploaded successfully to topic!`);
          handleUploadSuccess();
        } else {
          toast.error(response.data.message || 'Upload failed');
        }
      } else {
        // Send questions to general CRT endpoint
        const payload = {
          module_id: selectedModule, // selectedModule is already CRT_APTITUDE, CRT_REASONING, or CRT_TECHNICAL
          level_id: selectedModule, // For CRT modules, use module_id as level_id
          questions: questions,
          topic_id: selectedTopic || null // Include topic_id if selected
        };

        const response = await api.post('/test-management/module-question-bank/upload', payload);

        if (response.data.success) {
          toast.success('Questions uploaded successfully!');
          handleUploadSuccess();
        } else {
          toast.error(response.data.message || 'Upload failed');
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed. Please check your file format.');
    } finally {
      setLoading(false);
    }
  };

  const parseTechnicalFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const fileExtension = file.name.toLowerCase().split('.').pop();
          let parsedQuestions = [];

          if (fileExtension === 'csv' || file.type === 'text/csv') {
            const result = Papa.parse(e.target.result, { 
              header: true, 
              skipEmptyLines: true, 
              trimHeaders: true, 
              trimValues: true 
            });
            
            result.data.forEach(row => {
              // Check if this is compiler-integrated format or MCQ format
              const hasCompilerFormat = row.QuestionTitle && row.ProblemStatement && row.TestCaseID && row.Input && row.ExpectedOutput;
              const hasMCQFormat = row.Question && (row.A || row.optionA) && (row.B || row.optionB) && (row.C || row.optionC) && (row.D || row.optionD) && row.Answer;
              
              if (hasCompilerFormat) {
                // Compiler-integrated format
                parsedQuestions.push({
                  question: `${row.QuestionTitle}: ${row.ProblemStatement}`,
                  testCases: row.Input,
                  expectedOutput: row.ExpectedOutput,
                  language: row.Language || 'python',
                  questionType: 'technical',
                  testCaseId: row.TestCaseID,
                  // For compatibility with existing system
                  optionA: 'A',
                  optionB: 'B', 
                  optionC: 'C',
                  optionD: 'D',
                  answer: 'A'
                });
              } else if (hasMCQFormat) {
                // MCQ format for technical questions
                parsedQuestions.push({
                  question: row.Question || row.question || '',
                  optionA: row.A || row.optionA || '',
                  optionB: row.B || row.optionB || '',
                  optionC: row.C || row.optionC || '',
                  optionD: row.D || row.optionD || '',
                  answer: row.Answer || row.answer || '',
                  questionType: 'mcq',
                  instructions: row.instructions || row.Instructions || ''
                });
              } else {
                // Legacy format - try to parse as old technical format
                parsedQuestions.push({
              question: row.Question || row.question || '',
              testCases: row.TestCases || row.testCases || '',
              expectedOutput: row.ExpectedOutput || row.expectedOutput || row.ExpectedOu || '',
              language: row.Language || row.language || 'python',
                  questionType: 'technical',
                  // For compatibility with existing system
              optionA: 'A',
              optionB: 'B',
              optionC: 'C', 
              optionD: 'D',
              answer: 'A'
                });
              }
            });
          } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
            const workbook = XLSX.read(e.target.result, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            jsonData.forEach(row => {
              // Check if this is compiler-integrated format or MCQ format
              const hasCompilerFormat = row.QuestionTitle && row.ProblemStatement && row.TestCaseID && row.Input && row.ExpectedOutput;
              const hasMCQFormat = row.Question && (row.A || row.optionA) && (row.B || row.optionB) && (row.C || row.optionC) && (row.D || row.optionD) && row.Answer;
              
              if (hasCompilerFormat) {
                // Compiler-integrated format
                parsedQuestions.push({
                  question: `${row.QuestionTitle}: ${row.ProblemStatement}`,
                  testCases: row.Input,
                  expectedOutput: row.ExpectedOutput,
                  language: row.Language || 'python',
                  questionType: 'technical',
                  testCaseId: row.TestCaseID,
                  // For compatibility with existing system
                  optionA: 'A',
                  optionB: 'B',
                  optionC: 'C', 
                  optionD: 'D',
                  answer: 'A'
                });
              } else if (hasMCQFormat) {
                // MCQ format for technical questions
                parsedQuestions.push({
                  question: row.Question || row.question || '',
                  optionA: row.A || row.optionA || '',
                  optionB: row.B || row.optionB || '',
                  optionC: row.C || row.optionC || '',
                  optionD: row.D || row.optionD || '',
                  answer: row.Answer || row.answer || '',
                  questionType: 'mcq',
                  instructions: row.instructions || row.Instructions || ''
                });
              } else {
                // Legacy format - try to parse as old technical format
                parsedQuestions.push({
              question: row.Question || row.question || '',
              testCases: row.TestCases || row.testCases || '',
              expectedOutput: row.ExpectedOutput || row.expectedOutput || row.ExpectedOu || '',
              language: row.Language || row.language || 'python',
                  questionType: 'technical',
                  // For compatibility with existing system
              optionA: 'A',
              optionB: 'B',
              optionC: 'C', 
              optionD: 'D',
              answer: 'A'
                });
              }
            });
          }

          const validQuestions = parsedQuestions.filter(q => {
            if (!q || !q.question) return false;
            
            // Check based on question type
            if (q.questionType === 'technical') {
              return q.testCases && q.expectedOutput && q.language;
            } else if (q.questionType === 'mcq') {
              return q.optionA && q.optionB && q.optionC && q.optionD && q.answer;
            } else {
              // Legacy format - check for technical fields
              return q.testCases && q.expectedOutput && q.language;
            }
          });

          resolve(validQuestions);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      
      if (file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')) {
        reader.readAsText(file, 'UTF-8');
      } else {
        reader.readAsArrayBuffer(file);
      }
    });
  };

  const parseMCQFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const fileExtension = file.name.toLowerCase().split('.').pop();
          let parsedQuestions = [];

          if (fileExtension === 'csv' || file.type === 'text/csv') {
            const result = Papa.parse(e.target.result, { 
              header: true, 
              skipEmptyLines: true, 
              trimHeaders: true, 
              trimValues: true 
            });
            
            parsedQuestions = result.data.map(row => ({
              question: row.Question || row.question || '',
              optionA: row.A || row.optionA || '',
              optionB: row.B || row.optionB || '',
              optionC: row.C || row.optionC || '',
              optionD: row.D || row.optionD || '',
              answer: row.Answer || row.answer || ''
            }));
          } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
            const workbook = XLSX.read(e.target.result, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            parsedQuestions = jsonData.map(row => ({
              question: row.Question || row.question || '',
              optionA: row.A || row.optionA || '',
              optionB: row.B || row.optionB || '',
              optionC: row.C || row.optionC || '',
              optionD: row.D || row.optionD || '',
              answer: row.Answer || row.answer || ''
            }));
          }

          const validQuestions = parsedQuestions.filter(q => 
            q.question && q.optionA && q.optionB && q.optionC && q.optionD && q.answer
          );

          resolve(validQuestions);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      
      if (file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')) {
        reader.readAsText(file, 'UTF-8');
      } else {
        reader.readAsArrayBuffer(file);
      }
    });
  };

  const handleDeleteQuestion = async (questionId) => {
    try {
      const response = await api.delete(`/test-management/questions/${questionId}`);
      if (response.data.success) {
        toast.success('Question deleted successfully');
        if (currentStep === 'upload' && selectedModule) {
          fetchExistingQuestionsForModule(selectedModule);
        } else if (currentStep === 'questions' && selectedFile) {
          fetchFileQuestions(selectedFile._id, selectedFile.module_id, selectedFile.topic_id);
        }
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error('Failed to delete question');
    }
  };

  const handleEditQuestion = (question) => {
    setEditingQuestion(question);
  };

  const handleSaveEdit = async (questionData) => {
    try {
      const response = await api.put(`/test-management/questions/${editingQuestion._id}`, questionData);
      if (response.data.success) {
        toast.success('Question updated successfully');
        setEditingQuestion(null);
        if (currentStep === 'upload' && selectedModule) {
          fetchExistingQuestionsForModule(selectedModule);
        } else if (currentStep === 'questions' && selectedFile) {
          fetchFileQuestions(selectedFile._id, selectedFile.module_id, selectedFile.topic_id);
        }
      }
    } catch (error) {
      console.error('Error updating question:', error);
      toast.error('Failed to update question');
    }
  };

  const handleAddQuestion = async (questionData) => {
    try {
      const response = await api.post('/test-management/questions/add', {
        ...questionData,
        module_id: selectedModule
      });
      if (response.data.success) {
        toast.success('Question added successfully');
        setShowAddQuestion(false);
        if (currentStep === 'upload' && selectedModule) {
          fetchExistingQuestionsForModule(selectedModule);
        } else if (currentStep === 'questions' && selectedFile) {
          fetchFileQuestions(selectedFile._id, selectedFile.module_id, selectedFile.topic_id);
        }
      }
    } catch (error) {
      console.error('Error adding question:', error);
      toast.error('Failed to add question');
    }
  };

  const renderModuleCards = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">CRT Question Bank Management</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Upload and manage CRT (Aptitude, Reasoning, Technical) questions for your question bank.
          Select a module to get started.
        </p>
        <div className="mt-6">
          <button
            onClick={() => {
              console.log('Manage All Topics clicked');
              setSelectedModule(null); // Clear selected module to show all topics
              setCurrentStep('upload');
              setViewMode('topics');
              // fetchTopicsForModule will be called by useEffect
            }}
            className="bg-purple-500 text-white px-6 py-3 rounded-md hover:bg-purple-600 transition-colors mr-4"
          >
            Manage All Topics
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {CRT_MODULES.map((module) => (
          <motion.div
            key={module.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 cursor-pointer transition-all duration-300 hover:shadow-xl"
            onClick={() => handleModuleSelect(module)}
          >
            <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${module.color} flex items-center justify-center text-white text-2xl mb-4 mx-auto`}>
              {module.icon}
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">{module.name}</h3>
            <p className="text-gray-600 text-sm text-center">{module.description}</p>
          </motion.div>
        ))}
      </div>

      {/* Uploaded Files Section */}
      {uploadedFiles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-12"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Uploaded Files</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {uploadedFiles.map((file) => (
              <div key={file._id} className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">{file.file_name || file.filename}</span>
                  <span className="text-xs text-gray-500">{new Date(file.uploaded_at || file.upload_date).toLocaleDateString()}</span>
                </div>
                
                {/* Module and Topic Information */}
                <div className="mb-2">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {file.module_name || file.module_id}
                    </span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {file.topic_name || 'No Topic'}
                    </span>
                  </div>
                </div>
                
                <p className="text-xs text-gray-600 mb-3">{file.question_count || 0} questions</p>
                <button
                  onClick={() => handleViewQuestions(file)}
                  className="w-full bg-blue-500 text-white py-2 px-4 rounded-md text-sm hover:bg-blue-600 transition-colors"
                >
                  View Questions
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );

  const renderUploadSection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Upload CRT Questions</h1>
          <p className="text-gray-600">Module: {CRT_MODULES.find(m => m.id === selectedModule)?.name}</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => {
              setViewMode('topics');
              fetchTopicsForModule(); // Fetch topics for this specific module
            }}
            className="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600 transition-colors"
          >
            Manage Topics
          </button>
          <button
            onClick={handleBackToModules}
            className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
          >
            Back to Modules
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Questions</h2>
        
        {/* Topic Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Topic (Optional but Recommended)
          </label>
          <div className="flex space-x-2 mb-2">
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a topic...</option>
              {topics.map(topic => (
                <option key={topic._id} value={topic._id}>
                  {topic.topic_name} ({topic.completion_percentage}% completed)
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowCreateTopicModal(true)}
              className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
            >
              New Topic
            </button>
          </div>
          {topics.length === 0 && (
            <p className="text-sm text-gray-500">
              No topics available. Create a new topic to organize your questions better.
            </p>
          )}
          {selectedTopic && (
            <p className="text-sm text-green-600">
              Selected: {topics.find(t => t._id === selectedTopic)?.topic_name}
            </p>
          )}
        </div>
        
        <div className="mb-6">
          <button
            onClick={downloadTemplate}
            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors mb-4"
          >
            Download Template
          </button>
          <p className="text-sm text-gray-600">
            Download the CSV template to see the required format for uploading questions.
            {selectedModule === 'CRT_TECHNICAL' && (
              <span className="block mt-1">
                <strong>Compiler-integrated format:</strong> QuestionTitle, ProblemStatement, TestCaseID, Input, ExpectedOutput, Language<br/>
                <strong>MCQ format:</strong> Question, A, B, C, D, Answer
              </span>
            )}
          </p>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) handleFileUpload(file);
            }}
            className="hidden"
            id="file-upload"
            disabled={loading}
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer block"
          >
            <div className="text-4xl mb-4">📁</div>
            <p className="text-lg font-medium text-gray-900 mb-2">
              {loading ? 'Uploading...' : 'Click to upload file'}
            </p>
            <p className="text-sm text-gray-600">
              Supports CSV, Excel files
            </p>
          </label>
        </div>
      </div>

      {/* Questions List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Existing Questions</h2>
          <input
            type="text"
            placeholder="Search questions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-4">
          {filteredQuestions.map((question, index) => (
            <div key={question._id || index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">Question {index + 1}</span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditQuestion(question)}
                    className="text-blue-500 hover:text-blue-700 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteQuestion(question._id)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <p className="text-gray-900 mb-2">{question.question}</p>
              
              {selectedModule === 'CRT_TECHNICAL' ? (
                <div className="space-y-2 text-sm">
                  <div className="p-2 bg-gray-50 rounded border">
                    <strong>Test Cases:</strong>
                    <pre className="mt-1 text-xs font-mono bg-white p-2 rounded border">{question.testCases || 'N/A'}</pre>
                  </div>
                  <div className="p-2 bg-gray-50 rounded border">
                    <strong>Expected Output:</strong>
                    <pre className="mt-1 text-xs font-mono bg-white p-2 rounded border">{question.expectedOutput || 'N/A'}</pre>
                  </div>
                  <div className="p-2 bg-gray-50 rounded border">
                    <strong>Language:</strong> {question.language || 'python'}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>A: {question.optionA}</div>
                  <div>B: {question.optionB}</div>
                  <div>C: {question.optionC}</div>
                  <div>D: {question.optionD}</div>
                </div>
              )}
              
              {selectedModule !== 'CRT_TECHNICAL' && (
                <div className="mt-2 text-sm font-medium text-green-600">
                  Answer: {question.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );

  const renderFileDetails = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">File Questions</h1>
          <p className="text-gray-600">{selectedFile?.file_name || selectedFile?.filename}</p>
          <div className="flex items-center space-x-4 mt-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {selectedFile?.module_name || selectedFile?.module_id}
            </span>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {selectedFile?.topic_name || 'No Topic'}
            </span>
            <span className="text-sm text-gray-500">
              {fileQuestions.length} questions
            </span>
          </div>
        </div>
        <button
          onClick={handleBackToModules}
          className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
        >
          Back to Modules
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Questions</h2>
          <input
            type="text"
            placeholder="Search questions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {fileQuestions.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Questions Found</h3>
            <p className="text-gray-600 mb-4">This file doesn't contain any questions or there was an error loading them.</p>
            <div className="text-sm text-gray-500">
              <p>File ID: {selectedFile?._id}</p>
              <p>Module: {selectedFile?.module_id}</p>
              <p>Topic: {selectedFile?.topic_id || 'None'}</p>
              <p>Module Name: {selectedFile?.module_name}</p>
              <p>Topic Name: {selectedFile?.topic_name || 'No Topic'}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {fileQuestions.map((question, index) => (
              <div key={question._id || index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">Question {index + 1}</span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditQuestion(question)}
                      className="text-blue-500 hover:text-blue-700 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(question._id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="text-gray-900 mb-2">{question.question}</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>A: {question.optionA}</div>
                  <div>B: {question.optionB}</div>
                  <div>C: {question.optionC}</div>
                  <div>D: {question.optionD}</div>
                </div>
                <div className="mt-2 text-sm font-medium text-green-600">
                  Answer: {question.answer}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );

  const renderTopicsView = () => {
    const groupedTopics = selectedModule ? { [selectedModule]: topics } : groupTopicsByModule(topics);
    const hasAnyTopics = Object.values(groupedTopics).some(moduleTopics => moduleTopics.length > 0);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Topic Management</h1>
            <p className="text-gray-600">
              {selectedModule 
                ? `Module: ${CRT_MODULES.find(m => m.id === selectedModule)?.name}`
                : 'All CRT Modules'
              }
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowCreateTopicModal(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
            >
              Create New Topic
            </button>
            <button
              onClick={handleBackToUpload}
              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
            >
              {!selectedModule ? 'Back to Modules' : 'Back to Upload'}
            </button>
          </div>
        </div>

        {!hasAnyTopics ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Topics Created Yet</h3>
            <p className="text-gray-600 mb-4">Create your first topic to start organizing questions</p>
            <button
              onClick={() => setShowCreateTopicModal(true)}
              className="bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 transition-colors"
            >
              Create First Topic
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedTopics).map(([moduleId, moduleTopics]) => {
              if (moduleTopics.length === 0) return null;
              
              const moduleInfo = CRT_MODULES.find(m => m.id === moduleId);
              const totalQuestions = moduleTopics.reduce((sum, topic) => sum + (topic.total_questions || 0), 0);
              
              return (
                <div key={moduleId} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center text-white text-lg font-semibold">
                        {moduleInfo?.name?.charAt(0) || 'M'}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">{moduleInfo?.name || moduleId.replace('CRT_', '')}</h2>
                        <p className="text-gray-600">{moduleTopics.length} topics • {totalQuestions} total questions</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {moduleTopics.map((topic) => (
                      <motion.div
                        key={topic._id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="bg-gray-50 rounded-xl border border-gray-200 p-4 cursor-pointer transition-all duration-300 hover:shadow-md hover:border-blue-300"
                        onClick={() => handleViewTopicQuestions(topic)}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                            {topic.topic_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex space-x-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingTopic(topic);
                                setNewTopicName(topic.topic_name);
                                setShowEditTopicModal(true);
                              }}
                              className="text-blue-500 hover:text-blue-700 text-xs p-1"
                              title="Edit topic"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTopic(topic._id);
                              }}
                              className="text-red-500 hover:text-red-700 text-xs p-1"
                              title="Delete topic"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                        
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{topic.topic_name}</h3>
                        <p className="text-sm text-gray-600 mb-3">
                          {topic.description || 'No description provided'}
                        </p>
                        
                        <div className="flex items-center justify-between text-sm mb-3">
                          <span className="text-gray-700 font-medium">
                            📝 {topic.total_questions || 0} questions
                          </span>
                          <span className="text-green-600 font-medium">
                            ✅ {topic.used_questions || 0} used
                          </span>
                        </div>
                        
                        <div className="mt-3 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewTopicQuestions(topic);
                            }}
                            className="w-full bg-blue-500 text-white py-2 px-3 rounded-md text-sm hover:bg-blue-600 transition-colors"
                          >
                            View Questions
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    );
  };

  const renderTopicQuestionsView = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Topic Questions</h1>
          <p className="text-gray-600">
            {selectedTopicForView?.topic_name} - {CRT_MODULES.find(m => m.id === selectedModule)?.name}
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddQuestion(true)}
            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
          >
            Add Question
          </button>
          <button
            onClick={handleBackToTopics}
            className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
          >
            Back to Topics
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Questions in "{selectedTopicForView?.topic_name}"
          </h2>
          <input
            type="text"
            placeholder="Search questions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {topicQuestions.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">❓</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Questions Yet</h3>
            <p className="text-gray-600 mb-4">This topic doesn't have any questions yet.</p>
            <button
              onClick={() => setShowAddQuestion(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
            >
              Add First Question
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {topicQuestions.map((question, index) => (
              <div key={question._id || index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">Question {index + 1}</span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditQuestion(question)}
                      className="text-blue-500 hover:text-blue-700 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(question._id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="text-gray-900 mb-2">{question.question}</p>
                
                {selectedModule === 'CRT_TECHNICAL' ? (
                  <div className="space-y-2 text-sm">
                    <div className="p-2 bg-gray-50 rounded border">
                      <strong>Test Cases:</strong>
                      <pre className="mt-1 text-xs font-mono bg-white p-2 rounded border">{question.testCases || 'N/A'}</pre>
                    </div>
                    <div className="p-2 bg-gray-50 rounded border">
                      <strong>Expected Output:</strong>
                      <pre className="mt-1 text-xs font-mono bg-white p-2 rounded border">{question.expectedOutput || 'N/A'}</pre>
                    </div>
                    <div className="p-2 bg-gray-50 rounded border">
                      <strong>Language:</strong> {question.language || 'python'}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>A: {question.optionA}</div>
                    <div>B: {question.optionB}</div>
                    <div>C: {question.optionC}</div>
                    <div>D: {question.optionD}</div>
                  </div>
                )}
                
                {selectedModule !== 'CRT_TECHNICAL' && (
                  <div className="mt-2 text-sm font-medium text-green-600">
                    Answer: {question.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );

  const renderEditQuestionModal = () => (
    editingQuestion && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Edit Question</h2>
          <EditQuestionForm
            question={editingQuestion}
            onSave={handleSaveEdit}
            onCancel={() => setEditingQuestion(null)}
            selectedModule={selectedModule}
          />
        </div>
      </div>
    )
  );

  const renderAddQuestionModal = () => (
    showAddQuestion && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Question</h2>
          <AddQuestionForm
            onSave={handleAddQuestion}
            onCancel={() => setShowAddQuestion(false)}
            selectedModule={selectedModule}
          />
        </div>
      </div>
    )
  );

  return (
    <>
        <div className="px-4 mt-6">
          {currentStep === 'modules' && renderModuleCards()}
          {currentStep === 'upload' && (
            <>
              {viewMode === 'topics' && renderTopicsView()}
              {viewMode === 'topic-questions' && renderTopicQuestionsView()}
              {viewMode === 'upload' && renderUploadSection()}
            </>
          )}
          {currentStep === 'questions' && renderFileDetails()}
      </div>
      {renderEditQuestionModal()}
      {renderAddQuestionModal()}
      <CreateTopicModal
        isOpen={showCreateTopicModal}
        onClose={() => {
          setShowCreateTopicModal(false);
          setNewTopicName('');
        }}
        onCreate={handleCreateTopic}
        topicName={newTopicName}
        setTopicName={setNewTopicName}
        selectedModule={selectedModule}
      />
      <EditTopicModal
        isOpen={showEditTopicModal}
        onClose={() => {
          setShowEditTopicModal(false);
          setEditingTopic(null);
          setNewTopicName('');
        }}
        onSave={handleEditTopic}
        topic={editingTopic}
        topicName={newTopicName}
        setTopicName={setNewTopicName}
      />
        </>
  );
};

const EditQuestionForm = ({ question, onSave, onCancel, selectedModule }) => {
  const [formData, setFormData] = useState({
    question: question.question || '',
    optionA: question.optionA || '',
    optionB: question.optionB || '',
    optionC: question.optionC || '',
    optionD: question.optionD || '',
    answer: question.answer || '',
    testCases: question.testCases || '',
    expectedOutput: question.expectedOutput || '',
    language: question.language || 'python'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Question</label>
        <textarea
          value={formData.question}
          onChange={(e) => handleInputChange('question', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows="3"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Option A</label>
          <input
            type="text"
            value={formData.optionA}
            onChange={(e) => handleInputChange('optionA', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Option B</label>
          <input
            type="text"
            value={formData.optionB}
            onChange={(e) => handleInputChange('optionB', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Option C</label>
          <input
            type="text"
            value={formData.optionC}
            onChange={(e) => handleInputChange('optionC', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Option D</label>
          <input
            type="text"
            value={formData.optionD}
            onChange={(e) => handleInputChange('optionD', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>

                {selectedModule === 'CRT_TECHNICAL' ? (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Test Cases (one per line)</label>
            <textarea
              value={formData.testCases}
              onChange={(e) => handleInputChange('testCases', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="4"
              placeholder="6&#10;15&#10;28"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Expected Output (one per line)</label>
            <textarea
              value={formData.expectedOutput}
              onChange={(e) => handleInputChange('expectedOutput', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="4"
              placeholder="6 is a perfect number&#10;15 is not a perfect number&#10;28 is a perfect number"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Programming Language</label>
            <select
              value={formData.language}
              onChange={(e) => handleInputChange('language', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="javascript">JavaScript</option>
              <option value="cpp">C++</option>
              <option value="c">C</option>
            </select>
          </div>
        </>
      ) : (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Correct Answer</label>
          <select
            value={formData.answer}
            onChange={(e) => handleInputChange('answer', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select answer</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
          </select>
        </div>
      )} 

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Save Changes
        </button>
      </div>
    </form>
  );
};

const AddQuestionForm = ({ onSave, onCancel, selectedModule }) => {
  const [formData, setFormData] = useState({
    question: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    answer: '',
    testCases: '',
    expectedOutput: '',
    language: 'python'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Question</label>
        <textarea
          value={formData.question}
          onChange={(e) => handleInputChange('question', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows="3"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Option A</label>
          <input
            type="text"
            value={formData.optionA}
            onChange={(e) => handleInputChange('optionA', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Option B</label>
          <input
            type="text"
            value={formData.optionB}
            onChange={(e) => handleInputChange('optionB', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Option C</label>
          <input
            type="text"
            value={formData.optionC}
            onChange={(e) => handleInputChange('optionC', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Option D</label>
          <input
            type="text"
            value={formData.optionD}
            onChange={(e) => handleInputChange('optionD', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>

                {selectedModule === 'CRT_TECHNICAL' ? (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Test Cases (one per line)</label>
            <textarea
              value={formData.testCases}
              onChange={(e) => handleInputChange('testCases', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="4"
              placeholder="6&#10;15&#10;28"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Expected Output (one per line)</label>
            <textarea
              value={formData.expectedOutput}
              onChange={(e) => handleInputChange('expectedOutput', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="4"
              placeholder="6 is a perfect number&#10;15 is not a perfect number&#10;28 is a perfect number"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Programming Language</label>
            <select
              value={formData.language}
              onChange={(e) => handleInputChange('language', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="javascript">JavaScript</option>
              <option value="cpp">C++</option>
              <option value="c">C</option>
            </select>
          </div>
        </>
      ) : (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Correct Answer</label>
          <select
            value={formData.answer}
            onChange={(e) => handleInputChange('answer', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select answer</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
          </select>
        </div>
      )}

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Add Question
        </button>
      </div>
    </form>
  );
};

// Create Topic Modal Component
const CreateTopicModal = ({ isOpen, onClose, onCreate, topicName, setTopicName, selectedModule }) => {
  const [isChecking, setIsChecking] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [existingTopic, setExistingTopic] = useState(null);
  const [selectedModuleForTopic, setSelectedModuleForTopic] = useState(selectedModule || 'CRT_APTITUDE');

  // Check for duplicate topic name in real-time
  useEffect(() => {
    const checkDuplicateTopic = async () => {
      if (!topicName.trim() || !selectedModuleForTopic) {
        setIsDuplicate(false);
        setExistingTopic(null);
        return;
      }

      setIsChecking(true);
      try {
        const response = await api.get('/test-management/crt-topics');
        if (response.data.success) {
          const duplicate = response.data.data.find(topic => 
            topic.topic_name.toLowerCase() === topicName.trim().toLowerCase() &&
            topic.module_id === selectedModuleForTopic
          );
          
          if (duplicate) {
            setIsDuplicate(true);
            setExistingTopic(duplicate);
          } else {
            setIsDuplicate(false);
            setExistingTopic(null);
          }
        }
      } catch (error) {
        console.error('Error checking duplicate topic:', error);
        setIsDuplicate(false);
        setExistingTopic(null);
      } finally {
        setIsChecking(false);
      }
    };

    // Debounce the check to avoid too many API calls
    const timeoutId = setTimeout(checkDuplicateTopic, 500);
    return () => clearTimeout(timeoutId);
  }, [topicName, selectedModuleForTopic]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Topic</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Module
            </label>
            <select
              value={selectedModuleForTopic}
              onChange={(e) => setSelectedModuleForTopic(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CRT_MODULES.map((module) => (
                <option key={module.id} value={module.id}>
                  {module.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Topic Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={topicName}
                onChange={(e) => setTopicName(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDuplicate ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter topic name"
              />
              {isChecking && (
                <div className="absolute right-3 top-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                </div>
              )}
            </div>
            {isDuplicate && existingTopic && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">
                  <strong>Topic already exists!</strong> "{existingTopic.topic_name}" is already created for this module.
                </p>
                <p className="text-xs text-red-500 mt-1">
                  Created on: {new Date(existingTopic.created_at).toLocaleDateString()}
                </p>
              </div>
            )}
            {!isDuplicate && topicName.trim() && !isChecking && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-600">
                  ✓ Topic name is available
                </p>
              </div>
            )}
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={() => onCreate(selectedModuleForTopic)}
              disabled={isDuplicate || isChecking || !topicName.trim()}
              className={`px-4 py-2 text-sm font-medium border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isDuplicate || isChecking || !topicName.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
              }`}
            >
              {isChecking ? 'Checking...' : 'Create Topic'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Edit Topic Modal Component
const EditTopicModal = ({ isOpen, onClose, onSave, topic, topicName, setTopicName }) => {
  const [isChecking, setIsChecking] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [existingTopic, setExistingTopic] = useState(null);

  // Check for duplicate topic name in real-time
  useEffect(() => {
    const checkDuplicateTopic = async () => {
      if (!topicName.trim() || !topic) {
        setIsDuplicate(false);
        setExistingTopic(null);
        return;
      }

      // Don't check if the name hasn't changed
      if (topicName.trim() === topic.topic_name) {
        setIsDuplicate(false);
        setExistingTopic(null);
        return;
      }

      setIsChecking(true);
      try {
        const response = await api.get('/test-management/crt-topics');
        if (response.data.success) {
          const duplicate = response.data.data.find(t => 
            t.topic_name.toLowerCase() === topicName.trim().toLowerCase() &&
            t.module_id === topic.module_id &&
            t._id !== topic._id
          );
          
          if (duplicate) {
            setIsDuplicate(true);
            setExistingTopic(duplicate);
          } else {
            setIsDuplicate(false);
            setExistingTopic(null);
          }
        }
      } catch (error) {
        console.error('Error checking duplicate topic:', error);
        setIsDuplicate(false);
        setExistingTopic(null);
      } finally {
        setIsChecking(false);
      }
    };

    // Debounce the check to avoid too many API calls
    const timeoutId = setTimeout(checkDuplicateTopic, 500);
    return () => clearTimeout(timeoutId);
  }, [topicName, topic]);

  if (!isOpen || !topic) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Topic</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Topic Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={topicName}
                onChange={(e) => setTopicName(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDuplicate ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter topic name"
              />
              {isChecking && (
                <div className="absolute right-3 top-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                </div>
              )}
            </div>
            {isDuplicate && existingTopic && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">
                  <strong>Topic already exists!</strong> "{existingTopic.topic_name}" is already created for this module.
                </p>
                <p className="text-xs text-red-500 mt-1">
                  Created on: {new Date(existingTopic.created_at).toLocaleDateString()}
                </p>
              </div>
            )}
            {!isDuplicate && topicName.trim() && !isChecking && topicName.trim() !== topic.topic_name && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-600">
                  ✓ Topic name is available
                </p>
              </div>
            )}
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(topic._id, topicName)}
              disabled={isDuplicate || isChecking || !topicName.trim() || topicName.trim() === topic.topic_name}
              className={`px-4 py-2 text-sm font-medium border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isDuplicate || isChecking || !topicName.trim() || topicName.trim() === topic.topic_name
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
              }`}
            >
              {isChecking ? 'Checking...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CRTUpload;