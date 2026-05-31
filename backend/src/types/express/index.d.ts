import { IUser } from '../../common/interfaces/user.interface';

declare global {
  namespace Express {
    interface Request {
      users?: any; // To hold authenticated user object and scopes
    }
  }
}
