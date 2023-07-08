import { Position, Ship, ShipWithCells } from '../types/ship';
import { User } from '../types/users';

export interface GameProps {
  gameId: number;
  roomUsers: User[];
}

export class Game {
  readonly gameId: number;
  players: Player[];

  constructor({ gameId, roomUsers: [firstUser, secondUser] }: GameProps) {
    this.gameId = gameId;
    this.players = [new Player(firstUser), new Player(secondUser)];
  }

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
}

function getShipsWithCells(ships: Ship[]): ShipWithCells[] {
  return ships.map((ship) => {
    const isVertical = ship.direction;

    const cells: Position[] = Array.from({ length: ship.length }).map((_, index) => {
      return {
        x: isVertical ? ship.position.x : ship.position.x + index,
        y: isVertical ? ship.position.y - index : ship.position.y,
      };
    });

    console.log('SHIP', ship);
    console.log('CELLs', cells);

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
    return this;
  };
}
