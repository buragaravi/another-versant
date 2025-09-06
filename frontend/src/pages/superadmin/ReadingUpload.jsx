import React, { useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export default function ReadingUpload({ questions, setQuestions, onNext, onBack }) {
  const [previewQuestions, setPreviewQuestions] = useState([]);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [error, setError] = useState('');

  const processQuestionsForPreview = (parsedQuestions) => {
    const existingQuestionTexts = new Set(questions.map(q => q.question.trim().toLowerCase()));
    const questionsForPreview = [];
    parsedQuestions.forEach(q => {
      const questionText = q.question?.trim();
      if (!questionText) return;
      const questionTextLower = questionText.toLowerCase();
      if (existingQuestionTexts.has(questionTextLower)) {
        questionsForPreview.push({ ...q, status: 'Duplicate' });
      } else {
        questionsForPreview.push({ ...q, status: 'New' });
        existingQuestionTexts.add(questionTextLower);
      }
    });
    if (questionsForPreview.length === 0) {
      setError('Could not find any questions in the uploaded file.');
      return;
    }
    setPreviewQuestions(questionsForPreview);
    setIsPreviewModalOpen(true);
  };

  const handleConfirmPreview = () => {
    const newQuestions = previewQuestions.filter(q => q.status === 'New');
    setQuestions(current => [...current, ...newQuestions]);
    setIsPreviewModalOpen(false);
    setPreviewQuestions([]);
    setError('');
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const allowedTypes = [
      'text/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/octet-stream'
    ];
    const fileExtension = file.name.toLowerCase().split('.').pop();
    const isValidExtension = ['csv', 'xlsx', 'xls'].includes(fileExtension);
    const isValidType = allowedTypes.includes(file.type) || file.type === '';
    if (!isValidExtension && !isValidType) {
      setError(`Invalid file type. Please upload a .csv, .xlsx, or .xls file. Received: ${file.type || fileExtension}`);
      event.target.value = null;
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        let parsedQuestions = [];
        if (fileExtension === 'csv' || file.type === 'text/csv') {
          const result = Papa.parse(e.target.result, { header: true, skipEmptyLines: true, trimHeaders: true, trimValues: true });
          if (result.data.length === 0) throw new Error('No data found in CSV file.');
          parsedQuestions = result.data.map(row => ({
            question: row.question || row.Question || '',
            instructions: row.instructions || row.Instructions || '',
          }));
        } else {
          const workbook = XLSX.read(e.target.result, { type: 'array' });
          if (!workbook.SheetNames.length) throw new Error('No sheets found in Excel file.');
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          if (!worksheet) throw new Error(`Sheet "${sheetName}" not found.`);
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          parsedQuestions = jsonData.map(row => ({
            question: row.question || row.Question || '',
            instructions: row.instructions || row.Instructions || '',
          }));
        }
        const finalQuestions = parsedQuestions.filter(q => q && q.question && q.question.trim() !== '');
        if (finalQuestions.length === 0) throw new Error('No valid questions found in the file.');
        processQuestionsForPreview(finalQuestions);
      } catch (err) {
        setError(`File processing error: ${err.message}`);
      }
    };
    reader.onerror = () => setError('An unexpected error occurred while reading the file.');
    if (fileExtension === 'csv' || file.type === 'text/csv') {
      reader.readAsText(file, 'UTF-8');
    } else {
      reader.readAsArrayBuffer(file);
    }
    event.target.value = null;
  };

  return (
    <div>
      <h3 className="font-semibold text-lg mb-2">Upload MCQ Questions for Reading Module</h3>
      <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} />
      {error && <div className="text-red-600 mt-2">{error}</div>}
      {/* Preview Modal */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h4 className="font-bold mb-2">Preview Questions</h4>
            <ul className="max-h-60 overflow-y-auto mb-4">
              {previewQuestions.map((q, i) => (
                <li key={i} className={q.status === 'Duplicate' ? 'text-yellow-600' : 'text-green-700'}>
                  {q.question} <span className="text-xs">({q.status})</span>
                </li>
              ))}
            </ul>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setIsPreviewModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
              <button onClick={handleConfirmPreview} className="px-4 py-2 bg-blue-600 text-white rounded">Add New</button>
            </div>
          </div>
        </div>
      )}
      <div className="flex gap-2 mt-4">
        <button onClick={onBack} className="px-4 py-2 bg-gray-200 rounded">Back</button>
        <button onClick={onNext} className="px-4 py-2 bg-blue-600 text-white rounded">Next</button>
      </div>
    </div>
  );
} 