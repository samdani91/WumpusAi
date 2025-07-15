export interface Position {
  row: number;
  col: number;
}

export interface Cell {
  hasWumpus: boolean;
  hasPit: boolean;
  hasGold: boolean;
  hasStench: boolean;
  hasBreeze: boolean;
  hasGlitter: boolean;
  isVisited: boolean;
  isSafe: boolean; 
  isDangerous: boolean; 
  isBlocked: boolean; 
}

export interface WorldState {
  grid: Cell[][];
  size: number;
  agentPosition: Position;
  agentDirection: Direction;
  agentHasGold: boolean;
  agentHasArrow: boolean;
  agentAlive: boolean;
  wumpusAlive: boolean;
  score: number;
  gameOver: boolean;
  gameWon: boolean;
}

export enum Direction {
  NORTH = 0,
  EAST = 1,
  SOUTH = 2,
  WEST = 3
}

export enum Action {
  TURN_LEFT = 'TURN_LEFT',
  TURN_RIGHT = 'TURN_RIGHT',
  MOVE_FORWARD = 'MOVE_FORWARD',
  GRAB = 'GRAB',
  RELEASE = 'RELEASE',
  SHOOT = 'SHOOT'
}

export interface Perception {
  stench: boolean;
  breeze: boolean;
  glitter: boolean;
  bump: boolean;
  scream: boolean;
}

export interface LogicalStatement {
  type: 'WUMPUS' | 'PIT' | 'SAFE' | 'VISITED' | 'STENCH' | 'BREEZE';
  position: Position;
  value: boolean;
}

export interface KnowledgeBase {
  statements: LogicalStatement[];
  inferences: string[];
  safePositions: Set<string>;
  dangerousPositions: Set<string>;
  visitedPositions: Set<string>;
  
  
  addPerception(position: Position, stench: boolean, breeze: boolean, glitter: boolean): void;
  markVisited(position: Position): void;
  markWumpusDead(position: Position): void;
  removeStench(row: number, col: number): void;
  getRiskLevel(position: Position): 'SAFE' | 'PROBABLY_SAFE' | 'UNCERTAIN' | 'DANGEROUS';
  isSafe(position: Position): boolean;
  isVisited(position: Position): boolean;
  isDangerous(position: Position): boolean;
  getSafeUnvisitedPositions(): Position[];
  getWumpusProbability(position: Position): number; 
}
