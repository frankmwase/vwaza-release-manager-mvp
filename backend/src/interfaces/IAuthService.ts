import { IRegisterBody, ILoginBody } from '../types/requests';

export interface IAuthService {
    register(body: IRegisterBody): Promise<{ token: string; user: any }>;
    login(body: ILoginBody): Promise<{ token: string; user: any }>;
}
