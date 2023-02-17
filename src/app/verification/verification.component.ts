import { Component, Output, EventEmitter, Inject } from '@angular/core';
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { HandleDataResponse } from "../handle-data-response";
import { User } from "../user";

@Component({
    selector: 'app-verification',
    templateUrl: './verification.component.html',
    styleUrls: ['./verification.component.scss']
})
export class VerificationComponent {
    resendTimeS = 120;
    resendErrTimeS = 10;

    userData: User;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @Output() outputEvent = new EventEmitter<any>();
    constructor(private http: HttpClient, @Inject('userData') userData: User) {
        this.userData = userData;
    }
    sendVerificationEmail(type = "verification"): void {
        this.http.post<HandleDataResponse>(
            "/email",
            {type: "verification", email: this.userData.email},
            {headers: new HttpHeaders({"Content-Type": "application/json"})}
        ).subscribe((response) => {
            let time = type === "verification" ? this.resendErrTimeS : response.accepted ? this.resendTimeS : this.resendErrTimeS;
            const resendClock = document.getElementById("resendClock") as HTMLSpanElement;
            const minutes = Math.floor(time / 60)
            const seconds = time - minutes * 60
            resendClock.textContent = `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`
            resendClock.style.color = "#606060";

            if (response.accepted) {
                const resendLink = document.getElementById("resendLink") as HTMLAnchorElement;
                resendLink.style.display = "none";
                resendClock.style.display = "";
                this.outputEvent.emit({message: "Successfully sent verification email", status: "success"});
            }
            else {
                this.outputEvent.emit({message: "An unknown error occurred! Please try again later.", status: "error"});
            }
            const timer = setInterval(() => {
                resendClock.style.color = "#606060";
                const minutes = Math.floor(time / 60)
                const seconds = time - minutes * 60
                resendClock.textContent = `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
                if (time === 0) {
                    const resendLink = document.getElementById("resendLink") as HTMLAnchorElement;
                    resendClock.style.display = "none";
                    resendLink.style.display = "";
                    clearInterval(timer);
                    resendClock.style.color = "#2ca87f";
                }
                time--;
            }, 1000);
        });
    }
    verificationActivate(): void {
        const container = document.getElementById("container") as HTMLDivElement;
        const verification = document.getElementById("emailVerification") as HTMLDivElement;

        verification.style.display = "";
        container.style.display = "none";
        this.sendVerificationEmail();
    }
}
