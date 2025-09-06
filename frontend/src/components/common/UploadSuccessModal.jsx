import React from 'react';
import { X, CheckCircle, Clipboard } from 'lucide-react';

const UploadSuccessModal = ({ isOpen, onClose, results, onCopyToClipboard }) => {
  if (!isOpen) return null;

  const { created_students, errors } = results;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Upload Results</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="overflow-y-auto flex-grow">
          {created_students && created_students.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-green-600 mb-2">
                <CheckCircle className="inline-block mr-2 h-5 w-5" />
                Successfully Created Students ({created_students.length})
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                The following students have been created with their initial login credentials.
              </p>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Roll Number</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Username</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Password</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {created_students.map((student, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm text-gray-900">{student.student_name}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{student.roll_number}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{student.username}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{student.password}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {errors && errors.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-red-600 mb-2">Upload Errors ({errors.length})</h3>
              <ul className="list-disc list-inside bg-red-50 p-4 rounded-md text-red-700 text-sm">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-4 mt-auto">
          <button
            onClick={() => onCopyToClipboard(created_students)}
            className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Clipboard className="h-4 w-4 mr-2" />
            Copy Credentials to Clipboard
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadSuccessModal; 