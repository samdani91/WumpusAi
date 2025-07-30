/* eslint-disable @typescript-eslint/no-unused-vars */
import { Position, LogicalStatement, KnowledgeBase as KB, Cell } from '../types/World';

export class KnowledgeBase {
  private statements: LogicalStatement[] = [];
  private inferences: string[] = [];
  private safePositions: Set<string> = new Set();
  private dangerousPositions: Set<string> = new Set();
  private visitedPositions: Set<string> = new Set();
  private probablySafePositions: Set<string> = new Set();
  private uncertainPositions: Set<string> = new Set();

  private positionToString(pos: Position): string {
    return `${pos.row},${pos.col}`;
  }

  private stringToPosition(str: string): Position {
    const [row, col] = str.split(',').map(Number);
    return { row, col };
  }

  addStatement(statement: LogicalStatement): void {
    // Avoid duplicate statements
    const exists = this.statements.some(s => 
      s.type === statement.type && 
      s.position.row === statement.position.row && 
      s.position.col === statement.position.col &&
      s.value === statement.value
    );
    
    if (!exists) {
      this.statements.push(statement);
      this.updateInferences();
    }
  }

  addPerception(position: Position, stench: boolean, breeze: boolean, glitter: boolean): void {
    const posStr = this.positionToString(position);
    this.visitedPositions.add(posStr);
    this.safePositions.add(posStr);
    
    // Add perception statements
    this.addStatement({
      type: 'STENCH',
      position,
      value: stench
    });
    
    this.addStatement({
      type: 'BREEZE',
      position,
      value: breeze
    });

    this.addStatement({
      type: 'VISITED',
      position,
      value: true
    });

    this.addStatement({
      type: 'SAFE',
      position,
      value: true
    });

    // If no stench and no breeze, mark adjacent cells as probably safe
    if (!stench && !breeze) {
      const adjacentPositions = this.getAdjacentPositions(position);
      adjacentPositions.forEach(pos => {
        const posStr = this.positionToString(pos);
        if (!this.visitedPositions.has(posStr) && !this.dangerousPositions.has(posStr)) {
          this.probablySafePositions.add(posStr);
        }
      });
    }
  }

  private updateInferences(): void {
    // Clear previous inferences for this update
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const previousInferenceCount = this.inferences.length;
    
    // Rule 1: If no stench, adjacent cells don't have Wumpus
    this.inferFromNoStench();
    
    // Rule 2: If no breeze, adjacent cells don't have pits
    this.inferFromNoBreeze();
    
    // Rule 3: Advanced logical inference for Wumpus location
    this.inferWumpusLocationAdvanced();
    
    // Rule 4: Advanced logical inference for pit locations
    this.inferPitLocationsAdvanced();
    
    // Rule 5: Mark cells as safe if they have no Wumpus and no pit
    this.inferSafeCells();
    
    // Rule 6: Use constraint satisfaction for better inference
    this.constraintSatisfactionInference();
    
    // Rule 7: Probabilistic reasoning for uncertain cells
    this.probabilisticReasoning();
  }

  private inferFromNoStench(): void {
    this.statements.forEach(statement => {
      if (statement.type === 'STENCH' && !statement.value) {
        const adjacentPositions = this.getAdjacentPositions(statement.position);
        adjacentPositions.forEach(pos => {
          this.addStatement({
            type: 'WUMPUS',
            position: pos,
            value: false
          });
        });
        this.inferences.push(`No Wumpus in cells adjacent to (${statement.position.row},${statement.position.col}) - no stench`);
      }
    });
  }

  private inferFromNoBreeze(): void {
    this.statements.forEach(statement => {
      if (statement.type === 'BREEZE' && !statement.value) {
        const adjacentPositions = this.getAdjacentPositions(statement.position);
        adjacentPositions.forEach(pos => {
          this.addStatement({
            type: 'PIT',
            position: pos,
            value: false
          });
        });
        this.inferences.push(`No pits in cells adjacent to (${statement.position.row},${statement.position.col}) - no breeze`);
      }
    });
  }

  private inferWumpusLocationAdvanced(): void {
    const stenchCells = this.statements.filter(s => s.type === 'STENCH' && s.value);
    
    if (stenchCells.length >= 2) {
      // Find intersection of possible Wumpus positions
      const possibleWumpusPositions = new Map<string, number>();
      
      stenchCells.forEach(stenchStatement => {
        const adjacentPositions = this.getAdjacentPositions(stenchStatement.position);
        adjacentPositions.forEach(pos => {
          const hasNoWumpus = this.statements.find(s => 
            s.type === 'WUMPUS' && 
            s.position.row === pos.row && 
            s.position.col === pos.col &&
            s.value === false
          );
          
          if (!hasNoWumpus) {
            const posStr = this.positionToString(pos);
            possibleWumpusPositions.set(posStr, (possibleWumpusPositions.get(posStr) || 0) + 1);
          }
        });
      });

      // If a position is adjacent to all stench cells, it likely has the Wumpus
      possibleWumpusPositions.forEach((count, posStr) => {
        if (count >= 2) {
          const pos = this.stringToPosition(posStr);
          this.addStatement({
            type: 'WUMPUS',
            position: pos,
            value: true
          });
          this.dangerousPositions.add(posStr);
          this.inferences.push(`Wumpus likely at (${pos.row},${pos.col}) - multiple stench sources`);
        }
      });
    }

    // Single stench cell with only one possible adjacent position
    stenchCells.forEach(stenchStatement => {
      const adjacentPositions = this.getAdjacentPositions(stenchStatement.position);
      const possibleWumpusPositions = adjacentPositions.filter(pos => {
        const hasNoWumpus = this.statements.find(s => 
          s.type === 'WUMPUS' && 
          s.position.row === pos.row && 
          s.position.col === pos.col &&
          s.value === false
        );
        return !hasNoWumpus && !this.visitedPositions.has(this.positionToString(pos));
      });

      if (possibleWumpusPositions.length === 1) {
        const wumpusPos = possibleWumpusPositions[0];
        this.addStatement({
          type: 'WUMPUS',
          position: wumpusPos,
          value: true
        });
        this.dangerousPositions.add(this.positionToString(wumpusPos));
        this.inferences.push(`Wumpus located at (${wumpusPos.row},${wumpusPos.col}) - only possible position`);
      }
    });
  }

  private inferPitLocationsAdvanced(): void {
    const breezeCells = this.statements.filter(s => s.type === 'BREEZE' && s.value);
    
    // Advanced pit inference using multiple breeze sources
    if (breezeCells.length >= 2) {
      const possiblePitPositions = new Map<string, number>();
      
      breezeCells.forEach(breezeStatement => {
        const adjacentPositions = this.getAdjacentPositions(breezeStatement.position);
        adjacentPositions.forEach(pos => {
          const hasNoPit = this.statements.find(s => 
            s.type === 'PIT' && 
            s.position.row === pos.row && 
            s.position.col === pos.col &&
            s.value === false
          );
          
          if (!hasNoPit && !this.visitedPositions.has(this.positionToString(pos))) {
            const posStr = this.positionToString(pos);
            possiblePitPositions.set(posStr, (possiblePitPositions.get(posStr) || 0) + 1);
          }
        });
      });

      // Mark positions with high probability as dangerous
      possiblePitPositions.forEach((count, posStr) => {
        if (count >= 2) {
          const pos = this.stringToPosition(posStr);
          this.addStatement({
            type: 'PIT',
            position: pos,
            value: true
          });
          this.dangerousPositions.add(posStr);
          this.inferences.push(`Pit likely at (${pos.row},${pos.col}) - multiple breeze sources`);
        }
      });
    }

    // Single breeze cell inference
    breezeCells.forEach(breezeStatement => {
      const adjacentPositions = this.getAdjacentPositions(breezeStatement.position);
      const possiblePitPositions = adjacentPositions.filter(pos => {
        const hasNoPit = this.statements.find(s => 
          s.type === 'PIT' && 
          s.position.row === pos.row && 
          s.position.col === pos.col &&
          s.value === false
        );
        return !hasNoPit && !this.visitedPositions.has(this.positionToString(pos));
      });

      if (possiblePitPositions.length === 1) {
        const pitPos = possiblePitPositions[0];
        this.addStatement({
          type: 'PIT',
          position: pitPos,
          value: true
        });
        this.dangerousPositions.add(this.positionToString(pitPos));
        this.inferences.push(`Pit located at (${pitPos.row},${pitPos.col}) - only possible position`);
      }
    });
  }

  private inferSafeCells(): void {
    // Mark cells as safe if they have no Wumpus and no pit
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        const pos = { row, col };
        const posStr = this.positionToString(pos);
        
        if (!this.visitedPositions.has(posStr) && !this.dangerousPositions.has(posStr)) {
          const hasNoWumpus = this.statements.find(s => 
            s.type === 'WUMPUS' && 
            s.position.row === row && 
            s.position.col === col &&
            s.value === false
          );
          
          const hasNoPit = this.statements.find(s => 
            s.type === 'PIT' && 
            s.position.row === row && 
            s.position.col === col &&
            s.value === false
          );
          
          if (hasNoWumpus && hasNoPit) {
            this.safePositions.add(posStr);
            this.addStatement({
              type: 'SAFE',
              position: pos,
              value: true
            });
          }
        }
      }
    }
  }

  private constraintSatisfactionInference(): void {
    // Use constraint satisfaction to eliminate impossible configurations
    const stenchCells = this.statements.filter(s => s.type === 'STENCH' && s.value);
    const breezeCells = this.statements.filter(s => s.type === 'BREEZE' && s.value);
    
    // For each stench, ensure at least one adjacent cell has Wumpus
    stenchCells.forEach(stenchStatement => {
      const adjacentPositions = this.getAdjacentPositions(stenchStatement.position);
      const confirmedWumpusAdjacent = adjacentPositions.some(pos => {
        return this.statements.some(s => 
          s.type === 'WUMPUS' && 
          s.position.row === pos.row && 
          s.position.col === pos.col &&
          s.value === true
        );
      });
      
      if (!confirmedWumpusAdjacent) {
        // Mark remaining unvisited adjacent cells as uncertain
        adjacentPositions.forEach(pos => {
          const posStr = this.positionToString(pos);
          if (!this.visitedPositions.has(posStr) && !this.dangerousPositions.has(posStr)) {
            this.uncertainPositions.add(posStr);
          }
        });
      }
    });
  }

  private probabilisticReasoning(): void {
    // Assign probability scores to uncertain positions
    this.uncertainPositions.forEach(posStr => {
      const pos = this.stringToPosition(posStr);
      let dangerScore = 0;
      
      // Check how many stench/breeze sources point to this position
      const adjacentToStench = this.getAdjacentPositions(pos).some(adjPos => {
        return this.statements.some(s => 
          s.type === 'STENCH' && 
          s.position.row === adjPos.row && 
          s.position.col === adjPos.col &&
          s.value === true
        );
      });
      
      const adjacentToBreeze = this.getAdjacentPositions(pos).some(adjPos => {
        return this.statements.some(s => 
          s.type === 'BREEZE' && 
          s.position.row === adjPos.row && 
          s.position.col === adjPos.col &&
          s.value === true
        );
      });
      
      if (adjacentToStench) dangerScore += 50;
      if (adjacentToBreeze) dangerScore += 50;
      
      // If danger score is high, mark as dangerous
      if (dangerScore >= 50) {
        this.dangerousPositions.add(posStr);
      }
    });
  }

  private getAdjacentPositions(position: Position): Position[] {
    const { row, col } = position;
    const adjacent: Position[] = [];
    
    const directions = [
      { row: row - 1, col }, // North
      { row: row + 1, col }, // South
      { row, col: col - 1 }, // West
      { row, col: col + 1 }  // East
    ];

    directions.forEach(pos => {
      if (pos.row >= 0 && pos.row < 10 && pos.col >= 0 && pos.col < 10) {
        adjacent.push(pos);
      }
    });

    return adjacent;
  }

  getSafeUnvisitedPositions(): Position[] {
    const safePositions: Position[] = [];
    
    this.safePositions.forEach(posStr => {
      if (!this.visitedPositions.has(posStr)) {
        safePositions.push(this.stringToPosition(posStr));
      }
    });

    // Also include probably safe positions if no confirmed safe positions
    if (safePositions.length === 0) {
      this.probablySafePositions.forEach(posStr => {
        if (!this.visitedPositions.has(posStr) && !this.dangerousPositions.has(posStr)) {
          safePositions.push(this.stringToPosition(posStr));
        }
      });
    }

    return safePositions;
  }

  isSafe(position: Position): boolean {
    const posStr = this.positionToString(position);
    return this.safePositions.has(posStr) || this.probablySafePositions.has(posStr);
  }

  isDangerous(position: Position): boolean {
    const posStr = this.positionToString(position);
    return this.dangerousPositions.has(posStr);
  }

  isVisited(position: Position): boolean {
    const posStr = this.positionToString(position);
    return this.visitedPositions.has(posStr);
  }

  isUncertain(position: Position): boolean {
    const posStr = this.positionToString(position);
    return this.uncertainPositions.has(posStr);
  }

  getKnowledgeBase(): {
    statements: LogicalStatement[];
    inferences: string[];
    safePositions: Set<string>;
    dangerousPositions: Set<string>;
    visitedPositions: Set<string>;
  } {
    return {
      statements: [...this.statements],
      inferences: [...this.inferences],
      safePositions: new Set(this.safePositions),
      dangerousPositions: new Set(this.dangerousPositions),
      visitedPositions: new Set(this.visitedPositions)
    };
  }

  getRecentInferences(count: number = 5): string[] {
    return this.inferences.slice(-count);
  }

  clearInferences(): void {
    this.inferences = [];
  }

  // Get risk assessment for a position
  getRiskLevel(position: Position): 'SAFE' | 'PROBABLY_SAFE' | 'UNCERTAIN' | 'DANGEROUS' {
    const posStr = this.positionToString(position);
    
    if (this.dangerousPositions.has(posStr)) return 'DANGEROUS';
    if (this.safePositions.has(posStr)) return 'SAFE';
    if (this.probablySafePositions.has(posStr)) return 'PROBABLY_SAFE';
    if (this.uncertainPositions.has(posStr)) return 'UNCERTAIN';
    
    return 'UNCERTAIN';
  }
}