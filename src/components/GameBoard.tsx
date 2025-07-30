import React from 'react';
import { WorldState, Direction } from '../types/World';
import { Wind, Zap, Sparkles, Skull, User, ArrowUp, ArrowRight, ArrowDown, ArrowLeft, Target } from 'lucide-react';

interface GameBoardProps {
  world: WorldState;
  onCellClick?: (row: number, col: number) => void;
  arrowAnimation?: { active: boolean; direction: Direction; startPos: { row: number; col: number } };
}

export const GameBoard: React.FC<GameBoardProps> = ({ world, onCellClick, arrowAnimation }) => {
  const getDirectionIcon = (direction: Direction) => {
    switch (direction) {
      case Direction.NORTH:
        return <ArrowUp className="w-3 h-3" />;
      case Direction.EAST:
        return <ArrowRight className="w-3 h-3" />;
      case Direction.SOUTH:
        return <ArrowDown className="w-3 h-3" />;
      case Direction.WEST:
        return <ArrowLeft className="w-3 h-3" />;
      default:
        return <ArrowUp className="w-3 h-3" />;
    }
  };

  const getCellBackground = (row: number, col: number) => {
    const cell = world.grid[row][col];
    const isAgent = world.agentPosition.row === row && world.agentPosition.col === col;
    
    if (cell.hasPit) return 'bg-black border-gray-800'; // Black hole for pits
    if (isAgent) return 'bg-blue-200 border-blue-400';
    if (cell.isVisited) return 'bg-green-100 border-green-300';
    if (cell.isSafe) return 'bg-emerald-50 border-emerald-200';
    if (cell.isDangerous) return 'bg-red-50 border-red-200';
    return 'bg-gray-100 border-gray-300';
  };

  const isArrowPath = (row: number, col: number) => {
    if (!arrowAnimation?.active) return false;
    
    const { startPos, direction } = arrowAnimation;
    
    switch (direction) {
      case Direction.NORTH:
        return col === startPos.col && row < startPos.row;
      case Direction.SOUTH:
        return col === startPos.col && row > startPos.row;
      case Direction.EAST:
        return row === startPos.row && col > startPos.col;
      case Direction.WEST:
        return row === startPos.row && col < startPos.col;
      default:
        return false;
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="grid grid-cols-10 gap-1 mb-4">
        {Array.from({ length: 10 }, (_, row) =>
          Array.from({ length: 10 }, (_, col) => {
            const cell = world.grid[row][col];
            const isAgent = world.agentPosition.row === row && world.agentPosition.col === col;
            const isArrowTrail = isArrowPath(row, col);
            
            return (
              <div
                key={`${row}-${col}`}
                className={`
                  w-12 h-12 border-2 rounded-lg flex items-center justify-center cursor-pointer
                  transition-all duration-200 hover:scale-105 relative overflow-hidden
                  ${getCellBackground(row, col)}
                  ${isArrowTrail ? 'ring-2 ring-yellow-400 ring-opacity-75' : ''}
                `}
                onClick={() => onCellClick?.(row, col)}
              >
                {/* Pit - Black hole effect */}
                {cell.hasPit && (
                  <div className="absolute inset-0 bg-gradient-radial from-gray-600 via-gray-800 to-black rounded-lg">
                    <div className="absolute inset-2 bg-gradient-radial from-transparent via-gray-900 to-black rounded-full animate-pulse">
                      <div className="absolute inset-1 rounded-full shadow-inner"></div>
                    </div>
                  </div>
                )}

                {/* Agent */}
                {isAgent && !cell.hasPit && (
                  <div className="absolute inset-0 flex items-center justify-center z-20">
                    <div className="bg-blue-600 rounded-full p-1.5 flex items-center justify-center shadow-lg border-2 border-white">
                      <User className="w-4 h-4 text-white" />
                      <div className="absolute -top-1 -right-1 text-blue-800 bg-white rounded-full p-0.5 shadow-sm">
                        {getDirectionIcon(world.agentDirection)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Wumpus */}
                {cell.hasWumpus && !cell.hasPit && (
                  <div className="absolute top-1 left-1 z-10">
                    <div className="bg-red-600 rounded-full p-1 shadow-lg border border-red-800">
                      <Skull className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}

                {/* Gold */}
                {cell.hasGold && !cell.hasPit && (
                  <div className="absolute bottom-1 left-1 z-10">
                    <div className="bg-yellow-400 rounded-full p-1 shadow-lg border border-yellow-600 animate-pulse">
                      <Sparkles className="w-4 h-4 text-yellow-800" />
                    </div>
                  </div>
                )}

                {/* Stench indicator */}
                {cell.hasStench && !cell.hasPit && (
                  <div className="absolute bottom-1 right-1 z-10">
                    <div className="w-3 h-3 bg-green-600 rounded-full animate-pulse shadow-sm border border-green-800"></div>
                  </div>
                )}

                {/* Breeze indicator */}
                {cell.hasBreeze && !cell.hasPit && (
                  <div className="absolute top-1 right-1 z-10">
                    <div className="bg-cyan-100 rounded-full p-0.5 shadow-sm border border-cyan-300">
                      <Wind className="w-3 h-3 text-cyan-600 animate-pulse" />
                    </div>
                  </div>
                )}

                {/* Glitter effect */}
                {cell.hasGlitter && !cell.hasPit && (
                  <div className="absolute inset-0 flex items-center justify-center z-15">
                    <Zap className="w-8 h-8 text-yellow-400 animate-bounce drop-shadow-lg" />
                  </div>
                )}

                {/* Arrow trail animation */}
                {isArrowTrail && (
                  <div className="absolute inset-0 flex items-center justify-center z-30">
                    <div className="bg-yellow-500 rounded-full p-1 animate-ping">
                      <Target className="w-3 h-3 text-white" />
                    </div>
                  </div>
                )}

                {/* Coordinates */}
                <div className="absolute -bottom-5 left-0 text-xs text-gray-500 font-mono">
                  {row},{col}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Enhanced Legend */}
      <div className="grid grid-cols-2 gap-6 text-sm">
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-800 mb-2">Game Elements</h4>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-200 border border-blue-400 rounded flex items-center justify-center">
              <User className="w-2 h-2 text-blue-600" />
            </div>
            <span>Agent</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="bg-red-600 rounded-full p-0.5">
              <Skull className="w-3 h-3 text-white" />
            </div>
            <span>Wumpus</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-black rounded border border-gray-600"></div>
            <span>Pit (Black Hole)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="bg-yellow-400 rounded-full p-0.5">
              <Sparkles className="w-3 h-3 text-yellow-800" />
            </div>
            <span>Gold</span>
          </div>
        </div>
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-800 mb-2">Indicators</h4>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-600 rounded-full"></div>
            <span>Stench (Wumpus nearby)</span>
          </div>
          <div className="flex items-center space-x-2">
            <Wind className="w-3 h-3 text-cyan-600" />
            <span>Breeze (Pit nearby)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
            <span>Visited & Safe</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-50 border border-red-200 rounded"></div>
            <span>Dangerous Area</span>
          </div>
        </div>
      </div>

      {/* Game Instructions */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-blue-800 mb-1">Objective</h4>
        <p className="text-sm text-blue-700">
          Find the gold, grab it, and return to the starting position (9,0) to win! 
          Avoid pits and the Wumpus. Use logical reasoning to navigate safely.
        </p>
      </div>
    </div>
  );
};