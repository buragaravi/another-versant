import React, { useState } from 'react';
import { verifyStudentsUpload, cleanupFailedStudents } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

const StudentUploadVerificationModal = ({ 
  isOpen, 
  onClose, 
  batchId, 
  uploadedStudents = [], 
  onVerificationComplete 
}) => {
  const [verificationResults, setVerificationResults] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const { success, error } = useNotification();

  const handleVerifyUpload = async () => {
    if (!uploadedStudents.length) {
      error('No students to verify.');
      return;
    }

    setIsVerifying(true);
    try {
      const studentEmails = uploadedStudents.map(s => s.email || s.student_email);
      const response = await verifyStudentsUpload(batchId, studentEmails);
      
      if (response.data.success) {
        setVerificationResults(response.data.data);
        success('Verification completed successfully.');
      } else {
        error(response.data.message || 'Verification failed.');
      }
    } catch (err) {
      error(err.response?.data?.message || 'An error occurred during verification.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCleanupFailed = async () => {
    if (!verificationResults) {
      error('Please verify uploads first.');
      return;
    }

    const failedEmails = verificationResults.verification_results
      .filter(r => !r.fully_uploaded)
      .map(r => r.email);

    if (!failedEmails.length) {
      success('No failed uploads to clean up.');
      return;
    }

    setIsCleaning(true);
    try {
      const response = await cleanupFailedStudents(batchId, failedEmails);
      
      if (response.data.success) {
        success('Cleanup completed successfully.');
        // Refresh verification results
        await handleVerifyUpload();
        if (onVerificationComplete) {
          onVerificationComplete();
        }
      } else {
        error(response.data.message || 'Cleanup failed.');
      }
    } catch (err) {
      error(err.response?.data?.message || 'An error occurred during cleanup.');
    } finally {
      setIsCleaning(false);
    }
  };

  const getStatusColor = (fullyUploaded) => {
    return fullyUploaded ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = (fullyUploaded) => {
    return fullyUploaded ? '✓' : '✗';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Student Upload Verification</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-600 text-2xl font-bold transition-colors"
          >
            &times;
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            Verify that students were successfully uploaded to the database and clean up any failed uploads.
          </p>
          
          <div className="flex gap-4 mb-4">
            <button
              onClick={handleVerifyUpload}
              disabled={isVerifying || !uploadedStudents.length}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isVerifying ? 'Verifying...' : 'Verify Uploads'}
            </button>
            
            {verificationResults && (
              <button
                onClick={handleCleanupFailed}
                disabled={isCleaning || !verificationResults.verification_results.some(r => !r.fully_uploaded)}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isCleaning ? 'Cleaning...' : 'Cleanup Failed Uploads'}
              </button>
            )}
          </div>
        </div>

        {verificationResults && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">Upload Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-800">
                    {verificationResults.summary.total_students}
                  </div>
                  <div className="text-sm text-gray-600">Total Students</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {verificationResults.summary.successful_uploads}
                  </div>
                  <div className="text-sm text-gray-600">Successful</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {verificationResults.summary.failed_uploads}
                  </div>
                  <div className="text-sm text-gray-600">Failed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {verificationResults.summary.success_rate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Success Rate</div>
                </div>
              </div>
            </div>

            {/* Detailed Results */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Detailed Results</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-4 py-2 text-left">Email</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">User Account</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">Student Profile</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {verificationResults.verification_results.map((result, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-2">
                          {result.email}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          <span className={`font-semibold ${result.user_account_exists ? 'text-green-600' : 'text-red-600'}`}>
                            {result.user_account_exists ? '✓' : '✗'}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          <span className={`font-semibold ${result.student_profile_exists ? 'text-green-600' : 'text-red-600'}`}>
                            {result.student_profile_exists ? '✓' : '✗'}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          <span className={`font-semibold ${getStatusColor(result.fully_uploaded)}`}>
                            {getStatusIcon(result.fully_uploaded)} {result.fully_uploaded ? 'Complete' : 'Failed'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recommendations */}
            {verificationResults.summary.failed_uploads > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-yellow-800 mb-2">Recommendations</h4>
                <ul className="text-yellow-700 space-y-1">
                  <li>• {verificationResults.summary.failed_uploads} students failed to upload properly</li>
                  <li>• Use the "Cleanup Failed Uploads" button to remove orphaned records</li>
                  <li>• Re-upload the failed students after cleanup</li>
                  <li>• Check the file format and data for any issues</li>
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentUploadVerificationModal; 