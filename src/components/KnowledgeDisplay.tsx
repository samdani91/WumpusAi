import React from 'react';
import { KnowledgeBase } from '../utils/KnowledgeBase';
import { Brain, Lightbulb, CheckCircle, XCircle } from 'lucide-react';

interface KnowledgeDisplayProps {
  knowledgeBase: KnowledgeBase;
}

export const KnowledgeDisplay: React.FC<KnowledgeDisplayProps> = ({ knowledgeBase }) => {
  const kb = knowledgeBase.getKnowledgeBase();
  const recentInferences = knowledgeBase.getRecentInferences(5);

  return (
    <div className="space-y-4">
      {/* Knowledge Base Overview */}
      <div className="bg-white p-4 rounded-lg shadow-lg">
        <h3 className="text-lg font-bold mb-3 flex items-center space-x-2">
          <Brain className="w-5 h-5 text-purple-600" />
          <span>Knowledge Base</span>
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Safe Positions:</span>
            <span className="text-sm text-green-600 font-semibold">
              {kb.safePositions.size}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Dangerous Positions:</span>
            <span className="text-sm text-red-600 font-semibold">
              {kb.dangerousPositions.size}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Visited Positions:</span>
            <span className="text-sm text-blue-600 font-semibold">
              {kb.visitedPositions.size}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Total Statements:</span>
            <span className="text-sm text-gray-600 font-semibold">
              {kb.statements.length}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Inferences */}
      <div className="bg-white p-4 rounded-lg shadow-lg">
        <h3 className="text-lg font-bold mb-3 flex items-center space-x-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          <span>Recent Inferences</span>
        </h3>
        
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {recentInferences.length === 0 ? (
            <p className="text-gray-500 text-sm">No recent inferences</p>
          ) : (
            recentInferences.map((inference, index) => (
              <div key={index} className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-sm text-gray-700">{inference}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Logical Statements */}
      <div className="bg-white p-4 rounded-lg shadow-lg">
        <h3 className="text-lg font-bold mb-3">Logical Statements</h3>
        
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {kb.statements.slice(-10).map((statement, index) => (
            <div key={index} className="flex items-center space-x-2 text-sm">
              {statement.value ? (
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              )}
              <span className="text-gray-700">
                {statement.type} at ({statement.position.row},{statement.position.col}): {statement.value ? 'True' : 'False'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Position Sets */}
      <div className="bg-white p-4 rounded-lg shadow-lg">
        <h3 className="text-lg font-bold mb-3">Position Analysis</h3>
        
        <div className="space-y-3 text-sm">
          <div>
            <span className="font-medium text-green-600">Safe Positions:</span>
            <div className="mt-1 flex flex-wrap gap-1">
              {Array.from(kb.safePositions).map(pos => (
                <span key={pos} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                  {pos}
                </span>
              ))}
            </div>
          </div>
          
          <div>
            <span className="font-medium text-red-600">Dangerous Positions:</span>
            <div className="mt-1 flex flex-wrap gap-1">
              {Array.from(kb.dangerousPositions).map(pos => (
                <span key={pos} className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                  {pos}
                </span>
              ))}
            </div>
          </div>
          
          <div>
            <span className="font-medium text-blue-600">Visited Positions:</span>
            <div className="mt-1 flex flex-wrap gap-1">
              {Array.from(kb.visitedPositions).map(pos => (
                <span key={pos} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                  {pos}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};