/* eslint-disable prefer-const */
import { WorldState, Action, Direction, Position, Perception } from '../types/World';
import { KnowledgeBase } from './KnowledgeBase';

export class GameEngine {
  private world: WorldState;
  private knowledgeBase: KnowledgeBase;
  private actionHistory: Action[] = [];
  private perceptionHistory: Perception[] = [];
  private visitedPositions: Set<string> = new Set();
  private positionHistory: Position[] = [];
  private stuckCounter: number = 0;
  private lastSuggestedAction: Action | null = null;
  private arrowFired: boolean = false;
  private arrowAnimation: { active: boolean; direction: Direction; startPos: Position } = {
    active: false,
    direction: Direction.NORTH,
    startPos: { row: 0, col: 0 }
  };

  constructor(world: WorldState) {
    this.world = { ...world };
    this.knowledgeBase = new KnowledgeBase();
    this.visitedPositions.add(this.positionToString(world.agentPosition));
    this.positionHistory.push({ ...world.agentPosition });
    
    // Initial perception
    const perception = this.getCurrentPerception();
    this.knowledgeBase.addPerception(
      this.world.agentPosition,
      perception.stench,
      perception.breeze,
      perception.glitter
    );
  }

  private positionToString(pos: Position): string {
    return `${pos.row},${pos.col}`;
  }

  executeAction(action: Action): { success: boolean; perception: Perception; message: string } {
    if (this.world.gameOver) {
      return { success: false, perception: this.getCurrentPerception(), message: 'Game is over' };
    }

    this.actionHistory.push(action);
    let message = '';

    switch (action) {
      case Action.TURN_LEFT:
        this.world.agentDirection = (this.world.agentDirection + 3) % 4;
        this.world.score -= 1;
        message = 'Turned left';
        break;

      case Action.TURN_RIGHT:
        this.world.agentDirection = (this.world.agentDirection + 1) % 4;
        this.world.score -= 1;
        message = 'Turned right';
        break;

      case Action.MOVE_FORWARD:
        { const newPosition = this.getNextPosition();
        if (this.isValidPosition(newPosition)) {
          this.world.agentPosition = newPosition;
          this.world.score -= 1;
          
          const currentCell = this.world.grid[newPosition.row][newPosition.col];
          currentCell.isVisited = true;
          
          const posStr = this.positionToString(newPosition);
          this.visitedPositions.add(posStr);
          this.positionHistory.push({ ...newPosition });
          
          if (currentCell.hasWumpus && this.world.wumpusAlive) {
            this.world.agentAlive = false;
            this.world.gameOver = true;
            this.world.score -= 1000;
            message = 'Agent was eaten by Wumpus! Game Over!';
          } else if (currentCell.hasPit) {
            this.world.agentAlive = false;
            this.world.gameOver = true;
            this.world.score -= 1000;
            message = 'Agent fell into a pit! Game Over!';
          } else {
            message = 'Moved forward';
            // Add perception to knowledge base
            const newPerception = this.getCurrentPerception();
            this.knowledgeBase.addPerception(
              newPosition,
              newPerception.stench,
              newPerception.breeze,
              newPerception.glitter
            );
          }
        } else {
          message = 'Cannot move forward - blocked by wall';
        }
        break; }

      case Action.GRAB:
        { const currentCell = this.world.grid[this.world.agentPosition.row][this.world.agentPosition.col];
        if (currentCell.hasGold && !this.world.agentHasGold) {
          this.world.agentHasGold = true;
          currentCell.hasGold = false;
          currentCell.hasGlitter = false;
          message = 'Grabbed gold!';
        } else {
          message = 'Nothing to grab here';
        }
        this.world.score -= 1;
        break; }

      case Action.RELEASE:
        if (this.world.agentHasGold) {
          this.world.agentHasGold = false;
          const currentCell = this.world.grid[this.world.agentPosition.row][this.world.agentPosition.col];
          currentCell.hasGold = true;
          currentCell.hasGlitter = true;
          message = 'Released gold';
        } else {
          message = 'No gold to release';
        }
        this.world.score -= 1;
        break;

      case Action.SHOOT:
        if (this.world.agentHasArrow) {
          this.world.agentHasArrow = false;
          this.world.score -= 10;
          this.arrowFired = true;
          
          // Set arrow animation
          this.arrowAnimation = {
            active: true,
            direction: this.world.agentDirection,
            startPos: { ...this.world.agentPosition }
          };
          
          const targetPosition = this.getTargetPosition();
          if (targetPosition && this.world.grid[targetPosition.row][targetPosition.col].hasWumpus) {
            this.world.wumpusAlive = false;
            this.world.grid[targetPosition.row][targetPosition.col].hasWumpus = false;
            // Remove stenches around dead Wumpus
            this.removeStenchesAroundPosition(targetPosition);
            message = 'Arrow hit! Wumpus is dead! *SCREAM*';
          } else {
            message = 'Arrow missed - it flew into the darkness';
          }
          
          // Clear arrow animation after a delay
          setTimeout(() => {
            this.arrowAnimation.active = false;
          }, 1000);
        } else {
          message = 'No arrow to shoot';
        }
        break;
    }

    const perception = this.getCurrentPerception();
    this.perceptionHistory.push(perception);

    // Check win condition - must be at start position with gold
    if (this.world.agentHasGold && 
        this.world.agentPosition.row === 9 && 
        this.world.agentPosition.col === 0) {
      this.world.gameWon = true;
      this.world.gameOver = true;
      this.world.score += 1000;
      message += ' - You escaped with the gold! Victory!';
    }

    return { success: true, perception, message };
  }

  private getNextPosition(): Position {
    const { row, col } = this.world.agentPosition;
    
    switch (this.world.agentDirection) {
      case Direction.NORTH:
        return { row: row - 1, col };
      case Direction.EAST:
        return { row, col: col + 1 };
      case Direction.SOUTH:
        return { row: row + 1, col };
      case Direction.WEST:
        return { row, col: col - 1 };
      default:
        return { row, col };
    }
  }

  private getTargetPosition(): Position | null {
    const { row, col } = this.world.agentPosition;
    
    // Arrow travels in a straight line until it hits a wall or Wumpus
    switch (this.world.agentDirection) {
      case Direction.NORTH:
        for (let r = row - 1; r >= 0; r--) {
          if (this.world.grid[r][col].hasWumpus) {
            return { row: r, col };
          }
        }
        break;
      case Direction.EAST:
        for (let c = col + 1; c < this.world.size; c++) {
          if (this.world.grid[row][c].hasWumpus) {
            return { row, col: c };
          }
        }
        break;
      case Direction.SOUTH:
        for (let r = row + 1; r < this.world.size; r++) {
          if (this.world.grid[r][col].hasWumpus) {
            return { row: r, col };
          }
        }
        break;
      case Direction.WEST:
        for (let c = col - 1; c >= 0; c--) {
          if (this.world.grid[row][c].hasWumpus) {
            return { row, col: c };
          }
        }
        break;
    }
    
    return null;
  }

  private isValidPosition(position: Position): boolean {
    return position.row >= 0 && position.row < this.world.size &&
           position.col >= 0 && position.col < this.world.size;
  }

  private removeStenchesAroundPosition(position: Position): void {
    const { row, col } = position;
    const adjacentCells = [
      { row: row - 1, col },
      { row: row + 1, col },
      { row, col: col - 1 },
      { row, col: col + 1 }
    ];

    adjacentCells.forEach(({ row: adjRow, col: adjCol }) => {
      if (this.isValidPosition({ row: adjRow, col: adjCol })) {
        // Only remove stench if no other Wumpus is adjacent
        let hasOtherWumpusAdjacent = false;
        const adjacentToAdjacent = [
          { row: adjRow - 1, col: adjCol },
          { row: adjRow + 1, col: adjCol },
          { row: adjRow, col: adjCol - 1 },
          { row: adjRow, col: adjCol + 1 }
        ];

        adjacentToAdjacent.forEach(({ row: r, col: c }) => {
          if (this.isValidPosition({ row: r, col: c }) && 
              this.world.grid[r][c].hasWumpus) {
            hasOtherWumpusAdjacent = true;
          }
        });

        if (!hasOtherWumpusAdjacent) {
          this.world.grid[adjRow][adjCol].hasStench = false;
        }
      }
    });
  }

  getCurrentPerception(): Perception {
    const currentCell = this.world.grid[this.world.agentPosition.row][this.world.agentPosition.col];
    const lastAction = this.actionHistory[this.actionHistory.length - 1];
    
    return {
      stench: currentCell.hasStench,
      breeze: currentCell.hasBreeze,
      glitter: currentCell.hasGlitter,
      bump: lastAction === Action.MOVE_FORWARD && 
            !this.isValidPosition(this.getNextPosition()),
      scream: this.arrowFired && !this.world.wumpusAlive
    };
  }

  getWorldState(): WorldState {
    return { ...this.world };
  }

  getKnowledgeBase(): KnowledgeBase {
    return this.knowledgeBase;
  }

  getActionHistory(): Action[] {
    return [...this.actionHistory];
  }

  getPerceptionHistory(): Perception[] {
    return [...this.perceptionHistory];
  }

  getArrowAnimation() {
    return this.arrowAnimation;
  }

  // Enhanced AI move suggestion with much better logic
  suggestMove(): Action | null {
    if (this.world.gameOver) return null;

    const perception = this.getCurrentPerception();
    const currentPos = this.world.agentPosition;
    
    // Priority 1: If gold is here, grab it
    if (perception.glitter && !this.world.agentHasGold) {
      return Action.GRAB;
    }

    // Priority 2: If we have gold, navigate back to start safely
    if (this.world.agentHasGold) {
        // Remove this check as it causes the game to hang
        // if (currentPos.row === 9 && currentPos.col === 0) {
        //     return null; // Already won
        // }
        return this.navigateToStart();
    }

    // Priority 3: Shoot Wumpus if we can identify its location and have arrow
    if (this.world.agentHasArrow && this.shouldShootWumpus()) {
      return Action.SHOOT;
    }

    // Priority 4: Move to safe unvisited positions using better pathfinding
    const safePositions = this.knowledgeBase.getSafeUnvisitedPositions();
    if (safePositions.length > 0) {
      const target = this.chooseBestTarget(safePositions);
      return this.getActionTowards(target);
    }

    // Priority 5: Explore cautiously with better risk assessment
    const nextPos = this.getNextPosition();
    if (this.isValidPosition(nextPos)) {
      const riskLevel = this.knowledgeBase.getRiskLevel(nextPos);
      
      // Only move if it's safe or probably safe
      if (riskLevel === 'SAFE' || (riskLevel === 'PROBABLY_SAFE' && !this.knowledgeBase.isVisited(nextPos))) {
        return Action.MOVE_FORWARD;
      }
      
      // If current direction is dangerous, try turning
      if (riskLevel === 'DANGEROUS' || riskLevel === 'UNCERTAIN') {
        return this.findSafeDirection();
      }
    }

    // Priority 6: If stuck, try to find any safe direction
    const safeDirection = this.findSafeDirection();
    if (safeDirection) {
      return safeDirection;
    }

    // Priority 7: If completely stuck, backtrack intelligently
    return this.intelligentBacktrack();
  }

  private navigateToStart(): Action {
    const current = this.world.agentPosition;
    
    // If we're at the start position, we're done
    if (current.row === 9 && current.col === 0) {
        return Action.GRAB; // This will trigger win condition
    }

    // Find the last position we were at in our history
    if (this.positionHistory.length > 1) {
        // Remove current position from history to avoid loops
        if (this.positionToString(this.positionHistory[this.positionHistory.length - 1]) === 
            this.positionToString(current)) {
            this.positionHistory.pop();
        }
        
        // Get the last position we were at
        const previousPosition = this.positionHistory[this.positionHistory.length - 1];
        
        // Get direction needed to face previous position
        const rowDiff = previousPosition.row - current.row;
        const colDiff = previousPosition.col - current.col;
        
        let targetDirection: Direction;
        if (rowDiff < 0) targetDirection = Direction.NORTH;
        else if (rowDiff > 0) targetDirection = Direction.SOUTH;
        else if (colDiff < 0) targetDirection = Direction.WEST;
        else targetDirection = Direction.EAST;
        
        // Turn to face the previous position
        if (this.world.agentDirection !== targetDirection) {
            const turnDiff = (targetDirection - this.world.agentDirection + 4) % 4;
            return turnDiff === 1 ? Action.TURN_RIGHT : Action.TURN_LEFT;
        }
        
        // Move towards the previous position
        return Action.MOVE_FORWARD;
    }

    // If we somehow lost our history, use direct navigation
    return Action.TURN_RIGHT;
}

  private shouldShootWumpus(): boolean {
    if (!this.world.agentHasArrow) return false;
    
    // Only shoot if we're trapped with no safe moves
    const safeUnvisitedPositions = this.knowledgeBase.getSafeUnvisitedPositions();
    const safeDirections = [Direction.NORTH, Direction.EAST, Direction.SOUTH, Direction.WEST]
        .filter(dir => {
            const tempDirection = this.world.agentDirection;
            this.world.agentDirection = dir;
            const nextPos = this.getNextPosition();
            this.world.agentDirection = tempDirection;
            
            return this.isValidPosition(nextPos) && 
                   (this.knowledgeBase.isSafe(nextPos) || 
                    !this.knowledgeBase.isDangerous(nextPos));
        });

    // If we have safe moves available, don't shoot
    if (safeUnvisitedPositions.length > 0 || safeDirections.length > 0) {
        return false;
    }

    // Check if there's a Wumpus in line of sight
    const targetPos = this.getTargetPosition();
    if (!targetPos) return false;

    // Verify it's actually a Wumpus
    const riskLevel = this.knowledgeBase.getRiskLevel(targetPos);
    if (riskLevel !== 'DANGEROUS') return false;

    // Additional check: make sure we have logical evidence for Wumpus location
    const hasStenchEvidence = this.getAdjacentPositions(targetPos)
        .some(pos => {
            const posStr = this.positionToString(pos);
            return this.knowledgeBase.isVisited(pos) && 
                   this.world.grid[pos.row][pos.col].hasStench;
        });

    return hasStenchEvidence && this.world.grid[targetPos.row][targetPos.col].hasWumpus;
}

  private chooseBestTarget(positions: Position[]): Position {
    const current = this.world.agentPosition;
    
    // Prioritize positions that are:
    // 1. Closest to current position
    // 2. Not in a corner (to avoid getting trapped)
    // 3. Have multiple safe adjacent cells
    
    let bestTarget = positions[0];
    let bestScore = this.evaluatePosition(bestTarget, current);
    
    positions.forEach(pos => {
      const score = this.evaluatePosition(pos, current);
      if (score > bestScore) {
        bestScore = score;
        bestTarget = pos;
      }
    });
    
    return bestTarget;
  }

  private evaluatePosition(pos: Position, current: Position): number {
    let score = 0;
    
    // Closer is better (negative distance for higher score)
    score -= this.manhattanDistance(current, pos);
    
    // Avoid corners and edges
    if (pos.row > 0 && pos.row < 9 && pos.col > 0 && pos.col < 9) {
      score += 10; // Interior positions are better
    }
    
    // Count safe adjacent positions
    const adjacentPositions = this.getAdjacentPositions(pos);
    const safeAdjacent = adjacentPositions.filter(adjPos => 
      this.knowledgeBase.isSafe(adjPos) || this.knowledgeBase.isVisited(adjPos)
    ).length;
    score += safeAdjacent * 5;
    
    return score;
  }

  private manhattanDistance(pos1: Position, pos2: Position): number {
    return Math.abs(pos1.row - pos2.row) + Math.abs(pos1.col - pos2.col);
  }

  private findSafeDirection(): Action | null {
    const directions = [Direction.NORTH, Direction.EAST, Direction.SOUTH, Direction.WEST];
    const safeDirections: Direction[] = [];
    
    for (const direction of directions) {
      const tempDirection = this.world.agentDirection;
      this.world.agentDirection = direction;
      const nextPos = this.getNextPosition();
      this.world.agentDirection = tempDirection;
      
      if (this.isValidPosition(nextPos)) {
        const riskLevel = this.knowledgeBase.getRiskLevel(nextPos);
        if (riskLevel === 'SAFE' || (riskLevel === 'PROBABLY_SAFE' && !this.knowledgeBase.isVisited(nextPos))) {
          safeDirections.push(direction);
        }
      }
    }
    
    if (safeDirections.length === 0) return null;
    
    // Choose the best safe direction (prefer unvisited areas)
    let bestDirection = safeDirections[0];
    let bestScore = -1;
    
    for (const direction of safeDirections) {
      const tempDirection = this.world.agentDirection;
      this.world.agentDirection = direction;
      const nextPos = this.getNextPosition();
      this.world.agentDirection = tempDirection;
      
      let score = 0;
      if (!this.knowledgeBase.isVisited(nextPos)) score += 10;
      if (this.knowledgeBase.getRiskLevel(nextPos) === 'SAFE') score += 5;
      
      if (score > bestScore) {
        bestScore = score;
        bestDirection = direction;
      }
    }
    
    // Turn to face the best safe direction
    const turnAction = this.getTurnAction(bestDirection);
    if (turnAction) return turnAction;
    return Action.MOVE_FORWARD;
  }

  private getTurnAction(targetDirection: Direction): Action | null {
    const currentDirection = this.world.agentDirection;
    if (currentDirection === targetDirection) return null;
    
    const turnDiff = (targetDirection - currentDirection + 4) % 4;
    return turnDiff === 1 ? Action.TURN_RIGHT : Action.TURN_LEFT;
  }

  private intelligentBacktrack(): Action {
    // Find the most recent safe position that has unexplored safe neighbors
    for (let i = this.positionHistory.length - 2; i >= 0; i--) {
      const pos = this.positionHistory[i];
      if (this.knowledgeBase.isSafe(pos)) {
        const adjacentPositions = this.getAdjacentPositions(pos);
        const hasUnexploredSafe = adjacentPositions.some(adjPos => 
          !this.knowledgeBase.isVisited(adjPos) && 
          (this.knowledgeBase.isSafe(adjPos) || this.knowledgeBase.getRiskLevel(adjPos) === 'PROBABLY_SAFE')
        );
        
        if (hasUnexploredSafe) {
          return this.getActionTowards(pos);
        }
      }
    }
    
    // Last resort: random safe turn
    const safeDirections = [Direction.NORTH, Direction.EAST, Direction.SOUTH, Direction.WEST]
      .filter(dir => {
        const tempDirection = this.world.agentDirection;
        this.world.agentDirection = dir;
        const nextPos = this.getNextPosition();
        this.world.agentDirection = tempDirection;
        
        return this.isValidPosition(nextPos) && !this.knowledgeBase.isDangerous(nextPos);
      });
    
    if (safeDirections.length > 0) {
      const randomDir = safeDirections[Math.floor(Math.random() * safeDirections.length)];
      const turnAction = this.getTurnAction(randomDir);
      return turnAction || Action.MOVE_FORWARD;
    }
    
    return Action.TURN_RIGHT;
  }

  private getActionTowards(target: Position): Action {
    const current = this.world.agentPosition;
    const rowDiff = target.row - current.row;
    const colDiff = target.col - current.col;

    // Determine desired direction
    let desiredDirection: Direction;
    if (Math.abs(rowDiff) > Math.abs(colDiff)) {
      desiredDirection = rowDiff > 0 ? Direction.SOUTH : Direction.NORTH;
    } else {
      desiredDirection = colDiff > 0 ? Direction.EAST : Direction.WEST;
    }

    // Turn towards desired direction
    if (this.world.agentDirection !== desiredDirection) {
      const turnDiff = (desiredDirection - this.world.agentDirection + 4) % 4;
      return turnDiff === 1 ? Action.TURN_RIGHT : Action.TURN_LEFT;
    }

    // Move forward if facing correct direction
    return Action.MOVE_FORWARD;
  }

  private findSafePath(start: Position, goal: Position): Position[] | null {
    // Enhanced A* pathfinding with better heuristics
    const openSet = [start];
    const cameFrom = new Map<string, Position>();
    const gScore = new Map<string, number>();
    const fScore = new Map<string, number>();
    
    gScore.set(this.positionToString(start), 0);
    fScore.set(this.positionToString(start), this.manhattanDistance(start, goal));
    
    while (openSet.length > 0) {
      // Find node with lowest fScore
      let current = openSet[0];
      let currentIndex = 0;
      
      for (let i = 1; i < openSet.length; i++) {
        const currentF = fScore.get(this.positionToString(openSet[i])) || Infinity;
        const bestF = fScore.get(this.positionToString(current)) || Infinity;
        if (currentF < bestF) {
          current = openSet[i];
          currentIndex = i;
        }
      }
      
      if (current.row === goal.row && current.col === goal.col) {
        // Reconstruct path
        const path = [current];
        let temp = current;
        while (cameFrom.has(this.positionToString(temp))) {
          temp = cameFrom.get(this.positionToString(temp))!;
          path.unshift(temp);
        }
        return path;
      }
      
      openSet.splice(currentIndex, 1);
      
      // Check neighbors
      const neighbors = this.getAdjacentPositions(current);
      for (const neighbor of neighbors) {
        if (!this.isValidPosition(neighbor)) continue;
        
        const riskLevel = this.knowledgeBase.getRiskLevel(neighbor);
        if (riskLevel === 'DANGEROUS') continue;
        
        // Prefer visited safe positions for pathfinding
        let moveCost = 1;
        if (riskLevel === 'UNCERTAIN') moveCost = 3;
        if (this.knowledgeBase.isVisited(neighbor)) moveCost = 0.5;
        
        const tentativeGScore = (gScore.get(this.positionToString(current)) || 0) + moveCost;
        const neighborStr = this.positionToString(neighbor);
        
        if (tentativeGScore < (gScore.get(neighborStr) || Infinity)) {
          cameFrom.set(neighborStr, current);
          gScore.set(neighborStr, tentativeGScore);
          fScore.set(neighborStr, tentativeGScore + this.manhattanDistance(neighbor, goal));
          
          if (!openSet.some(pos => pos.row === neighbor.row && pos.col === neighbor.col)) {
            openSet.push(neighbor);
          }
        }
      }
    }
    
    return null; // No safe path found
  }

  private getAdjacentPositions(position: Position): Position[] {
    const { row, col } = position;
    return [
      { row: row - 1, col }, // North
      { row: row + 1, col }, // South
      { row, col: col - 1 }, // West
      { row, col: col + 1 }  // East
    ].filter(pos => this.isValidPosition(pos));
  }
}