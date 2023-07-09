import { Winner } from '../types/rooms';
import { userDB } from './users.db';

class WinnersDB {
  private winners: Winner[];

  constructor() {
    this.winners = [];
  }

  public updateWinners = (playerId: number) => {
    const user = userDB.getUser(playerId);
    if (!user) return;

    const existingWinner = this.winners.find((winner) => winner.playerId === playerId);
    if (existingWinner) {
      this.winners = [...this.winners].map((winner) =>
        winner.playerId === playerId ? { ...winner, wins: winner.wins + 1 } : winner
      );
    } else {
      this.winners = [...this.winners, { playerId, name: user.name, wins: 1 }];
    }

    return this.winners.map(({ name, wins }) => ({ name, wins }));
  };
}

export const winnersDB = new WinnersDB();
