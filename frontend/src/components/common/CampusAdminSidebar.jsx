import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom'
import { 
  LayoutDashboard, BookCopy, GraduationCap, Users, 
  FilePlus, BarChart, Activity, LogOut, Building2
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { motion } from 'framer-motion'
import api from '../../services/api'

const CampusAdminSidebar = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const [userPermissions, setUserPermissions] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserPermissions()
  }, [user])

  const fetchUserPermissions = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      // Get user's full permissions from the backend
      const userResponse = await api.get(`/user-management/${user.id || user._id}`)
      const permissions = userResponse.data.data?.permissions || {}
      
      setUserPermissions(permissions)
    } catch (err) {
      console.error('Failed to fetch permissions:', err)
      // Use default permissions for campus admin
      setUserPermissions({
        modules: ['dashboard', 'course_management', 'batch_management', 'student_management', 'test_management', 'results_management', 'analytics', 'reports'],
        can_create_campus: false,
        can_create_course: true,
        can_create_batch: true,
        can_manage_users: false,
        can_manage_tests: true,
        can_view_all_data: false
      })
    } finally {
      setLoading(false)
    }
  }

  // Define navigation based on campus admin permissions
  const getNavigation = () => {
    if (loading || !userPermissions) {
      return []
    }

    const navigation = []

    // Dashboard - always available
    if (userPermissions.modules?.includes('dashboard')) {
      navigation.push({ 
        name: 'Dashboard', 
        path: '/campus-admin/dashboard', 
        icon: LayoutDashboard 
      })
    }

    // Course Management - campus admin can manage courses
    if (userPermissions.modules?.includes('course_management')) {
      navigation.push({ 
        name: 'Course Management', 
        path: '/campus-admin/courses', 
        icon: BookCopy 
      })
    }

    // Batch Management - campus admin can manage batches
    if (userPermissions.modules?.includes('batch_management')) {
      navigation.push({ 
        name: 'Batch Management', 
        path: '/campus-admin/batches', 
        icon: GraduationCap 
      })
    }

    // Student Management - campus admin can manage students
    if (userPermissions.modules?.includes('student_management')) {
      navigation.push({ 
        name: 'Student Management', 
        path: '/campus-admin/students', 
        icon: Users 
      })
    }

    // Test Management - campus admin can manage tests
    if (userPermissions.modules?.includes('test_management')) {
      navigation.push({ 
        name: 'Test Management', 
        path: '/campus-admin/tests', 
        icon: FilePlus 
      })
    }

    // Results Management - campus admin can view results
    if (userPermissions.modules?.includes('results_management')) {
      navigation.push({ 
        name: 'Results Management', 
        path: '/campus-admin/results', 
        icon: BarChart 
      })
    }

    // Analytics - campus admin can view analytics
    if (userPermissions.modules?.includes('analytics')) {
      navigation.push({ 
        name: 'Analytics', 
        path: '/campus-admin/analytics', 
        icon: Activity 
      })
    }

    // Reports - campus admin can view reports
    if (userPermissions.modules?.includes('reports')) {
      navigation.push({ 
        name: 'Reports', 
        path: '/campus-admin/reports', 
        icon: BarChart 
      })
    }

    return navigation
  }

  const navigation = getNavigation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path) => location.pathname.startsWith(path)

  if (loading) {
    return (
      <div className="flex">
        <div className="fixed top-0 left-0 h-screen w-64 bg-gradient-to-b from-white to-gray-50 shadow-2xl z-30 flex flex-col border-r border-gray-200">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 rounded mb-2"></div>
              <div className="h-4 bg-gray-300 rounded"></div>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
          </div>
        </div>
        <div className="ml-64 flex-1 bg-gray-50 w-full">
          <Outlet />
        </div>
      </div>
    )
  }

  return (
    <div className="flex">
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 80, damping: 18 }}
        className="fixed top-0 left-0 h-screen w-64 bg-gradient-to-b from-white to-gray-50 shadow-2xl z-30 flex flex-col border-r border-gray-200"
      >
        {/* Logo/Brand */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 100 }}
          className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50"
        >
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Study Edge
          </h1>
          <p className="text-sm text-gray-600 font-medium">Campus Admin Portal</p>
        </motion.div>

        <nav className="flex-1 flex flex-col justify-between">
          <div className="flex flex-col space-y-1 px-4 mt-6">
            {navigation.map((link, idx) => (
              <motion.div
                key={link.name}
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.05 * idx, type: 'spring', stiffness: 80, damping: 18 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  to={link.path}
                  className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 relative overflow-hidden
                    ${isActive(link.path)
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-100 hover:to-blue-50 hover:text-gray-900 hover:shadow-md'}
                  `}
                >
                  {/* Active indicator */}
                  {isActive(link.path) && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  
                  <link.icon className={`mr-3 h-5 w-5 transition-all duration-300 relative z-10
                    ${isActive(link.path) 
                      ? 'text-white' 
                      : 'text-gray-500 group-hover:text-blue-600 group-hover:scale-110'
                    }`} 
                  />
                  <span className="relative z-10 transition-all duration-300 group-hover:translate-x-1 font-semibold">
                    {link.name}
                  </span>
                  
                  {/* Hover effect */}
                  {!isActive(link.path) && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl"
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileHover={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </Link>
              </motion.div>
            ))}
          </div>
        </nav>

        {/* User Info & Logout */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 100 }}
          className="px-4 pb-6 mt-auto"
        >
          <div className="flex items-center mb-4 p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center shadow-md">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-600">Campus Admin</p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-semibold px-4 py-3 rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            <motion.div
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.3 }}
            >
              <LogOut className="h-5 w-5" />
            </motion.div>
            Logout
          </button>
        </motion.div>
      </motion.div>
      <div className="ml-64 flex-1 bg-gray-50 w-full">
        <Outlet />
      </div>
    </div>
  )
}

export default CampusAdminSidebar 