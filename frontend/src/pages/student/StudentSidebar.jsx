import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { Home, Book, Calendar, BarChart2, PieChart, User, Menu, X, Bell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';

const StudentSidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

    const navLinks = [
        { name: 'Dashboard', path: '/student', icon: Home },
        { name: 'Practice Modules', path: '/student/practice', icon: Book },
        { name: 'CRT Modules', path: '/student/crt', icon: Book },
        { name: 'Online Exams', path: '/student/exams', icon: Calendar },
        { name: 'Test History', path: '/student/history', icon: BarChart2 },
        { name: 'Progress', path: '/student/progress', icon: PieChart },
    ];

    const handleLogout = () => {
        console.log('StudentSidebar logout initiated')
        try {
            logout();
            console.log('StudentSidebar logout successful')
            navigate('/login');
        } catch (error) {
            console.error('StudentSidebar logout error:', error)
            navigate('/login');
        }
    };

    useEffect(() => {
        const handleResize = () => {
            const newIsDesktop = window.innerWidth >= 1024;
            setIsDesktop(newIsDesktop);
            if (newIsDesktop && isMobileMenuOpen) {
                setIsMobileMenuOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isMobileMenuOpen]);

    useEffect(() => {
        let startX = 0;
        let currentX = 0;

        const handleTouchStart = (e) => {
            startX = e.touches[0].clientX;
        };

        const handleTouchMove = (e) => {
            currentX = e.touches[0].clientX;
        };

        const handleTouchEnd = () => {
            const diffX = startX - currentX;
            if (diffX > 50 && isMobileMenuOpen) {
                setIsMobileMenuOpen(false);
            }
        };

        if (isMobileMenuOpen) {
            document.addEventListener('touchstart', handleTouchStart);
            document.addEventListener('touchmove', handleTouchMove);
            document.addEventListener('touchend', handleTouchEnd);
        }

        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, [isMobileMenuOpen]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            const sidebar = document.querySelector('[data-student-sidebar]');
            const toggleButton = document.querySelector('[data-student-toggle-button]');
            
            if (isMobileMenuOpen && sidebar && !sidebar.contains(e.target) && !toggleButton?.contains(e.target)) {
                setIsMobileMenuOpen(false);
            }
        };

        if (isMobileMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isMobileMenuOpen]);

    const isActive = (path) => location.pathname === path;

    return (
        <div className="flex">
            {/* Mobile Menu Toggle */}
            <div className="lg:hidden fixed top-4 left-4 z-50">
                <button
                    data-student-toggle-button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                >
                    {isMobileMenuOpen ? (
                        <X className="h-5 w-5" />
                    ) : (
                        <Menu className="h-5 w-5" />
                    )}
                </button>
            </div>

            {/* Sidebar */}
            <motion.div
                data-student-sidebar
                initial={false}
                animate={{ 
                    x: isDesktop ? 0 : (isMobileMenuOpen ? 0 : '-100%')
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className={`fixed top-0 left-0 h-screen w-72 bg-gradient-to-b from-white to-gray-50 shadow-2xl z-30 flex flex-col border-r border-gray-200/70 ${
                    isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                }`}
                style={{ 
                    transform: isDesktop ? 'translateX(0)' : undefined,
                    position: 'fixed'
                }}
            >
                {/* Logo/Brand */}
                <motion.div 
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1, type: 'spring', stiffness: 100 }}
                    className="p-4 border-b border-gray-200/50 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 flex-shrink-0"
                >
                    <div className="flex items-center justify-center">
                        <img
                            className="h-8 w-auto"
                            src="https://static.wixstatic.com/media/bfee2e_7d499a9b2c40442e85bb0fa99e7d5d37~mv2.png/v1/fill/w_203,h_111,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/logo1.png"
                            alt="PYDAH GROUP"
                        />
                    </div>
                    <p className="text-xs text-gray-600/80 font-medium text-center mt-2">
                        Education & Beyond
                    </p>
                </motion.div>

                <nav className="flex-1 flex flex-col justify-between min-h-0">
                    <div className="flex flex-col space-y-1 px-4 mt-6 overflow-y-auto flex-1 pb-4">
                        <div className="space-y-2">
                            {navLinks.map((link, idx) => (
                                <motion.div
                                    key={link.name}
                                    initial={{ x: -30, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ 
                                        delay: 0.05 * idx, 
                                        type: 'spring', 
                                        stiffness: 80, 
                                        damping: 18 
                                    }}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <Link
                                        to={link.path}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 relative overflow-hidden
                                            ${isActive(link.path)
                                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                                                : 'text-gray-700 hover:bg-gray-100/80 hover:text-gray-900 hover:shadow-sm'
                                            }
                                        `}
                                    >
                                        {/* Active indicator */}
                                        {isActive(link.path) && (
                                            <motion.div
                                                layoutId="studentActiveTab"
                                                className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl"
                                                initial={false}
                                                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                            />
                                        )}
                                        
                                        <link.icon className={`mr-3 h-5 w-5 transition-all duration-300 relative z-10
                                            ${isActive(link.path)
                                                ? 'text-white' 
                                                : 'text-gray-500 group-hover:text-blue-600'
                                            }`} 
                                        />
                                        <span className="relative z-10 transition-all duration-300 font-medium text-sm">
                                            {link.name}
                                        </span>
                                        
                                        {/* Hover effect */}
                                        {!isActive(link.path) && (
                                            <motion.div
                                                className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-xl"
                                                initial={{ opacity: 0 }}
                                                whileHover={{ opacity: 1 }}
                                                transition={{ duration: 0.2 }}
                                            />
                                        )}
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </nav>

                {/* User Profile Section */}
                <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3, type: 'spring', stiffness: 100 }}
                    className="px-4 pb-6 mt-auto flex-shrink-0 border-t border-gray-200/50"
                >
                    <Link 
                        to="/student/profile" 
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-700 rounded-xl hover:bg-gray-100/80 transition-all duration-300 group"
                    >
                        <motion.div 
                            whileHover={{ rotate: 5 }}
                            className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0 shadow-md group-hover:shadow-lg"
                        >
                            <User className="w-4 h-4 text-white" />
                        </motion.div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{user?.name || 'Student'}</p>
                            <p className="text-xs text-gray-500/80">Student Account</p>
                        </div>
                    </Link>
                    
                    {/* Logout Button */}
                    <motion.button
                        onClick={() => {
                            handleLogout();
                            setIsMobileMenuOpen(false);
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-br from-gray-700 to-gray-800 text-white font-medium px-4 py-2.5 rounded-xl hover:shadow-lg transition-all duration-300 shadow-md mt-4 focus:outline-none focus:ring-2 focus:ring-gray-500/50"
                    >
                        <svg 
                            className="h-4 w-4 transition-transform duration-300 group-hover:rotate-180" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Sign Out</span>
                    </motion.button>
                </motion.div>
            </motion.div>
            
            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/30 backdrop-blur-sm z-20 lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}
            
            {/* Main Content */}
            <div className="flex-1 bg-gray-50/95 lg:ml-72">
                {/* Header */}
                <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm shadow-sm flex items-center h-16 sm:h-20 px-4 sm:px-6 border-b border-gray-200/70">
                    {/* Left: Hamburger menu */}
                    <div className="flex items-center flex-shrink-0 mr-2">
                        <button
                            className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100/50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-all duration-200"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            style={{ minWidth: 44, minHeight: 44 }}
                        >
                            <Menu className="h-6 w-6" />
                        </button>
                    </div>
                    {/* Center: Logo and system name */}
                    <div className="flex-1 flex items-center justify-center min-w-0">
                        <div className="h-8 w-14 sm:h-10 sm:w-20 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mr-2 shadow-sm">
                            <img 
                                src="https://static.wixstatic.com/media/bfee2e_7d499a9b2c40442e85bb0fa99e7d5d37~mv2.png/v1/fill/w_203,h_111,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/logo1.png" 
                                alt="Logo" 
                                className="h-5 w-auto sm:h-6 object-contain rounded-lg" 
                            />
                        </div>
                        <span className="text-lg sm:text-xl font-semibold text-gray-800 ml-2 truncate" style={{maxWidth: 'calc(100vw - 120px)'}}>
                            VERSANT SYSTEM
                        </span>
                    </div>
                    {/* Right: User info */}
                    <div className="flex items-center space-x-4 flex-shrink-0">
                        <button className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100/50 transition-colors duration-200">
                            <Bell className="h-5 w-5" />
                        </button>
                        <div className="flex items-center space-x-3">
                            <motion.div 
                                whileHover={{ scale: 1.05 }}
                                className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-sm"
                            >
                                <User className="h-4 w-4 text-white" />
                            </motion.div>
                            <span className="hidden md:block text-sm font-medium text-gray-700">
                                {user?.name}
                            </span>
                        </div>
                    </div>
                </header>
                
                {/* Content Area */}
                <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default StudentSidebar;