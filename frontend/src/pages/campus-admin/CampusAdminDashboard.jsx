import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import Header from '../../components/common/Header';
import { FilePlus, Users, BarChart, Building2 } from 'lucide-react';

const CampusAdminDashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTests: 0,
    totalResults: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/campus-admin/dashboard');
      if (response.data.success) {
        setStats(response.data.data.statistics);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast.error('Failed to fetch dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const dashboardCards = [
    {
      title: 'Total Students',
      value: stats.totalStudents,
      icon: Users,
      color: 'bg-blue-500',
      path: '/campus-admin/student-upload'
    },
    {
      title: 'Total Tests',
      value: stats.totalTests,
      icon: FilePlus,
      color: 'bg-green-500',
      path: '/campus-admin/tests'
    },
    {
      title: 'Test Results',
      value: stats.totalResults,
      icon: BarChart,
      color: 'bg-purple-500',
      path: '/campus-admin/results'
    }
  ];

  if (loading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header />
      <main className="flex-1 overflow-x-hidden overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Campus Admin Dashboard
            </h1>
            <p className="text-gray-600">
              Manage tests and student uploads for your campus
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {dashboardCards.map((card, index) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => window.location.href = card.path}
              >
                <div className="flex items-center">
                  <div className={`p-3 rounded-full ${card.color} text-white`}>
                    <card.icon className="w-6 h-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{card.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => window.location.href = '/campus-admin/tests'}
                className="flex items-center p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <FilePlus className="w-8 h-8 text-blue-600 mr-4" />
                <div className="text-left">
                  <h3 className="font-semibold text-blue-800">Create Test</h3>
                  <p className="text-sm text-blue-600">Create and manage tests for your campus</p>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => window.location.href = '/campus-admin/student-upload'}
                className="flex items-center p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
              >
                <Users className="w-8 h-8 text-green-600 mr-4" />
                <div className="text-left">
                  <h3 className="font-semibold text-green-800">Upload Students</h3>
                  <p className="text-sm text-green-600">Upload student data via CSV/Excel</p>
                </div>
              </motion.button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CampusAdminDashboard;