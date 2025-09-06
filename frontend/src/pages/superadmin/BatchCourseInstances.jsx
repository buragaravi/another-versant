import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import Papa from 'papaparse';
import api from '../../services/api';
import { Plus, Building, BookOpen, Users, X } from 'lucide-react';

const BatchCourseInstances = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInstance, setSelectedInstance] = useState(null);
  const [showInstanceDetails, setShowInstanceDetails] = useState(false);
  const [instanceStudents, setInstanceStudents] = useState([]);
  const [showStudentUpload, setShowStudentUpload] = useState(false);
  const [showCreateBatch, setShowCreateBatch] = useState(false);
  const [campuses, setCampuses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCampus, setSelectedCampus] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [batchName, setBatchName] = useState('');
  const [batchDescription, setBatchDescription] = useState('');
  const [creatingBatch, setCreatingBatch] = useState(false);

  useEffect(() => {
    fetchInstances();
    fetchCampuses();
  }, []);

  useEffect(() => {
    if (selectedCampus) {
      fetchCoursesByCampus(selectedCampus);
    } else {
      setCourses([]);
    }
  }, [selectedCampus]);

  const fetchInstances = async () => {
    try {
      setLoading(true);
      const response = await api.get('/batch-management/instances');
      if (response.data.success) {
        setInstances(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching instances:', error);
      toast.error('Failed to fetch batch-course instances');
    } finally {
      setLoading(false);
    }
  };

  const fetchInstanceDetails = async (instanceId) => {
    try {
      const response = await api.get(`/batch-management/instances/${instanceId}`);
      if (response.data.success) {
        setSelectedInstance(response.data.data);
        setShowInstanceDetails(true);
      }
    } catch (error) {
      console.error('Error fetching instance details:', error);
      toast.error('Failed to fetch instance details');
    }
  };

  const fetchInstanceStudents = async (instanceId) => {
    try {
      const response = await api.get(`/batch-management/instances/${instanceId}/students`);
      if (response.data.success) {
        setInstanceStudents(response.data.data);
        setShowStudentUpload(true);
      }
    } catch (error) {
      console.error('Error fetching instance students:', error);
      toast.error('Failed to fetch instance students');
    }
  };

  const handleFileUpload = async (event, instanceId) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post(`/batch-management/instances/${instanceId}/upload-students`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        toast.success(response.data.message);
        fetchInstanceDetails(instanceId);
        fetchInstanceStudents(instanceId);
      } else {
        toast.error(response.data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading students:', error);
      toast.error('Failed to upload students');
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        'Student Name': 'John Doe',
        'Roll Number': '2024001',
        'Email': 'john.doe@example.com',
        'Mobile Number': '9876543210'
      },
      {
        'Student Name': 'Jane Smith',
        'Roll Number': '2024002',
        'Email': 'jane.smith@example.com',
        'Mobile Number': '9876543211'
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
      toast.error(error.response?.data?.message || 'Failed to fetch campuses. Please check your backend connection.');
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

  // Create Batch logic
  const handleCreateBatch = async (e) => {
    e.preventDefault();
    if (!batchName || !selectedCampus || !selectedCourse) {
      toast.error('Please fill all required fields.');
      return;
    }
    setCreatingBatch(true);
    try {
      const response = await api.post('/batch-management/', {
        name: batchName,
        campus_ids: [selectedCampus],
        course_ids: [selectedCourse],
      });
      if (response.data.success) {
        toast.success('Batch created successfully!');
        setShowCreateBatch(false);
        setBatchName('');
        setBatchDescription('');
        setSelectedCampus('');
        setSelectedCourse('');
        fetchInstances();
      } else {
        toast.error(response.data.message || 'Failed to create batch');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create batch');
    } finally {
      setCreatingBatch(false);
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
        {/* Create Batch Modal */}
        {showCreateBatch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <form onSubmit={handleCreateBatch} className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full relative">
              <button type="button" onClick={() => setShowCreateBatch(false)} className="absolute top-3 right-3 text-gray-500 hover:text-red-600 text-xl">&times;</button>
              <h2 className="text-2xl font-bold mb-6">Create New Batch</h2>
              <div className="mb-4">
                <label className="block font-semibold mb-1">Batch Name</label>
                <input type="text" className="w-full border rounded px-3 py-2" value={batchName} onChange={e => setBatchName(e.target.value)} required />
              </div>
              <div className="mb-4">
                <label className="block font-semibold mb-1">Campus</label>
                <select className="w-full border rounded px-3 py-2" value={selectedCampus} onChange={e => setSelectedCampus(e.target.value)} required>
                  <option value="">-- Select Campus --</option>
                  {campuses.map(campus => (
                    <option key={campus.id || campus._id} value={campus.id || campus._id}>{campus.name}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block font-semibold mb-1">Course</label>
                <select className="w-full border rounded px-3 py-2" value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)} required>
                  <option value="">-- Select Course --</option>
                  {courses.map(course => (
                    <option key={course.id || course._id} value={course.id || course._id}>{course.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end">
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors" disabled={creatingBatch}>
                  {creatingBatch ? 'Creating...' : 'Create Batch'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div>
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Batch-Course Instances
              </h1>
              <p className="text-gray-600">
                Manage batch-course instances and their students
              </p>
            </div>

            {/* Instances Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {instances.map((instance, index) => (
                <motion.div
                  key={instance._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {instance.batch_name}
                      </h3>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {instance.student_count || 0} students
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Course:</span> {instance.course_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Campus:</span> {instance.campus_names?.join(', ') || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Created:</span> {new Date(instance.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => fetchInstanceDetails(instance._id)}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => fetchInstanceStudents(instance._id)}
                        className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                      >
                        Manage Students
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Empty State */}
            {instances.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  No Batch-Course Instances Found
                </h3>
                <p className="text-gray-600 mb-6">
                  Create batches with courses to generate instances automatically.
                </p>
                <button
                  onClick={() => setShowCreateBatch(true)}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create New Batch
                </button>
              </div>
            )}

            {/* Create Batch Button for when instances exist */}
            {instances.length > 0 && (
              <div className="mb-6 flex justify-end">
                <button
                  onClick={() => setShowCreateBatch(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Batch
                </button>
              </div>
            )}
          </div>

          {/* Instance Details Modal */}
          {showInstanceDetails && selectedInstance && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-800">
                      Instance Details
                    </h2>
                    <button
                      onClick={() => setShowInstanceDetails(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-gray-800">Batch</h4>
                        <p className="text-gray-600">{selectedInstance.batch?.name}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">Course</h4>
                        <p className="text-gray-600">{selectedInstance.course?.name}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-gray-800">Students</h4>
                        <p className="text-gray-600">{selectedInstance.student_count}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">Test Results</h4>
                        <p className="text-gray-600">{selectedInstance.test_results_count}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-800">Created</h4>
                      <p className="text-gray-600">
                        {selectedInstance.created_at ? new Date(selectedInstance.created_at).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Student Management Modal */}
          {showStudentUpload && selectedInstance && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-800">
                      Student Management - {selectedInstance.batch?.name} ({selectedInstance.course?.name})
                    </h2>
                    <button
                      onClick={() => setShowStudentUpload(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                  {/* Upload Section */}
                  <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-blue-800 mb-2">Upload Students</h3>
                    <div className="flex items-center gap-4">
                      <input
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={(e) => handleFileUpload(e, selectedInstance.id)}
                        className="flex-1"
                      />
                      <button
                        onClick={downloadTemplate}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        Download Template
                      </button>
                    </div>
                  </div>

                  {/* Students List */}
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-4">
                      Current Students ({instanceStudents.length})
                    </h3>
                    
                    {instanceStudents.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Name
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Roll Number
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Email
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Username
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {instanceStudents.map((student) => (
                              <tr key={student.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {student.name}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {student.roll_number}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {student.email}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {student.username}
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    student.is_active 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {student.is_active ? 'Active' : 'Inactive'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-4xl mb-4">👥</div>
                        <p className="text-gray-600">No students enrolled in this instance yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
  );
};

export default BatchCourseInstances;