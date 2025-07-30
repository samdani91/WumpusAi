import React from 'react';
import { Action } from '../types/World';
import { RotateCcw, RotateCw, MoveUp, Hand, Package, Zap, Play, Pause, SkipForward } from 'lucide-react';

interface ControlPanelProps {
  onAction: (action: Action) => void;
  onAutoPlay: () => void;
  onStep: () => void;
  hasArrow: boolean;
  hasGold: boolean;
  autoPlaying: boolean;
  disabled: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  onAction,
  onAutoPlay,
  onStep,
  hasArrow,
  hasGold,
  autoPlaying,
  disabled
}) => {
  const buttonClass = `
    flex items-center space-x-2 px-4 py-2 rounded-lg font-medium
    transition-all duration-200 hover:scale-105 disabled:opacity-50
    disabled:cursor-not-allowed disabled:hover:scale-100
  `;

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-lg font-bold mb-4">Agent Controls</h3>
      
      {/* Movement Controls */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onAction(Action.TURN_LEFT)}
            disabled={disabled}
            className={`${buttonClass} bg-blue-500 text-white hover:bg-blue-600`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Turn Left</span>
          </button>
          <button
            onClick={() => onAction(Action.TURN_RIGHT)}
            disabled={disabled}
            className={`${buttonClass} bg-blue-500 text-white hover:bg-blue-600`}
          >
            <RotateCw className="w-4 h-4" />
            <span>Turn Right</span>
          </button>
        </div>
        
        <button
          onClick={() => onAction(Action.MOVE_FORWARD)}
          disabled={disabled}
          className={`${buttonClass} bg-green-500 text-white hover:bg-green-600 w-full`}
        >
          <MoveUp className="w-4 h-4" />
          <span>Move Forward</span>
        </button>
      </div>

      {/* Action Controls */}
      <div className="mt-6 space-y-2">
        <button
          onClick={() => onAction(Action.GRAB)}
          disabled={disabled}
          className={`${buttonClass} bg-yellow-500 text-white hover:bg-yellow-600 w-full`}
        >
          <Hand className="w-4 h-4" />
          <span>Grab Gold</span>
        </button>
        
        <button
          onClick={() => onAction(Action.RELEASE)}
          disabled={disabled || !hasGold}
          className={`${buttonClass} bg-orange-500 text-white hover:bg-orange-600 w-full`}
        >
          <Package className="w-4 h-4" />
          <span>Release Gold</span>
        </button>
        
        <button
          onClick={() => onAction(Action.SHOOT)}
          disabled={disabled || !hasArrow}
          className={`${buttonClass} bg-red-500 text-white hover:bg-red-600 w-full`}
        >
          <Zap className="w-4 h-4" />
          <span>Shoot Arrow</span>
        </button>
      </div>

      {/* AI Controls */}
      <div className="mt-6 pt-4 border-t space-y-2">
        <button
          onClick={onAutoPlay}
          disabled={disabled}
          className={`${buttonClass} ${
            autoPlaying 
              ? 'bg-red-500 text-white hover:bg-red-600' 
              : 'bg-purple-500 text-white hover:bg-purple-600'
          } w-full`}
        >
          {autoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          <span>{autoPlaying ? 'Stop AI' : 'Start AI'}</span>
        </button>
        
        <button
          onClick={onStep}
          disabled={disabled || autoPlaying}
          className={`${buttonClass} bg-indigo-500 text-white hover:bg-indigo-600 w-full`}
        >
          <SkipForward className="w-4 h-4" />
          <span>AI Step</span>
        </button>
      </div>
    </div>
  );
};