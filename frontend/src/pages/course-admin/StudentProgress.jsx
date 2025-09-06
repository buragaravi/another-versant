import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNotification } from '../../contexts/NotificationContext';
import Header from '../../components/common/Header';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../services/api';
import { Filter } from 'lucide-react';

const StudentProgress = () => {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState("");
    const [filters, setFilters] = useState({ 
        module: '', 
        test_type: '',
        batch: ''
    });
    const { error } = useNotification();

    useEffect(() => {
        const fetchResults = async () => {
            try {
                setLoading(true);
                setErrorMsg("");
                // Fetch only course-relevant results
                const practiceRes = await api.get('/course-admin/student-practice-results');
                const onlineRes = await api.get('/course-admin/student-online-results');
                setResults([...(practiceRes.data.data || []), ...(onlineRes.data.data || [])]);
            } catch (err) {
                setErrorMsg('Failed to fetch test results. Please check your login status and try again.');
                error('Failed to fetch test results.');
            } finally {
                setLoading(false);
            }
        };
        fetchResults();
    }, [error]);

    const filteredResults = useMemo(() => {
        return results.filter(result => {
            const moduleMatch = filters.module ? result.module_name === filters.module : true;
            const typeMatch = filters.test_type ? result.test_type === filters.test_type : true;
            const batchMatch = filters.batch ? result.batch_name === filters.batch : true;
            return moduleMatch && typeMatch && batchMatch;
        });
    }, [results, filters]);

    const moduleOptions = useMemo(() => [...new Set(results.map(r => r.module_name))], [results]);
    const typeOptions = useMemo(() => [...new Set(results.map(r => r.test_type))], [results]);
    const batchOptions = useMemo(() => [...new Set(results.map(r => r.batch_name).filter(Boolean))], [results]);

    const handleFilterChange = (e) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <Header />
            <div className="flex-1 overflow-x-hidden overflow-y-auto">
                <main className="px-6 lg:px-10 py-12">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <h1 className="text-3xl font-bold text-headline">Course Results & Analytics</h1>
                        <p className="mt-2 text-paragraph">View and analyze results from all student test submissions in your course.</p>

                        <div className="mt-8 bg-secondary rounded-2xl shadow-lg">
                            <div className="p-6 border-b border-stroke">
                                <h3 className="text-xl font-semibold text-gray-800 flex items-center"><Filter className="mr-3 h-5 w-5 text-gray-400" /> Filters</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4 mt-4">
                                    <select name="module" value={filters.module} onChange={handleFilterChange} className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
                                        <option value="">All Modules</option>
                                        {moduleOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                    <select name="test_type" value={filters.test_type} onChange={handleFilterChange} className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
                                        <option value="">All Types</option>
                                        {typeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                    <select name="batch" value={filters.batch} onChange={handleFilterChange} className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
                                        <option value="">All Batches</option>
                                        {batchOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                {loading ? <LoadingSpinner /> : errorMsg ? (
                                    <div className="text-red-600 text-center py-8 font-semibold">{errorMsg}</div>
                                ) : filteredResults.length === 0 ? (
                                    <div className="text-gray-500 text-center py-8">No results found.</div>
                                ) : (
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test Name</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Taken</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted At</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {filteredResults.map(result => (
                                                <tr key={result._id}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">{result.student_name}</div>
                                                        <div className="text-sm text-gray-500">{result.roll_number || result.student_email}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{result.batch_name || 'N/A'}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{result.test_name}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 capitalize">{result.test_type}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">{result.score?.toFixed(2) || 0.00}%</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                                        {result.time_taken ? (
                                                            <span>
                                                                {Math.floor(result.time_taken / 60)}m {result.time_taken % 60}s
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-400">N/A</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.submitted_at}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </main>
            </div>
        </div>
    );
};

export default StudentProgress; 