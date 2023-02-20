import { Component, Output, EventEmitter } from '@angular/core';
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { HandleDataResponse } from "../handle-data-response";
import { UserDataService } from "../user-data.service";

@Component({
    selector: 'app-verification',
    templateUrl: './verification.component.html',
    styleUrls: ['./verification.component.scss']
})
export class VerificationComponent {
    resendTimeS = 120;
    resendErrTimeS = 10;
    userDataService: UserDataService;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @Output() outputEvent = new EventEmitter<any>();
    constructor(private http: HttpClient, userDataService: UserDataService) {
        this.userDataService = userDataService;
    }
    sendVerificationEmail = (type = "verification") => {
        const resendLink = document.getElementById("resendLink") as HTMLAnchorElement;
        const resendClock = document.getElementById("resendClock") as HTMLSpanElement;
        const resendLoading = document.getElementById("loadingMini") as HTMLDivElement;
        resendLink.style.display = "none";
        resendLoading.style.display = "";
        resendClock.style.color = "#606060";
        this.http.post<HandleDataResponse>(
            "/email",
            {type: "verification", userData: {email: this.userDataService.get().email, pswdHash: this.userDataService.get().pswd.hash}},
            {headers: new HttpHeaders({"Content-Type": "application/json"})}
        ).subscribe((response) => {
            if (response.status === 409) {
                (document.getElementById("emailVerification") as HTMLDivElement).style.display = "none";
                (document.getElementById("container") as HTMLDivElement).style.display = "";
                return;
            }
            let time = type === "verification" ? 0 : response.accepted ? this.resendTimeS : this.resendErrTimeS;
            if (type !== "verification") {
                const minutes = Math.floor(time / 60)
                const seconds = time - minutes * 60
                resendClock.textContent = `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
                resendLoading.style.display = "none";
                resendLink.style.display = "none";
                resendClock.style.display = "";
                if (response.accepted) this.outputEvent.emit({message: "Successfully sent verification email", status: "success"});
                else if (response.status === 503) this.outputEvent.emit({message: "Sorry, an internal service is currently unavailable. Our team is working on a resolution, and it should be back up soon. Please try again later.", status: "error"});
                else this.outputEvent.emit({message: "An unknown error occurred! Please try again later.", status: "error"});
                const timer = setInterval(() => {
                    const minutes = Math.floor(time / 60)
                    const seconds = time - minutes * 60
                    resendClock.textContent = `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
                    if (time === 0) {
                        resendClock.style.display = "none";
                        resendLink.style.display = "";
                        clearInterval(timer);
                    }
                    time--;
                }, 1000);
            } else {
                resendClock.style.display = "none";
                resendLink.style.display = "";
                resendLoading.style.display = "none";
            }
        });
    }
    verificationActivate(): void {
        const email = this.userDataService.get().email;
        (document.getElementById("emailText") as HTMLDivElement).innerText = "We sent the verification email to: " +
            "*".repeat(email.indexOf("@")) + email.substring(email.indexOf("@"));
        (document.getElementById("emailVerification") as HTMLDivElement).style.display = "";
        (document.getElementById("container") as HTMLDivElement).style.display = "none";
        this.sendVerificationEmail();
    }
}
