import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { User, Mail, Shield, Calendar, Building, BookOpen, Users } from 'lucide-react'
import { toast } from 'react-hot-toast'
import api from '../../services/api'

const ProfileCard = ({ icon, title, value }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
    <div className="flex items-center space-x-3">
      <div className="p-2 bg-blue-100 rounded-lg">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-lg font-semibold text-gray-900">{value || 'Not specified'}</p>
      </div>
    </div>
  </div>
)

const SuperAdminProfile = () => {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        const res = await api.get('/auth/me')
        if (res.data.success) {
          setProfile(res.data.data)
        } else {
          toast.error(res.data.message || 'Failed to fetch profile.')
        }
      } catch (err) {
        console.error('Profile fetch error:', err)
        toast.error(err.response?.data?.message || 'An error occurred while fetching your profile.')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Could not load profile.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Profile</h1>
          <p className="text-gray-600 mt-2">Manage your account information and settings</p>
        </div>

        {/* Profile Overview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <div className="flex items-center space-x-6 mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <User className="h-10 w-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{profile.name}</h2>
              <p className="text-lg text-gray-600">{profile.email}</p>
              <div className="flex items-center mt-2">
                <Shield className="h-4 w-4 text-blue-500 mr-2" />
                <span className="text-sm font-medium text-blue-600 capitalize">
                  {profile.role?.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ProfileCard 
            icon={<User className="h-5 w-5 text-blue-500" />} 
            title="Username" 
            value={profile.username} 
          />
          <ProfileCard 
            icon={<Mail className="h-5 w-5 text-green-500" />} 
            title="Email" 
            value={profile.email} 
          />
          <ProfileCard 
            icon={<Shield className="h-5 w-5 text-purple-500" />} 
            title="Role" 
            value={profile.role?.replace('_', ' ')} 
          />
          <ProfileCard 
            icon={<Calendar className="h-5 w-5 text-orange-500" />} 
            title="Account Status" 
            value={profile.is_active ? 'Active' : 'Inactive'} 
          />
          {profile.campus_id && (
            <ProfileCard 
              icon={<Building className="h-5 w-5 text-indigo-500" />} 
              title="Campus ID" 
              value={profile.campus_id} 
            />
          )}
          {profile.course_id && (
            <ProfileCard 
              icon={<BookOpen className="h-5 w-5 text-teal-500" />} 
              title="Course ID" 
              value={profile.course_id} 
            />
          )}
          {profile.batch_id && (
            <ProfileCard 
              icon={<Users className="h-5 w-5 text-pink-500" />} 
              title="Batch ID" 
              value={profile.batch_id} 
            />
          )}
        </div>

        {/* Account Actions */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button className="flex items-center justify-center px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors">
              <User className="h-4 w-4 mr-2" />
              Edit Profile
            </button>
            <button className="flex items-center justify-center px-4 py-2 border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition-colors">
              <Shield className="h-4 w-4 mr-2" />
              Change Password
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SuperAdminProfile 