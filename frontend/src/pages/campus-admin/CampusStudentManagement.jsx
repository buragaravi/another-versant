import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from '../../components/common/Header';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useNotification } from '../../contexts/NotificationContext';
import api from '../../services/api';

const CampusStudentManagement = () => {
  const { error } = useNotification();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalStudents, setTotalStudents] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchStudents(1, searchTerm);
  }, [searchTerm]);

  const fetchStudents = async (page = 1, search = '') => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search })
      });
      
      const res = await api.get(`/campus-admin/students?${params}`);
      
      if (page === 1) {
        setStudents(res.data.data || []);
      } else {
        setStudents(prev => [...prev, ...(res.data.data || [])]);
      }
      
      setHasMore(res.data.pagination.has_more);
      setTotalStudents(res.data.pagination.total);
      setCurrentPage(page);
    } catch (err) {
      error('Failed to fetch students');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (hasMore && !loadingMore) {
      fetchStudents(currentPage + 1, searchTerm);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header />
      <div className="flex-1 overflow-x-hidden overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-text">Student Management</h1>
            {!loading && (
              <span className="text-sm text-gray-600">
                {totalStudents} students
              </span>
            )}
          </div>
          
          {/* Search Input */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search by name, email, or roll number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
            <p className="text-yellow-800">To add, edit, or delete students, please request the Superadmin.</p>
            <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition">Request Superadmin</button>
          </div>
          {loading ? (
            <LoadingSpinner size="md" />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="overflow-x-auto"
            >
              <table className="min-w-full bg-white rounded-lg shadow">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Roll Number</th>
                    <th className="px-4 py-2 text-left">Course</th>
                    <th className="px-4 py-2 text-left">Batch</th>
                    <th className="px-4 py-2 text-left">Department</th>
                    <th className="px-4 py-2 text-left">Year</th>
                    <th className="px-4 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(student => (
                    <tr key={student.id} className="border-b">
                      <td className="px-4 py-2">{student.name}</td>
                      <td className="px-4 py-2">{student.roll_number}</td>
                      <td className="px-4 py-2">{student.course_id}</td>
                      <td className="px-4 py-2">{student.batch_id}</td>
                      <td className="px-4 py-2">{student.department}</td>
                      <td className="px-4 py-2">{student.year}</td>
                      <td className="px-4 py-2">{student.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Load More Section */}
              {students.length > 0 && (
                <div className="mt-6 flex justify-center">
                  {hasMore && (
                    <button
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                      {loadingMore ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Loading...
                        </>
                      ) : (
                        'Load More Students'
                      )}
                    </button>
                  )}
                  
                  {!hasMore && students.length > 0 && (
                    <div className="text-sm text-gray-500">
                      All students loaded
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampusStudentManagement; 