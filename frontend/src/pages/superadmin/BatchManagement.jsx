import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import Papa from 'papaparse';
import api from '../../services/api';
import { io } from 'socket.io-client';


import { Plus, Users, Upload, Download, Building, BookOpen, Trash2, Edit, Eye, X, User, Hash, Mail, Phone } from 'lucide-react';

const BatchManagement = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateBatch, setShowCreateBatch] = useState(false);
  const [showUploadStudents, setShowUploadStudents] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [showBatchDetails, setShowBatchDetails] = useState(false);
  const [batchStudents, setBatchStudents] = useState([]);
  
  // Form states
  const [campuses, setCampuses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCampus, setSelectedCampus] = useState('');
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [batchName, setBatchName] = useState('');

  const [creatingBatch, setCreatingBatch] = useState(false);
  
  // Upload states
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadingStudents, setUploadingStudents] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  
  // Progress states
  const [uploadProgress, setUploadProgress] = useState({
    status: 'idle', // 'idle', 'started', 'processing', 'sending_emails', 'completed', 'completed_with_errors'
    total: 0,
    processed: 0,
    percentage: 0,
    message: '',
    currentStudent: null,
    error: false,
    emailWarning: false,
    emailError: null
  });
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    fetchBatches();
    fetchCampuses();
    
    // Initialize WebSocket connection for progress updates
    const socketUrl = import.meta.env.VITE_SOCKET_IO_URL || 'https://ai-versant.onrender.com';
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling']
    });
    
    newSocket.on('connect', () => {
      console.log('Connected to WebSocket for progress updates');
    });
    
    newSocket.on('upload_progress', (data) => {
      console.log('Progress update received:', data);
      setUploadProgress({
        status: data.status,
        total: data.total,
        processed: data.processed,
        percentage: data.percentage,
        message: data.message,
        currentStudent: data.current_student,
        error: data.error || false,
        emailWarning: data.email_warning || false,
        emailError: data.email_error || null
      });
      
      // Show toast for important status changes
      if (data.status === 'completed') {
        toast.success(data.message);
      } else if (data.status === 'completed_with_errors') {
        toast.error(data.message);
      } else if (data.email_warning) {
        // Show warning toast for email failures (but student was created successfully)
        toast(`⚠️ ${data.message}`, {
          icon: '⚠️',
          duration: 4000,
        });
      }
    });
    
    newSocket.on('disconnect', () => {
      console.log('Disconnected from WebSocket');
    });
    
    setSocket(newSocket);
    
    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (selectedCampus) {
      fetchCoursesByCampus(selectedCampus);
    } else {
      setCourses([]);
    }
  }, [selectedCampus]);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const response = await api.get('/batch-management/');
      if (response.data.success) {
        setBatches(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
      toast.error('Failed to fetch batches');
    } finally {
      setLoading(false);
    }
  };

  const fetchCampuses = async () => {
    try {
      const response = await api.get('/campus-management/campuses');
      if (response.data.success) {
        setCampuses(response.data.data);
      } else {
        toast.error(response.data.message || 'Failed to fetch campuses');
      }
    } catch (error) {
      console.error('Error fetching campuses:', error);
      toast.error('Failed to fetch campuses. Please check your backend connection.');
    }
  };

  const fetchCoursesByCampus = async (campusId) => {
    try {
      const response = await api.get(`/course-management/courses?campus_id=${campusId}`);
      if (response.data.success) {
        setCourses(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching courses by campus:', error);
      toast.error('Failed to fetch courses');
    }
  };

  const fetchBatchStudents = async (batchId) => {
    try {
      const response = await api.get(`/batch-management/batch/${batchId}/students`);
      if (response.data.success) {
        setBatchStudents(response.data.data);
        setShowBatchDetails(true);
      }
    } catch (error) {
      console.error('Error fetching batch students:', error);
      toast.error('Failed to fetch batch students');
    }
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    if (!batchName || !selectedCampus || selectedCourses.length === 0) {
      toast.error('Please fill all required fields and select at least one course.');
      return;
    }
    setCreatingBatch(true);
    try {
      const response = await api.post('/batch-management/', {
        name: batchName,
        campus_ids: [selectedCampus],
        course_ids: selectedCourses,
      });
      if (response.data.success) {
        toast.success('Batch created successfully!');
        setShowCreateBatch(false);
        setBatchName('');
        setSelectedCampus('');
        setSelectedCourses([]);
        fetchBatches();
      } else {
        toast.error(response.data.message || 'Failed to create batch');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create batch');
    } finally {
      setCreatingBatch(false);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
      toast.error('Please upload a CSV or Excel file');
      return;
    }

    setUploadFile(file);
    
    // Preview CSV file
    if (file.name.endsWith('.csv')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const csv = Papa.parse(e.target.result, { header: true });
        setPreviewData(csv.data.slice(0, 5)); // Show first 5 rows
      };
      reader.readAsText(file);
    }
  };

  const handleUploadStudents = async (e) => {
    e.preventDefault();
    if (!uploadFile || !selectedBatch) {
      toast.error('Please select a file and batch');
      return;
    }

    setUploadingStudents(true);
    
         // Reset progress state
     setUploadProgress({
       status: 'idle',
       total: 0,
       processed: 0,
       percentage: 0,
       message: '',
       currentStudent: null,
       error: false,
       emailWarning: false,
       emailError: null
     });
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('batch_id', selectedBatch.id);
      selectedBatch.courses.forEach(course => {
        formData.append('course_ids', course.id);
      });

      // Debug logging
      console.log('Uploading students with:', {
        batch_id: selectedBatch.id,
        course_ids: selectedBatch.courses.map(c => c.id),
        file_name: uploadFile.name,
        file_size: uploadFile.size
      });

      const response = await api.post('/batch-management/upload-students', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Handle both success and partial success (207 status)
      if (response.data.success || response.status === 207) {
        const createdStudents = response.data.data?.created_students || response.data.created_students || [];
        const uploadErrors = response.data.errors || [];
        
        if (createdStudents.length > 0) {
          // Don't show success toast here as it's handled by WebSocket progress updates
          setShowUploadStudents(false);
          setUploadFile(null);
          setSelectedBatch(null);
          setPreviewData([]);
          fetchBatches();
        }
        
        // Show detailed error messages if any (only if not handled by WebSocket)
        if (uploadErrors.length > 0 && uploadProgress.status !== 'completed_with_errors') {
          const errorMessage = uploadErrors.length > 3 
            ? `${uploadErrors.slice(0, 3).join('; ')}... and ${uploadErrors.length - 3} more errors.`
            : uploadErrors.join('; ');
          toast.error(`Upload completed with errors: ${errorMessage}`);
        }
        
        // If no students were created, show general error
        if (createdStudents.length === 0) {
          toast.error('No students were uploaded. Please check your file and try again.');
        }
      } else {
        toast.error(response.data.message || 'Failed to upload students');
      }
    } catch (error) {
      console.error('Upload error:', error);
      
      // Handle different types of errors
      if (error.response?.status === 207) {
        // Partial success - some students uploaded, some failed
        const responseData = error.response.data;
        const createdStudents = responseData.data?.created_students || responseData.created_students || [];
        const uploadErrors = responseData.errors || [];
        
        if (createdStudents.length > 0) {
          toast.success(`Partially successful: ${createdStudents.length} student(s) uploaded.`);
          setShowUploadStudents(false);
          setUploadFile(null);
          setSelectedBatch(null);
          setPreviewData([]);
          fetchBatches();
        }
        
        if (uploadErrors.length > 0) {
          const errorMessage = uploadErrors.length > 3 
            ? `${uploadErrors.slice(0, 3).join('; ')}... and ${uploadErrors.length - 3} more errors.`
            : uploadErrors.join('; ');
          toast.error(`Upload errors: ${errorMessage}`);
        }
      } else if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        // Multiple validation errors
        const errorMessages = error.response.data.errors;
        const displayMessage = errorMessages.length > 3 
          ? `${errorMessages.slice(0, 3).join('; ')}... and ${errorMessages.length - 3} more errors.`
          : errorMessages.join('; ');
        toast.error(`Validation errors: ${displayMessage}`);
      } else if (error.response?.data?.message) {
        // Single error message
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to upload students. Please check your file format and try again.');
      }
    } finally {
      setUploadingStudents(false);
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        'Group': 'CSE',
        'Roll Number': '216T1A0541',
        'Student Name': 'KASU BABU',
        'Email': 'kasusaranya3@gmail.com',
        'Mobile Number': '77318 84484'
      },
      {
        'Group': 'CSE',
        'Roll Number': '226T1A0501',
        'Student Name': 'AKUMARTHI V SAI MANIKANTA PHANINDRA',
        'Email': 'vaibhavsai@gmail.com',
        'Mobile Number': '8466862444'
      },
      {
        'Group': 'ECE',
        'Roll Number': '226T1A0502',
        'Student Name': 'ANDANAPALLI SASANK MOULI',
        'Email': 'moulirock8@gmail.com',
        'Mobile Number': '9701594799'
      }
    ];

    const csv = Papa.unparse(templateData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'student_upload_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const deleteBatch = async (batchId) => {
    if (!window.confirm('Are you sure you want to delete this batch? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await api.delete(`/batch-management/${batchId}`);
      if (response.data.success) {
        toast.success('Batch deleted successfully!');
        fetchBatches();
      } else {
        toast.error(response.data.message || 'Failed to delete batch');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete batch');
    }
  };

  if (loading) {
    return (
      <main className="p-6 flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </main>
    );
  }

  return (
    <main className="p-6">
        {/* Simple Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Batch Management
              </h1>
              <p className="text-gray-600">
                Create and manage batches with student uploads
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateBatch(true)}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create New Batch
              </button>
              <button
                onClick={() => setShowUploadStudents(true)}
                className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <Upload className="w-5 h-5 mr-2" />
                Upload Students
              </button>
            </div>
          </div>
        </div>



        {/* Simple Batches Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {batches.map((batch, index) => (
            <motion.div
              key={batch.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {batch.name}
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => fetchBatchStudents(batch.id)}
                      className="p-1 text-blue-600 hover:text-blue-700"
                      title="View Students"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedBatch(batch);
                        setShowUploadStudents(true);
                      }}
                      className="p-1 text-green-600 hover:text-green-700"
                      title="Upload Students"
                    >
                      <Upload className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteBatch(batch.id)}
                      className="p-1 text-red-600 hover:text-red-700"
                      title="Delete Batch"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Students:</span> {batch.student_count || 0}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => fetchBatchStudents(batch.id)}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                  >
                    <Users className="w-4 h-4 mr-1 inline" />
                    View Students
                  </button>
                  <button
                    onClick={() => {
                      setSelectedBatch(batch);
                      setShowUploadStudents(true);
                    }}
                    className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                  >
                    <Upload className="w-4 h-4 mr-1 inline" />
                    Add Students
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Enhanced Empty State */}
        {batches.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="mx-auto w-32 h-32 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-6">
              <BookOpen className="h-16 w-16 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              No Batches Found
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Create your first batch to get started with student management. 
              Batches help you organize students by academic year and course.
            </p>
            <button
              onClick={() => setShowCreateBatch(true)}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create New Batch
            </button>
          </motion.div>
        )}

        {/* Create Batch Modal */}
        {showCreateBatch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <form onSubmit={handleCreateBatch} className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full relative transform transition-all">
              <button type="button" onClick={() => setShowCreateBatch(false)} className="absolute top-4 right-4 text-gray-400 hover:text-red-600 text-2xl font-bold transition-colors">&times;</button>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Create New Batch</h2>
                <p className="text-gray-600 mt-2">Set up a new batch for student management</p>
              </div>
              
              <div className="mb-6">
                <label className="block font-semibold text-gray-700 mb-2">Batch Name *</label>
                <input 
                  type="text" 
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200" 
                  value={batchName} 
                  onChange={e => setBatchName(e.target.value)} 
                  required 
                  placeholder="e.g., 2024-2028 CSE"
                />
              </div>
              

              
              <div className="mb-6">
                <label className="block font-semibold text-gray-700 mb-2">Campus *</label>
                <select 
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200" 
                  value={selectedCampus} 
                  onChange={e => setSelectedCampus(e.target.value)} 
                  required
                >
                  <option value="">-- Select Campus --</option>
                  {campuses.map(campus => (
                    <option key={campus.id} value={campus.id}>{campus.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="mb-6">
                <label className="block font-semibold text-gray-700 mb-2">Courses *</label>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-3 disabled:bg-gray-100 disabled:cursor-not-allowed">
                  {courses.map(course => (
                    <label key={course.id} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        value={course.id}
                        checked={selectedCourses.includes(course.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCourses([...selectedCourses, course.id]);
                          } else {
                            setSelectedCourses(selectedCourses.filter(id => id !== course.id));
                          }
                        }}
                        disabled={!selectedCampus}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{course.name}</span>
                    </label>
                  ))}
                  {courses.length === 0 && (
                    <p className="text-sm text-gray-500 italic">
                      {selectedCampus ? 'No courses available for this campus' : 'Please select a campus first'}
                    </p>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">Select one or more courses for this batch</p>
              </div>
              
              <div className="flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowCreateBatch(false)}
                  className="px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg" 
                  disabled={creatingBatch}
                >
                  {creatingBatch ? 'Creating...' : 'Create Batch'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Upload Students Modal */}
        {showUploadStudents && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <form onSubmit={handleUploadStudents} className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full relative transform transition-all">
              <button 
                type="button" 
                onClick={() => {
                  setShowUploadStudents(false);
                                     setUploadProgress({
                     status: 'idle',
                     total: 0,
                     processed: 0,
                     percentage: 0,
                     message: '',
                     currentStudent: null,
                     error: false,
                     emailWarning: false,
                     emailError: null
                   });
                }} 
                className="absolute top-4 right-4 text-gray-400 hover:text-red-600 text-2xl font-bold transition-colors"
              >
                &times;
              </button>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Upload Students</h2>
                <p className="text-gray-600 mt-2">Add students to an existing batch</p>
              </div>
              
                              {!selectedBatch && (
                  <div className="mb-6">
                    <label className="block font-semibold text-gray-700 mb-2">Select Batch *</label>
                    <select 
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200" 
                      onChange={e => {
                        const batch = batches.find(b => b.id === e.target.value);
                        setSelectedBatch(batch);
                      }}
                      required
                    >
                      <option value="">-- Select Batch --</option>
                      {batches.map(batch => (
                        <option key={batch.id} value={batch.id}>{batch.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              
              {selectedBatch && (
                <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                  <h3 className="font-semibold text-green-800 mb-2">Selected Batch: {selectedBatch.name}</h3>
                  <p className="text-sm text-green-600">
                    Campus: {selectedBatch.campuses?.map(c => c.name).join(', ')} | 
                    Course: {selectedBatch.courses?.map(c => c.name).join(', ')}
                  </p>
                </div>
              )}
              
              <div className="mb-6">
                <label className="block font-semibold text-gray-700 mb-2">Upload Student File *</label>
                <input 
                  type="file" 
                  accept=".csv,.xlsx"
                  onChange={handleFileUpload}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100" 
                  required
                />
                <p className="text-sm text-gray-500 mt-2">
                  Upload CSV or Excel file with student details
                </p>
              </div>
              
              {previewData.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">File Preview (First 5 rows):</h3>
                  <div className="max-h-40 overflow-y-auto border rounded p-2 bg-gray-50">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          {Object.keys(previewData[0] || {}).map(key => (
                            <th key={key} className="text-left p-1">{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.map((row, index) => (
                          <tr key={index} className="border-b">
                            {Object.values(row).map((value, i) => (
                              <td key={i} className="p-1">{value}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {/* Progress Bar */}
              {uploadProgress.status !== 'idle' && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-blue-800">Upload Progress</h3>
                    <span className="text-sm text-blue-600 font-medium">
                      {uploadProgress.processed}/{uploadProgress.total} ({uploadProgress.percentage}%)
                    </span>
                  </div>
                  
                                     {/* Progress Bar */}
                   <div className="w-full bg-blue-200 rounded-full h-3 mb-3">
                     <motion.div
                       className={`h-3 rounded-full ${
                         uploadProgress.error ? 'bg-red-500' : 
                         uploadProgress.emailWarning ? 'bg-orange-500' :
                         uploadProgress.status === 'completed' ? 'bg-green-500' :
                         uploadProgress.status === 'completed_with_errors' ? 'bg-yellow-500' :
                         'bg-blue-500'
                       }`}
                       initial={{ width: 0 }}
                       animate={{ width: `${uploadProgress.percentage}%` }}
                       transition={{ duration: 0.3 }}
                     />
                   </div>
                  
                                     {/* Status Message */}
                   <div className={`text-sm ${uploadProgress.emailWarning ? 'text-orange-700' : 'text-blue-700'}`}>
                     <div className="flex items-center gap-2">
                       {uploadProgress.status === 'started' && (
                         <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                       )}
                       {uploadProgress.status === 'processing' && (
                         <div className={`w-2 h-2 rounded-full animate-pulse ${
                           uploadProgress.emailWarning ? 'bg-orange-500' : 'bg-blue-500'
                         }`} />
                       )}
                       {uploadProgress.status === 'sending_emails' && (
                         <div className={`w-2 h-2 rounded-full animate-pulse ${
                           uploadProgress.emailWarning ? 'bg-orange-500' : 'bg-green-500'
                         }`} />
                       )}
                       {uploadProgress.status === 'completed' && (
                         <div className="w-2 h-2 bg-green-500 rounded-full" />
                       )}
                       {uploadProgress.status === 'completed_with_errors' && (
                         <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                       )}
                       <span>{uploadProgress.message}</span>
                     </div>
                   </div>
                  
                                     {/* Current Student Info */}
                   {uploadProgress.currentStudent && (
                     <div className={`mt-2 p-2 bg-white rounded border ${
                       uploadProgress.emailWarning ? 'border-orange-200' : 'border-blue-200'
                     }`}>
                       <div className="text-xs text-gray-600">
                         <strong>Current:</strong> {uploadProgress.currentStudent.name} ({uploadProgress.currentStudent.email})
                         {uploadProgress.emailWarning && (
                           <div className="text-orange-600 mt-1">
                             ⚠️ Email sending failed - Student created successfully
                           </div>
                         )}
                       </div>
                     </div>
                   )}
                </div>
              )}
              
              <div className="mb-6">
                <button 
                  type="button" 
                  onClick={downloadTemplate}
                  className="inline-flex items-center text-blue-600 hover:text-blue-700"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download Template
                </button>
              </div>
              
              <div className="flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowUploadStudents(false);
                                       setUploadProgress({
                     status: 'idle',
                     total: 0,
                     processed: 0,
                     percentage: 0,
                     message: '',
                     currentStudent: null,
                     error: false,
                     emailWarning: false,
                     emailError: null
                   });
                  }}
                  className="px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed" 
                  disabled={uploadingStudents || !selectedBatch || !uploadFile}
                >
                  {uploadingStudents ? (
                    uploadProgress.status === 'sending_emails' ? 'Sending Emails...' :
                    uploadProgress.status === 'processing' ? 'Processing...' :
                    'Uploading...'
                  ) : 'Upload Students'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Enhanced Batch Details Modal */}
        {showBatchDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden border border-gray-100 flex flex-col"
            >
              {/* Enhanced Header */}
              <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-lg">
                      <Users className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Batch Students
                      </h2>
                      <p className="text-gray-600 mt-1">
                        {batchStudents.length} student{batchStudents.length !== 1 ? 's' : ''} in this batch
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowBatchDetails(false)}
                    className="p-3 hover:bg-gray-100 rounded-2xl transition-all duration-200 hover:scale-110"
                  >
                    <X className="h-6 w-6 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Enhanced Table Content */}
              <div className="flex-1 overflow-y-auto p-8" style={{ minHeight: '400px', maxHeight: 'calc(95vh - 200px)' }}>
                {batchStudents.length > 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-blue-600" />
                                Name
                              </div>
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                              <div className="flex items-center gap-2">
                                <Hash className="h-4 w-4 text-green-600" />
                                Roll Number
                              </div>
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-purple-600" />
                                Email
                              </div>
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-orange-600" />
                                Mobile
                              </div>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {batchStudents.map((student, index) => (
                            <motion.tr
                              key={index}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 group"
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-bold text-white">
                                      {student.name.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                      {student.name}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900 font-mono bg-gray-50 px-3 py-1 rounded-lg border">
                                  {student.roll_number}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  <a 
                                    href={`mailto:${student.email}`}
                                    className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                                  >
                                    {student.email}
                                  </a>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {student.mobile_number ? (
                                    <a 
                                      href={`tel:${student.mobile_number}`}
                                      className="text-green-600 hover:text-green-800 hover:underline transition-colors"
                                    >
                                      {student.mobile_number}
                                    </a>
                                  ) : (
                                    <span className="text-gray-400 italic">N/A</span>
                                  )}
                                </div>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                  >
                    <div className="mx-auto w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
                      <Users className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Students Found</h3>
                    <p className="text-gray-600">This batch doesn't have any students yet.</p>
                  </motion.div>
                )}
              </div>

              {/* Enhanced Footer */}
              <div className="px-8 py-6 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100 flex items-center justify-end gap-4">
                <button
                  onClick={() => setShowBatchDetails(false)}
                  className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold hover:shadow-md"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </main>
  );
};

export default BatchManagement; 