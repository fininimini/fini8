import { User } from './user';

export interface HandleDataResponse {
    status: number,
    accepted: boolean,
    userData?: User,
    message?: string
}