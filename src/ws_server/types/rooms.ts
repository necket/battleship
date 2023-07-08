import { User } from './users';

export interface Room {
  roomId: number;
  roomUsers: User[];
}
