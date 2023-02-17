# Fini8

## Interfaces
```Ts
interface User {
    email: string,
    pswd: {
        hash: string,
        salt: string
    },
    emailVerified: boolean,
    validUser: boolean
}

interface HandleDataResponse {
    status: number,
    accepted: boolean,
    userData?: User,
    message?: string
}
```
