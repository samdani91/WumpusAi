import React, { useState, useEffect, useCallback } from 'react';
import { WorldState, Action, Perception } from './types/World';
import { WorldLoader as WorldLoaderUtil } from './utils/WorldLoader';
import { GameEngine } from './utils/GameEngine';
import { GameBoard } from './components/GameBoard';
import { ControlPanel } from './components/ControlPanel';
import { GameStatus } from './components/GameStatus';
import { KnowledgeDisplay } from './components/KnowledgeDisplay';
import { WorldLoader } from './components/WorldLoader';
import { Brain, Target, Settings, Play } from 'lucide-react';

function App() {
  const [world, setWorld] = useState<WorldState | null>(null);
  const [gameEngine, setGameEngine] = useState<GameEngine | null>(null);
  const [perception, setPerception] = useState<Perception>({
    stench: false,
    breeze: false,
    glitter: false,
    bump: false,
    scream: false
  });
  const [message, setMessage] = useState<string>('');
  const [autoPlaying, setAutoPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState<'game' | 'knowledge' | 'settings'>('game');

  const initializeGame = useCallback((worldString: string) => {
    try {
      const newWorld = WorldLoaderUtil.parseWorldFromString(worldString);
      const newEngine = new GameEngine(newWorld);
      
      setWorld(newWorld);
      setGameEngine(newEngine);
      setPerception(newEngine.getCurrentPerception());
      setMessage('World loaded successfully! Game started.');
      setAutoPlaying(false);
    } catch (error) {
      setMessage(`Error loading world: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, []);

  const generateRandomWorld = useCallback(() => {
    const newWorld = WorldLoaderUtil.generateRandomWorld();
    const newEngine = new GameEngine(newWorld);
    
    setWorld(newWorld);
    setGameEngine(newEngine);
    setPerception(newEngine.getCurrentPerception());
    setMessage('Random world generated! Game started.');
    setAutoPlaying(false);
  }, []);

  const executeAction = useCallback((action: Action) => {
    if (!gameEngine || !world) return;

    const result = gameEngine.executeAction(action);
    setWorld(gameEngine.getWorldState());
    setPerception(result.perception);
    setMessage(result.message);

    if (gameEngine.getWorldState().gameOver) {
      setAutoPlaying(false);
    }
  }, [gameEngine, world]);

  const handleAIStep = useCallback(() => {
    if (!gameEngine || !world || world.gameOver) return;

    const suggestedAction = gameEngine.suggestMove();
    if (suggestedAction) {
      executeAction(suggestedAction);
    } else {
      setMessage('AI has no suggested move');
    }
  }, [gameEngine, world, executeAction]);

  const toggleAutoPlay = useCallback(() => {
    setAutoPlaying(!autoPlaying);
  }, [autoPlaying]);

  // Auto-play effect
  useEffect(() => {
    if (!autoPlaying || !gameEngine || !world || world.gameOver) return;

    const interval = setInterval(() => {
      const suggestedAction = gameEngine.suggestMove();
      if (suggestedAction) {
        executeAction(suggestedAction);
      } else {
        setAutoPlaying(false);
      }
    }, 800); // Slightly faster for better user experience

    return () => clearInterval(interval);
  }, [autoPlaying, gameEngine, world, executeAction]);

  // Initialize with sample world
  useEffect(() => {
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
    initializeGame(sampleWorld);
  }, [initializeGame]);

  const TabButton: React.FC<{ tab: string; icon: React.ReactNode; children: React.ReactNode }> = ({ tab, icon, children }) => (
    <button
      onClick={() => setActiveTab(tab as any)}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
        activeTab === tab
          ? 'bg-blue-500 text-white'
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
      }`}
    >
      {icon}
      <span>{children}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Wumpus World AI Simulation</h1>
          <p className="text-lg text-gray-600">
            Logical Agent Navigation with Propositional Logic and Inference
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center space-x-4 mb-8">
          <TabButton tab="game" icon={<Play className="w-4 h-4" />}>
            Game
          </TabButton>
          <TabButton tab="knowledge" icon={<Brain className="w-4 h-4" />}>
            Knowledge Base
          </TabButton>
          <TabButton tab="settings" icon={<Settings className="w-4 h-4" />}>
            World Settings
          </TabButton>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column - Game Board */}
          <div className="xl:col-span-2">
            {world && (
              <GameBoard 
                world={world}
                arrowAnimation={gameEngine.getArrowAnimation()}
                onCellClick={(row, col) => {
                  console.log(`Clicked cell: (${row}, ${col})`);
                }}
              />
            )}
          </div>

          {/* Right Column - Context-dependent content */}
          <div className="space-y-6">
            {activeTab === 'game' && world && (
              <>
                <GameStatus 
                  world={world}
                  perception={perception}
                  message={message}
                />
                <ControlPanel
                  onAction={executeAction}
                  onAutoPlay={toggleAutoPlay}
                  onStep={handleAIStep}
                  hasArrow={world.agentHasArrow}
                  hasGold={world.agentHasGold}
                  autoPlaying={autoPlaying}
                  disabled={world.gameOver}
                />
              </>
            )}

            {activeTab === 'knowledge' && gameEngine && (
              <KnowledgeDisplay knowledgeBase={gameEngine.getKnowledgeBase()} />
            )}

            {activeTab === 'settings' && (
              <WorldLoader 
                onLoadWorld={initializeGame}
                onGenerateRandom={generateRandomWorld}
              />
            )}
          </div>
        </div>

        {/* Performance Metrics */}
        {world && (
          <div className="mt-8 bg-white p-4 rounded-lg shadow-lg">
            <h3 className="text-lg font-bold mb-2">Performance Metrics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">+1000</div>
                <div className="text-gray-600">Gold Bonus</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">-1000</div>
                <div className="text-gray-600">Death Penalty</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">-1</div>
                <div className="text-gray-600">Per Step</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">-10</div>
                <div className="text-gray-600">Arrow Usage</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;