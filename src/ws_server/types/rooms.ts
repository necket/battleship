import { Game } from '../game/Game';
import { User } from './users';

export interface Room {
  roomId: number;
  roomUsers: User[];
  game: Game | null;
}
