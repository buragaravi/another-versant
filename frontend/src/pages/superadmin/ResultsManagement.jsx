import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    BarChart3, 
    Users, 
    TrendingUp, 
    Eye, 
    ChevronDown, 
    ChevronUp,
    FileSpreadsheet,
    Download,
    RefreshCw,
    CheckCircle,
    XCircle,
    Calendar,
    Clock,
    User,
    Mail,
    Phone,
    BookOpen
} from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';
import api from '../../services/api';

// Test Details View Component
const TestDetailsView = ({ 
    test, 
    testAttempts, 
    onBack, 
    onStudentClick, 
    onExportTestResults, 
    exportLoading 
}) => {
    const attempts = testAttempts[test.test_id] || [];
    
    // Calculate additional analytics
    const totalStudents = attempts.length;
    const passedStudents = attempts.filter(student => student.highest_score >= 50).length;
    const failedStudents = totalStudents - passedStudents;
    const averageTime = attempts.length > 0 
        ? (attempts.reduce((sum, student) => sum + (student.average_time || 0), 0) / attempts.length).toFixed(1)
        : 0;
    
    return (
        <div className="space-y-6">
            {/* Header with Back Button */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ChevronDown className="w-4 h-4 rotate-90" />
                    Back to Tests
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{test.test_name}</h1>
                    <p className="text-gray-600">Detailed analysis and student performance</p>
                </div>
            </div>

            {/* Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Students</p>
                            <p className="text-3xl font-bold text-gray-900">{totalStudents}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Pass Rate</p>
                            <p className="text-3xl font-bold text-green-600">
                                {totalStudents > 0 ? ((passedStudents / totalStudents) * 100).toFixed(1) : 0}%
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Average Score</p>
                            <p className="text-3xl font-bold text-blue-600">{test.average_score}%</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Highest Score</p>
                            <p className="text-3xl font-bold text-purple-600">{test.highest_score}%</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                            <BarChart3 className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Student Attempts Section */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-gray-900">
                            Student Attempts ({totalStudents} students)
                        </h2>
                        <div className="flex gap-2">
                            <button
                                onClick={() => onExportTestResults(test.test_id, test.test_name, 'excel')}
                                disabled={exportLoading}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                                {exportLoading ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                    <FileSpreadsheet className="w-4 h-4" />
                                )}
                                Export Excel
                            </button>
                            <button
                                onClick={() => onExportTestResults(test.test_id, test.test_name, 'csv')}
                                disabled={exportLoading}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                {exportLoading ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Download className="w-4 h-4" />
                                )}
                                Export CSV
                            </button>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {attempts.length === 0 ? (
                        <div className="text-center py-12">
                            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No attempts found</h3>
                            <p className="text-gray-500">No students have attempted this test yet.</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Student Name
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Campus
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Course
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Batch
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Total Questions
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Correct Answers
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Score
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Attempts
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Latest Attempt
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {attempts.map((student, studentIndex) => (
                                    <motion.tr
                                        key={student.student_id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: studentIndex * 0.05 }}
                                        className="hover:bg-gray-50 cursor-pointer"
                                        onClick={() => onStudentClick(student.student_id, test.test_id)}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                                                    {student.student_name?.charAt(0)?.toUpperCase() || 'S'}
                                                </div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {student.student_name}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {student.student_email}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {student.campus_name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {student.course_name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {student.batch_name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {student.total_questions}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {student.correct_answers}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                                            {student.highest_score.toFixed(1)}%
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {student.attempts_count}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {student.latest_attempt ? new Date(student.latest_attempt).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <Eye className="w-4 h-4" />
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

const ResultsManagement = () => {
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState("");
    const [tests, setTests] = useState([]);
    const [expandedTest, setExpandedTest] = useState(null);
    const [testAttempts, setTestAttempts] = useState({});
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [studentAttemptDetails, setStudentAttemptDetails] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);
    const [currentView, setCurrentView] = useState('list'); // 'list' or 'test-details'
    const [selectedTest, setSelectedTest] = useState(null);
    const { error, success } = useNotification();

    useEffect(() => {
        window.scrollTo(0, 0);
        fetchTests();
    }, []);

    const fetchTests = async () => {
        try {
            setLoading(true);
            setErrorMsg("");
            
            const response = await api.get('/superadmin/online-tests-overview');
            if (response.data.success) {
                setTests(response.data.data || []);
            } else {
                setErrorMsg(response.data.message || 'Failed to fetch tests.');
                error(response.data.message || 'Failed to fetch tests.');
            }
        } catch (err) {
            setErrorMsg('Failed to fetch tests. Please check your login status and try again.');
            error('Failed to fetch tests.');
            console.error('Error fetching tests:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchTestAttempts = async (testId) => {
        try {
            const response = await api.get(`/superadmin/test-attempts/${testId}`);
            if (response.data.success) {
                setTestAttempts(prev => ({
                    ...prev,
                    [testId]: response.data.data || []
                }));
            } else {
                error('Failed to fetch test attempts.');
            }
        } catch (err) {
            console.error('Error fetching test attempts:', err);
            error('Failed to fetch test attempts.');
        }
    };

    const handleTestClick = async (testId) => {
        const test = tests.find(t => t.test_id === testId);
        if (test) {
            setSelectedTest(test);
            setCurrentView('test-details');
            if (!testAttempts[testId]) {
                await fetchTestAttempts(testId);
            }
        }
    };

    const handleBackToList = () => {
        setCurrentView('list');
        setSelectedTest(null);
        setExpandedTest(null);
    };

    const handleStudentClick = async (studentId, testId) => {
        try {
            const response = await api.get(`/superadmin/student-attempts/${studentId}/${testId}`);
            if (response.data.success) {
                setStudentAttemptDetails(response.data.data);
                setSelectedStudent(studentId);
                setShowDetailsModal(true);
            } else {
                error('Failed to fetch student attempt details.');
            }
        } catch (err) {
            console.error('Error fetching student details:', err);
            error('Failed to fetch student attempt details.');
        }
    };

    const handleExportTestResults = async (testId, testName, format = 'excel') => {
        setExportLoading(true);
        try {
            const endpoint = format === 'csv' 
                ? `/superadmin/export-test-attempts-csv/${testId}`
                : `/superadmin/export-test-attempts/${testId}`;
            
            const response = await api.get(endpoint, {
                responseType: 'blob'
            });
            
            const mimeType = format === 'csv' 
                ? 'text/csv' 
                : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            
            const fileExtension = format === 'csv' ? 'csv' : 'xlsx';
            
            const blob = new Blob([response.data], { type: mimeType });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${testName}_student_results.${fileExtension}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            success(`Test results exported as ${format.toUpperCase()} successfully!`);
        } catch (err) {
            console.error('Export error:', err);
            error('Failed to export test results. Please try again.');
        } finally {
            setExportLoading(false);
        }
    };

    const closeDetailsModal = () => {
        setShowDetailsModal(false);
        setStudentAttemptDetails(null);
        setSelectedStudent(null);
    };

    if (loading) {
        return (
            <main className="px-6 lg:px-10 py-12">
                <div className="flex items-center justify-center h-64">
                    <div className="flex items-center gap-3">
                        <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                        <span className="text-lg text-gray-600">Loading tests...</span>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <>
            <main className="px-6 lg:px-10 py-12">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {currentView === 'test-details' && selectedTest ? (
                        <TestDetailsView
                            test={selectedTest}
                            testAttempts={testAttempts}
                            onBack={handleBackToList}
                            onStudentClick={handleStudentClick}
                            onExportTestResults={handleExportTestResults}
                            exportLoading={exportLoading}
                        />
                    ) : (
                        <>
                            {/* Header */}
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">
                                        Online Tests Overview
                                    </h1>
                                    <p className="mt-2 text-gray-600">
                                        Click on a test to view student attempts and detailed results
                                    </p>
                                </div>
                            </div>

                    {/* Error Message */}
                    {errorMsg && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-700">{errorMsg}</p>
                        </div>
                    )}

                    {/* Tests Table */}
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Test Name
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Category
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Attempts
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Highest Score
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Average Score
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {tests.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-12 text-center">
                                                <div className="flex flex-col items-center">
                                                    <BarChart3 className="w-12 h-12 text-gray-400 mb-4" />
                                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No online tests found</h3>
                                                    <p className="text-gray-500">No online tests are available in the system.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        tests.map((test, index) => (
                                            <motion.tr
                                                key={test.test_id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                                className="hover:bg-gray-50 cursor-pointer"
                                                onClick={() => handleTestClick(test.test_id)}
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                                                            {test.test_name?.charAt(0)?.toUpperCase() || 'T'}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {test.test_name}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {test.unique_students} students
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {test.category}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {test.total_attempts}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                                                    {test.highest_score}%
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                                                    {test.average_score}%
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <Eye className="w-5 h-5" />
                                                </td>
                                            </motion.tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                        </>
                    )}
                </motion.div>
            </main>

            {/* Student Attempt Details Modal */}
            {showDetailsModal && studentAttemptDetails && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
                    >
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-semibold text-gray-900">
                                    Student Attempt Details
                                </h3>
                                <button
                                    onClick={closeDetailsModal}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[70vh]">
                            {studentAttemptDetails.length === 0 ? (
                                <div className="text-center py-8">
                                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No attempt details found</h3>
                                    <p className="text-gray-500">No detailed results available for this student's attempt.</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {studentAttemptDetails.map((attempt, attemptIndex) => (
                                        <div key={attemptIndex} className="border border-gray-200 rounded-lg p-4">
                                            <div className="flex justify-between items-center mb-4">
                                                <h4 className="text-lg font-medium text-gray-900">
                                                    Attempt {attemptIndex + 1}
                                                </h4>
                                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-4 h-4" />
                                                        {attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleDateString() : 'N/A'}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-4 h-4" />
                                                        {attempt.time_taken || 'N/A'} min
                                                    </span>
                                                    <span className="font-medium text-green-600">
                                                        Score: {attempt.score_percentage?.toFixed(1) || 0}%
                                                    </span>
                                                </div>
                                            </div>

                                            {attempt.detailed_results && attempt.detailed_results.length > 0 && (
                                                <div className="space-y-3">
                                                    {attempt.detailed_results.map((result, questionIndex) => (
                                                        <div key={questionIndex} className="border border-gray-100 rounded-lg p-4">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <h5 className="font-medium text-gray-900">
                                                                    Question {questionIndex + 1}
                                                                </h5>
                                                                <div className={`flex items-center gap-1 ${
                                                                    result.is_correct ? 'text-green-600' : 'text-red-600'
                                                                }`}>
                                                                    {result.is_correct ? (
                                                                        <CheckCircle className="w-5 h-5" />
                                                                    ) : (
                                                                        <XCircle className="w-5 h-5" />
                                                                    )}
                                                                    <span className="text-sm font-medium">
                                                                        {result.is_correct ? 'Correct' : 'Incorrect'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            
                                                            <div className="mb-3">
                                                                <p className="text-gray-700 mb-2">
                                                                    {result.question_text || 'Question text not available'}
                                                                </p>
                                                            </div>

                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                <div>
                                                                    <label className="text-sm font-medium text-gray-600">Student's Answer:</label>
                                                                    <p className={`mt-1 p-2 rounded ${
                                                                        result.is_correct ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                                                                    }`}>
                                                                        {result.student_answer || result.selected_answer || 'No answer provided'}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <label className="text-sm font-medium text-gray-600">Correct Answer:</label>
                                                                    <p className="mt-1 p-2 rounded bg-gray-50 text-gray-800">
                                                                        {result.correct_answer_text || result.correct_answer || 'Not available'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </>
    );
};

export default ResultsManagement;
