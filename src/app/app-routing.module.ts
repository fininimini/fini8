import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { VerifyComponent } from './verify/verify.component';

const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'verify', component: VerifyComponent },
    { path: '404', component: NotFoundComponent },
    { path: '**', redirectTo: 'login' }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }