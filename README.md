# Fini8
This is a website i (fininimini) am building in my free time using angular and express.js

## To be fixed
- When notifications are being displayed too fast, some aren't getting removed

## Interfaces
```Ts
interface User {
    email: string,
    pswd: {
        hash: string,
        salt: string
    },
    emailVerified: boolean
}

interface HandleDataResponse {
    status: number,
    accepted: boolean,
    userData?: User,
    message?: string
    email?: string
}
```
