import React from 'react';

export default function TestSummaryDisplay({ testData, modules = [], levels = [], grammarCategories = [] }) {
  const getDisplay = (val, arr) => {
    if (typeof val === 'object' && val !== null) {
      // Safely handle object values without causing serialization issues
      return val.label || val.name || val.id || val.value || 'N/A';
    }
    if (arr && arr.length && typeof val === 'string') {
      const found = arr.find(x => x.id === val);
      if (found) return found.label || found.name || found.id;
    }
    return val || 'N/A';
  };
  
  const getArrayDisplay = arr => {
    if (!Array.isArray(arr)) return 'N/A';
    return arr.map(x => getDisplay(x)).filter(Boolean).join(', ') || 'N/A';
  };
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
      <div><strong className="text-gray-500 block">Campus:</strong><span className="text-gray-800">{getDisplay(testData.campus)}</span></div>
      <div><strong className="text-gray-500 block">Batches:</strong><span className="text-gray-800">{getArrayDisplay(testData.batches)}</span></div>
      <div><strong className="text-gray-500 block">Courses:</strong><span className="text-gray-800">{getArrayDisplay(testData.courses)}</span></div>
      <div><strong className="text-gray-500 block">Test Type:</strong><span className="text-gray-800">{testData.test_type || 'N/A'}</span></div>
      <div><strong className="text-gray-500 block">Module:</strong><span className="text-gray-800">{getDisplay(testData.module, modules)}</span></div>
      {testData.module === 'GRAMMAR' && testData.subcategory ? (
        <div><strong className="text-gray-500 block">Grammar Category:</strong><span className="text-gray-800">{getDisplay(testData.subcategory, grammarCategories)}</span></div>
      ) : testData.module !== 'VOCABULARY' && testData.level ? (
        <div><strong className="text-gray-500 block">Level:</strong><span className="text-gray-800">{getDisplay(testData.level, levels)}</span></div>
      ) : null}
    </div>
  );
} 