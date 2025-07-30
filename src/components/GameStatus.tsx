import React from 'react';
import { WorldState, Perception } from '../types/World';
import { Heart, Zap, Sparkles, Trophy, Skull, Wind, Eye } from 'lucide-react';

interface GameStatusProps {
  world: WorldState;
  perception: Perception;
  message: string;
}

export const GameStatus: React.FC<GameStatusProps> = ({ world, perception, message }) => {
  return (
    <div className="space-y-4">
      {/* Game Info */}
      <div className="bg-white p-4 rounded-lg shadow-lg">
        <h3 className="text-lg font-bold mb-3">Game Status</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <span className="font-medium">Score: {world.score}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Heart className={`w-5 h-5 ${world.agentAlive ? 'text-green-500' : 'text-red-500'}`} />
            <span className="font-medium">Status: {world.agentAlive ? 'Alive' : 'Dead'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            <span className="font-medium">Gold: {world.agentHasGold ? 'Yes' : 'No'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-red-500" />
            <span className="font-medium">Arrow: {world.agentHasArrow ? 'Yes' : 'No'}</span>
          </div>
        </div>
        
        {world.gameOver && (
          <div className={`mt-4 p-3 rounded-lg ${
            world.gameWon 
              ? 'bg-green-100 border border-green-300 text-green-800' 
              : 'bg-red-100 border border-red-300 text-red-800'
          }`}>
            <div className="flex items-center space-x-2">
              {world.gameWon ? (
                <Trophy className="w-5 h-5" />
              ) : (
                <Skull className="w-5 h-5" />
              )}
              <span className="font-bold">
                {world.gameWon ? 'Victory!' : 'Game Over'}
              </span>
            </div>
            <p className="mt-1">Final Score: {world.score}</p>
          </div>
        )}
      </div>

      {/* Current Perception */}
      <div className="bg-white p-4 rounded-lg shadow-lg">
        <h3 className="text-lg font-bold mb-3">Current Perception</h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${perception.stench ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <span>Stench: {perception.stench ? 'Yes' : 'No'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Wind className={`w-4 h-4 ${perception.breeze ? 'text-cyan-500' : 'text-gray-300'}`} />
            <span>Breeze: {perception.breeze ? 'Yes' : 'No'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Sparkles className={`w-4 h-4 ${perception.glitter ? 'text-yellow-500' : 'text-gray-300'}`} />
            <span>Glitter: {perception.glitter ? 'Yes' : 'No'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${perception.bump ? 'bg-red-500' : 'bg-gray-300'}`}></div>
            <span>Bump: {perception.bump ? 'Yes' : 'No'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${perception.scream ? 'bg-orange-500' : 'bg-gray-300'}`}></div>
            <span>Scream: {perception.scream ? 'Yes' : 'No'}</span>
          </div>
        </div>
      </div>

      {/* Last Action Message */}
      {message && (
        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <Eye className="w-4 h-4 text-blue-600" />
            <span className="text-blue-800 font-medium">{message}</span>
          </div>
        </div>
      )}
    </div>
  );
};