import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNotification } from '../../contexts/NotificationContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../services/api';
import { User, Mail, Hash, Building, BookOpen, Users, Briefcase, ArrowLeft, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

const ProfileCard = ({ icon, title, value }) => (
    <motion.div 
        className="bg-white rounded-xl shadow-lg p-4 flex items-center space-x-3 hover:shadow-xl transition-all duration-300 border border-gray-100"
        whileHover={{ scale: 1.02, y: -2 }}
        transition={{ duration: 0.2 }}
    >
        <div className="bg-gradient-to-br from-indigo-100 to-blue-100 p-3 rounded-full flex-shrink-0">
            {React.cloneElement(icon, { className: 'h-6 w-6 text-indigo-600' })}
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-500 mb-1">{title}</p>
            <p className="text-sm font-semibold text-gray-800 truncate">{value || 'N/A'}</p>
        </div>
    </motion.div>
);

const StudentProfile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const { error } = useNotification();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/student/profile');
                if (res.data.success) {
                    setProfile(res.data.data);
                } else {
                    error(res.data.message || 'Failed to fetch profile.');
                }
            } catch (err) {
                error(err.response?.data?.message || 'An error occurred while fetching your profile.');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [error]);

    if (loading) {
        return <LoadingSpinner size="lg" />;
    }

    if (!profile) {
        return <div className="text-center py-8"><p className="text-gray-600">Could not load profile.</p></div>;
    }

    return (
        <div className="max-w-6xl mx-auto">
            {/* Back to Dashboard button */}
            <div className="mb-4">
                <Link to="/student" className="inline-flex items-center px-3 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 font-medium transition-all duration-300 shadow-md hover:shadow-lg text-sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Dashboard
                </Link>
            </div>
            
            <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col lg:flex-row gap-6"
            >
                {/* Main Profile Card */}
                <div className="lg:w-1/3">
                    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl p-6 text-center border border-gray-100 h-full">
                        <motion.div 
                            className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg"
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <User className="h-12 w-12 text-white" />
                        </motion.div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-1">{profile.name}</h1>
                        <p className="text-sm text-gray-600 mb-3">{profile.email}</p>
                        <div className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            <User className="h-3 w-3 mr-1" />
                            Student Profile
                        </div>
                    </div>
                </div>

                {/* Profile Details Grid */}
                <div className="lg:w-2/3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ProfileCard icon={<Hash />} title="Roll Number" value={profile.roll_number} />
                        <ProfileCard icon={<Building />} title="Campus" value={profile.campus} />
                        <ProfileCard icon={<BookOpen />} title="Course" value={profile.course} />
                        <ProfileCard icon={<Users />} title="Batch" value={profile.batch} />
                        <ProfileCard icon={<Phone />} title="Mobile Number" value={profile.mobile_number} />
                        <ProfileCard icon={<Mail />} title="Email" value={profile.email} />
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default StudentProfile; 