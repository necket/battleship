import { Cell, Position, Ship, ShipWithCells } from '../types/ship';
import { User } from '../types/users';

export interface GameProps {
  gameId: number;
  roomUsers: User[];
}

export class Game {
  readonly gameId: number;
  players: Player[];
  turn: number;

  constructor({ gameId, roomUsers: [firstUser, secondUser] }: GameProps) {
    this.gameId = gameId;
    this.players = [new Player(firstUser), new Player(secondUser)];
    this.turn = firstUser.index;
  }

  public getTurn = () => {
    return {
      currentPlayer: this.turn,
    };
  };

  public addShips = (indexPlayer: number, ships: Ship[]) => {
    const player = this.players.find((p) => p.indexPlayer === indexPlayer);
    if (!player) return this;
    player.addShips(ships);
    return this;
  };

  public gameIsStarted = () => {
    return this.players.every((p) => p.ships.length !== 0);
  };

  public startGame = (indexPlayer: number) => {
    const player = this.players.find((p) => p.indexPlayer === indexPlayer);
    if (!player) return this;

    return {
      ships: player.getShips(),
      currentPlayerIndex: indexPlayer,
    };
  };

  public getTargetPlayer = (indexPlayer: number) => {
    return this.players.find((p) => p.indexPlayer !== indexPlayer);
  };

  public attack = (indexPlayer: number, attack: Position) => {
    const targetPlayer = this.players.find((p) => p.indexPlayer !== indexPlayer);
    if (!targetPlayer) return;

    const isNewShot = targetPlayer.isNewShot(attack);
    if (!isNewShot) return;

    const shots: Position[] = [attack];

    let isHit = false;
    let isKill = false;
    let isWin = false;

    let newlyKilledShip: ShipWithCells | null = null;

    const updatedShips = targetPlayer.ships.map((ship) => {
      const cells = ship.cells.map((cell) => {
        let alreadyKilled = cell.killed;

        if (cell.x === attack.x && cell.y === attack.y) {
          isHit = true;
          alreadyKilled = true;
        }

        return {
          ...cell,
          killed: alreadyKilled,
        };
      });

      const wasKilled = ship.killed;
      const shipKilled = cells.every((cell) => cell.killed);

      if (!wasKilled && shipKilled) {
        isKill = true;
        newlyKilledShip = ship;
      }

      return {
        ...ship,
        cells,
        killed: shipKilled,
      };
    });

    if (updatedShips.every((ship) => ship.killed)) isWin = true;
    if (!isKill && !isHit) this.turn = targetPlayer.indexPlayer;

    targetPlayer.updateShips(updatedShips);

    let status: StatusAttack = 'miss';

    if (isKill) {
      status = 'killed';
    } else if (!isKill && isHit) {
      status = 'shot';
    }

    const sideEffects = getShipKilledSideEffects(indexPlayer, newlyKilledShip);

    if (sideEffects) {
      sideEffects.forEach((effect) => {
        shots.push(effect.position);
      });
    }

    targetPlayer.addShots(shots);

    return {
      feedback: {
        position: attack,
        currentPlayer: indexPlayer,
        status,
      },
      turn: this.turn,
      shipKilledSideEffects: sideEffects,
      winPlayer: isWin ? indexPlayer : null,
    };
  };
}

type StatusAttack = 'miss' | 'killed' | 'shot';

interface Feedback {
  position: Position;
  currentPlayer: number;
  status: StatusAttack;
}

function getShipKilledSideEffects(currentPlayer: number, ship: ShipWithCells | null) {
  if (!ship) return null;
  const killedCells: Cell[] = ship.cells;
  const missedCells: Cell[] = [];
  const isVertical = ship.direction;

  if (isVertical) {
    ship.cells.forEach((cell, index) => {
      const isFirstCell = index === 0;
      const isLastCell = index === ship.cells.length - 1;

      const getYOffsets = () => {
        if (isFirstCell && isLastCell) return [-1, 1];
        else if (isFirstCell) return [-1];
        else if (isLastCell) return [1];
        return [];
      };

      const yOffsets = getYOffsets();
      const xOffsets = [cell.x - 1, cell.x, cell.x + 1];

      yOffsets.forEach((yOffset) => {
        xOffsets.forEach((x) => {
          missedCells.push({ x, y: cell.y + yOffset, killed: false });
        });
      });

      missedCells.push({ ...cell, x: cell.x + 1 }, { ...cell, x: cell.x - 1 });
    });
  } else {
    ship.cells.forEach((cell, index) => {
      const isFirstCell = index === 0;
      const isLastCell = index === ship.cells.length - 1;

      const getXOffsets = () => {
        if (isFirstCell && isLastCell) return [-1, 1];
        else if (isFirstCell) return [-1];
        else if (isLastCell) return [1];
        return [];
      };

      const xOffsets = getXOffsets();
      const yOffsets = [cell.y - 1, cell.y, cell.y + 1];

      xOffsets.forEach((xOffset) => {
        yOffsets.forEach((y) => {
          missedCells.push({ y, x: cell.x + xOffset, killed: false });
        });
      });

      missedCells.push({ ...cell, y: cell.y + 1 }, { ...cell, y: cell.y - 1 });
    });
  }

  const killedFeedbacks: Feedback[] = killedCells.map((cell) => ({
    currentPlayer,
    position: { x: cell.x, y: cell.y },
    status: 'killed',
  }));

  const missedFeedbacks: Feedback[] = missedCells.map((cell) => ({
    currentPlayer,
    position: { x: cell.x, y: cell.y },
    status: 'miss',
  }));

  return [...killedFeedbacks, ...missedFeedbacks];
}

function getShipsWithCells(ships: Ship[]): ShipWithCells[] {
  return ships.map((ship) => {
    const isVertical = ship.direction;

    const cells: Cell[] = Array.from({ length: ship.length }).map((_, index) => {
      if (isVertical) {
        return {
          x: ship.position.x,
          y: ship.position.y + index,
          killed: false,
        };
      }

      return {
        x: ship.position.x + index,
        y: ship.position.y,
        killed: false,
      };
    });

    return {
      ...ship,
      cells,
      killed: false,
    };
  });
}

export class Player {
  readonly indexPlayer: number;
  ships: ShipWithCells[];
  shots: string[];

  constructor({ index }: User) {
    this.indexPlayer = index;
    this.ships = [];
    this.shots = [];
  }

  public getShips = () => {
    return this.ships.map(({ cells, killed, ...ship }) => ({ ...ship }));
  };

  public addShips = (ships: Ship[]) => {
    this.ships = getShipsWithCells(ships);
    return this;
  };

  public addShots = (shots: Position[]) => {
    const stringifiedShots = shots.map((shot) => JSON.stringify(shot));
    this.shots = [...this.shots, ...stringifiedShots];
  };

  public isNewShot = (attack: Position) => {
    return this.shots.indexOf(JSON.stringify(attack)) === -1;
  };

  public updateShips = (ships: ShipWithCells[]) => {
    this.ships = ships;
    return this;
  };
}
