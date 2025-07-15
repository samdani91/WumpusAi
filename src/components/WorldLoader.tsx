import React, { useState } from 'react';
import { Upload, FileText, Shuffle } from 'lucide-react';

interface WorldLoaderProps {
  onLoadWorld: (worldString: string) => void;
  onGenerateRandom: () => void;
}

export const WorldLoader: React.FC<WorldLoaderProps> = ({ onLoadWorld, onGenerateRandom }) => {
  const [worldText, setWorldText] = useState('');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setWorldText(content);
        onLoadWorld(content);
      };
      reader.readAsText(file);
    }
  };

  const handleTextLoad = () => {
    if (worldText.trim()) {
      onLoadWorld(worldText);
    }
  };

  const sampleWorld = `---P--P---
--W-------
------P---
-----P----
---G------
W-----P---
----------
P------W--
---P--P---
----------`;

  const loadSample = () => {
    setWorldText(sampleWorld);
    onLoadWorld(sampleWorld);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-lg font-bold mb-4">Load World</h3>
      
      <div className="space-y-4">
        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium mb-2">Upload World File</label>
          <div className="flex items-center space-x-2">
            <input
              type="file"
              accept=".txt"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600 transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Choose File</span>
            </label>
          </div>
        </div>

        {/* Text Input */}
        <div>
          <label className="block text-sm font-medium mb-2">Or Enter World Text</label>
          <textarea
            value={worldText}
            onChange={(e) => setWorldText(e.target.value)}
            placeholder="Enter world configuration (10x10 grid with W=Wumpus, P=Pit, G=Gold, -=Empty)"
            className="w-full h-32 p-3 border border-gray-300 rounded-lg font-mono text-sm resize-none"
          />
          <div className="mt-2 flex space-x-2">
            <button
              onClick={handleTextLoad}
              disabled={!worldText.trim()}
              className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              <FileText className="w-4 h-4" />
              <span>Load World</span>
            </button>
            <button
              onClick={loadSample}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>Load Sample</span>
            </button>
          </div>
        </div>

        {/* Generate Random */}
        <div className="pt-4 border-t">
          <button
            onClick={onGenerateRandom}
            className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors w-full justify-center"
          >
            <Shuffle className="w-4 h-4" />
            <span>Generate Random World</span>
          </button>
        </div>
      </div>

      {/* World Format Info */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium mb-2">World Format</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>W</strong> = Wumpus</p>
          <p><strong>P</strong> = Pit</p>
          <p><strong>G</strong> = Gold</p>
          <p><strong>-</strong> = Empty space</p>
          <p className="mt-2">Must be exactly 10x10 grid</p>
          <p>Agent starts at bottom-left (9,0)</p>
        </div>
      </div>
    </div>
  );
};