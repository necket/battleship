import { User } from '../types/users';

enum CreateUserValidationError {
  InvalidFields = 'Invalid Fields',
  NameExist = 'Name already exists',
}

class UserDB {
  private users: User[];

  constructor() {
    this.users = [];
  }

  public createUser = (user: User) => {
    let validionError: CreateUserValidationError | null = null;

    /* USER VALIDATION */
    if (!user.name || !user.password) {
      validionError = CreateUserValidationError.InvalidFields;
    }

    const nameAlreadyExist = this.users.find((u) => u.name === user.name);
    if (nameAlreadyExist) {
      validionError = CreateUserValidationError.NameExist;
    }

    const isError = !!validionError;

    if (!isError) {
      this.users = [...this.users, user];
    }

    return {
      name: user.name,
      index: user.index,
      error: isError,
      errorText: validionError ?? '',
    };
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
