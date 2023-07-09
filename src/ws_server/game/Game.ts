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

  public attack = (indexPlayer: number, attack: Position) => {
    console.log(attack);
    const targetPlayer = this.players.find((p) => p.indexPlayer !== indexPlayer);
    if (!targetPlayer) return;

    let isHit = false;
    let isKill = false;
    let isWin = false;

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

      if (!wasKilled && shipKilled) isKill = true;

      return {
        ...ship,
        cells,
        killed: shipKilled,
      };
    });

    if (updatedShips.every((ship) => ship.killed)) isWin = true;
    if (!isKill && !isHit) this.turn = targetPlayer.indexPlayer;

    targetPlayer.updateShips(updatedShips);
    console.log(targetPlayer.ships);

    let status = 'miss';

    if (isKill) {
      status = 'killed';
    } else if (!isKill && isHit) {
      status = 'shot';
    }

    return {
      feedback: {
        position: attack,
        currentPlayer: indexPlayer,
        status,
      },
      turn: this.turn,
    };
  };
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

class Player {
  readonly indexPlayer: number;
  ships: ShipWithCells[];

  constructor({ index }: User) {
    this.indexPlayer = index;
    this.ships = [];
  }

  public getShips = () => {
    return this.ships.map(({ cells, killed, ...ship }) => ({ ...ship }));
  };

  public addShips = (ships: Ship[]) => {
    this.ships = getShipsWithCells(ships);
    console.log(this.ships[0]);
    return this;
  };

  public updateShips = (ships: ShipWithCells[]) => {
    this.ships = ships;
    return this;
  };
}
