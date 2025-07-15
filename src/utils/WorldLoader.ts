/* eslint-disable @typescript-eslint/no-unused-vars */
import { Cell, WorldState, Direction, Position } from '../types/World';

export class WorldLoader {
  static parseWorldFromString(worldString: string): WorldState {
    const lines = worldString.trim().split('\n').filter(line => line.trim().length > 0);
    const size = lines.length;
    
    if (size !== 10) {
      throw new Error('World must be 10x10');
    }

    const grid: Cell[][] = [];
    
    // Initialize empty grid
    for (let row = 0; row < size; row++) {
      grid[row] = [];
      for (let col = 0; col < size; col++) {
        grid[row][col] = {
          hasWumpus: false,
          hasPit: false,
          hasGold: false,
          hasStench: false,
          hasBreeze: false,
          hasGlitter: false,
          isVisited: false,
          isSafe: false,
          isDangerous: false,
          isBlocked: false
        };
      }
    }

    // Parse world elements
    for (let row = 0; row < size; row++) {
      const line = lines[row];
      for (let col = 0; col < Math.min(line.length, size); col++) {
        const char = line[col];
        switch (char) {
          case 'W':
            grid[row][col].hasWumpus = true;
            break;
          case 'P':
            grid[row][col].hasPit = true;
            break;
          case 'G':
            grid[row][col].hasGold = true;
            grid[row][col].hasGlitter = true;
            break;
        }
      }
    }

    // Add stenches and breezes
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (grid[row][col].hasWumpus) {
          // Add stench to adjacent cells
          const adjacentCells = [
            { row: row - 1, col },
            { row: row + 1, col },
            { row, col: col - 1 },
            { row, col: col + 1 }
          ];
          
          adjacentCells.forEach(({ row: adjRow, col: adjCol }) => {
            if (adjRow >= 0 && adjRow < size && adjCol >= 0 && adjCol < size) {
              grid[adjRow][adjCol].hasStench = true;
            }
          });
        }
        
        if (grid[row][col].hasPit) {
          // Add breeze to adjacent cells
          const adjacentCells = [
            { row: row - 1, col },
            { row: row + 1, col },
            { row, col: col - 1 },
            { row, col: col + 1 }
          ];
          
          adjacentCells.forEach(({ row: adjRow, col: adjCol }) => {
            if (adjRow >= 0 && adjRow < size && adjCol >= 0 && adjCol < size) {
              grid[adjRow][adjCol].hasBreeze = true;
            }
          });
        }
      }
    }

    // Agent starts at bottom-left (9,0) and bottom-left is safe
    grid[9][0].isSafe = true;
    grid[9][0].isVisited = true;

    return {
      grid,
      size,
      agentPosition: { row: 9, col: 0 },
      agentDirection: Direction.NORTH,
      agentHasGold: false,
      agentHasArrow: true,
      agentAlive: true,
      wumpusAlive: true,
      score: 0,
      gameOver: false,
      gameWon: false
    };
  }

  static generateRandomWorld(): WorldState {
    const size = 10;
    const grid: Cell[][] = [];
    
    // Initialize empty grid
    for (let row = 0; row < size; row++) {
      grid[row] = [];
      for (let col = 0; col < size; col++) {
        grid[row][col] = {
          hasWumpus: false,
          hasPit: false,
          hasGold: false,
          hasStench: false,
          hasBreeze: false,
          hasGlitter: false,
          isVisited: false,
          isSafe: false,
          isDangerous: false,
          isBlocked: false
        };
      }
    }

    // Place 1 Wumpus (not at starting position)
    let wumpusPlaced = false;
    while (!wumpusPlaced) {
      const row = Math.floor(Math.random() * size);
      const col = Math.floor(Math.random() * size);
      if (!(row === 9 && col === 0)) {
        grid[row][col].hasWumpus = true;
        wumpusPlaced = true;
      }
    }

    // Place 3-5 pits (not at starting position)
    const numPits = 3 + Math.floor(Math.random() * 3);
    let pitsPlaced = 0;
    while (pitsPlaced < numPits) {
      const row = Math.floor(Math.random() * size);
      const col = Math.floor(Math.random() * size);
      if (!(row === 9 && col === 0) && !grid[row][col].hasWumpus && !grid[row][col].hasPit) {
        grid[row][col].hasPit = true;
        pitsPlaced++;
      }
    }

    // Place 1 gold (not at starting position)
    let goldPlaced = false;
    while (!goldPlaced) {
      const row = Math.floor(Math.random() * size);
      const col = Math.floor(Math.random() * size);
      if (!(row === 9 && col === 0) && !grid[row][col].hasWumpus && !grid[row][col].hasPit) {
        grid[row][col].hasGold = true;
        grid[row][col].hasGlitter = true;
        goldPlaced = true;
      }
    }

    // Add stenches and breezes
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (grid[row][col].hasWumpus) {
          const adjacentCells = [
            { row: row - 1, col },
            { row: row + 1, col },
            { row, col: col - 1 },
            { row, col: col + 1 }
          ];
          
          adjacentCells.forEach(({ row: adjRow, col: adjCol }) => {
            if (adjRow >= 0 && adjRow < size && adjCol >= 0 && adjCol < size) {
              grid[adjRow][adjCol].hasStench = true;
            }
          });
        }
        
        if (grid[row][col].hasPit) {
          const adjacentCells = [
            { row: row - 1, col },
            { row: row + 1, col },
            { row, col: col - 1 },
            { row, col: col + 1 }
          ];
          
          adjacentCells.forEach(({ row: adjRow, col: adjCol }) => {
            if (adjRow >= 0 && adjRow < size && adjCol >= 0 && adjCol < size) {
              grid[adjRow][adjCol].hasBreeze = true;
            }
          });
        }
      }
    }

    // Starting position is safe
    grid[9][0].isSafe = true;
    grid[9][0].isVisited = true;

    return {
      grid,
      size,
      agentPosition: { row: 9, col: 0 },
      agentDirection: Direction.NORTH,
      agentHasGold: false,
      agentHasArrow: true,
      agentAlive: true,
      wumpusAlive: true,
      score: 0,
      gameOver: false,
      gameWon: false
    };
  }
}