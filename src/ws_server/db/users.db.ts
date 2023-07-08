import { User } from '../types/users';

class UserDB {
  private users: User[];

  constructor() {
    this.users = [];
  }

  public createUser = (user: User) => {
    this.users = [...this.users, user];
    return user;
  };

  public deleteUser = (index: number) => {
    this.users = this.users.filter((user) => user.index !== index);
  };

  public getUser = (index: number) => {
    return this.users.find((user) => user.index === index);
  };

  public getAllUsers = () => {
    return this.users;
  };
}

export const userDB = new UserDB();
