import React from 'react';
import { X, AlertTriangle, CheckCircle } from 'lucide-react';

const UploadPreviewModal = ({ isOpen, onClose, previewData, onConfirm, fileName }) => {
  if (!isOpen) return null;

  const validStudents = previewData.filter(student => student.errors.length === 0);
  const invalidStudents = previewData.filter(student => student.errors.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Upload Preview for <span className="font-bold">{fileName}</span></h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="overflow-y-auto flex-grow">
          {invalidStudents.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-red-600 mb-2">Students with Errors ({invalidStudents.length})</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Roll Number</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Email</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Course</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Errors</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {invalidStudents.map((student, index) => (
                      <tr key={index} className="bg-red-50">
                        <td className="px-4 py-2 text-sm text-gray-900">{student.student_name}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{student.roll_number}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{student.email}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{student.course_name}</td>
                        <td className="px-4 py-2 text-sm text-red-700">
                          {student.errors.join(', ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <h3 className="text-lg font-semibold text-green-600 mb-2">Ready to Upload ({validStudents.length})</h3>
          {validStudents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Roll Number</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Email</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Mobile</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Course</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {validStudents.map((student, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 text-sm text-gray-900">{student.student_name}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{student.roll_number}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{student.email}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{student.mobile_number}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{student.course_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No valid students to upload.</p>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4 mt-auto">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(validStudents)}
            disabled={validStudents.length === 0}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400"
          >
            <CheckCircle className="h-4 w-4 mr-2 inline" />
            Confirm & Upload {validStudents.length} Students
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadPreviewModal; 