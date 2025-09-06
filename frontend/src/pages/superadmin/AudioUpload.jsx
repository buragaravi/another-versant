import React, { useState } from 'react';

export default function AudioUpload({ audioFiles, setAudioFiles, onNext, onBack, moduleName }) {
  const [error, setError] = useState('');
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(f => f.type.startsWith('audio/'));
    if (validFiles.length !== files.length) {
      setError('Only audio files are allowed.');
      return;
    }
    setAudioFiles(validFiles);
    setError('');
  };
  return (
    <div>
      <h3 className="font-semibold text-lg mb-2">Upload Audio Files for {moduleName}</h3>
      <input type="file" accept="audio/*" multiple onChange={handleFileChange} />
      {error && <div className="text-red-600 mt-2">{error}</div>}
      <ul className="mt-2">
        {audioFiles && audioFiles.map((file, i) => (
          <li key={i}>{file.name} <audio controls src={URL.createObjectURL(file)} className="inline ml-2" /></li>
        ))}
      </ul>
      <div className="flex gap-2 mt-4">
        <button onClick={onBack} className="px-4 py-2 bg-gray-200 rounded">Back</button>
        <button onClick={onNext} className="px-4 py-2 bg-blue-600 text-white rounded">Next</button>
      </div>
    </div>
  );



} 