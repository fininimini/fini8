import { Injectable } from '@angular/core';
import { User } from './user';

@Injectable({
    providedIn: 'root'
})
export class UserDataService {
    private userData!: User

    set(newData: User): User {
        this.userData = newData;
        return this.userData;
    }

    get(): User {
        return this.userData;
    }
}
