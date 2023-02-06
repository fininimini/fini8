import { Component } from "@angular/core";
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { LoadingComponent } from "../loading/loading.component";

@Component({
    selector: "app-login",
    templateUrl: "./login.component.html",
    styleUrls: ["./login.component.sass"]
})


export class LoginComponent {
    pswdRevealed = false;
    loginEmail = ""
    emailMessageRevealed = false;
    registerEmail = "";
    emailValid = false;
    loginPswd = "";
    registerPswd = "";
    pswdValid = false;

    revealPassword(event: Event, subID: string): void {
        event.preventDefault();
        const reveal = document.getElementById("revealPasswordImage" + subID) as HTMLImageElement;
        const hide = document.getElementById("hidePasswordImage" + subID) as HTMLImageElement;
        const pswdInput = document.getElementById("passwordInput" + subID) as HTMLInputElement;
        reveal.style.display = !this.pswdRevealed ? 'none' : '';
        hide.style.display = !this.pswdRevealed ? '' : 'none';
        pswdInput.type = !this.pswdRevealed ? 'text' : 'password';
        this.pswdRevealed = !this.pswdRevealed;
    }
    revealEmailMessage(event: Event | null = null, hide = false, onlyHide = false, set = false, setValue = false): void {
        const revealImg = document.getElementById("revealEmailMessage") as HTMLImageElement;
        const hideImg = document.getElementById("hideEmailMessage") as HTMLImageElement;
        const errorDiv = document.getElementById("emailError") as HTMLDivElement;
        const emailButton = document.getElementById("revealEmail") as HTMLButtonElement;
        if (event != null) {event.preventDefault()}
        emailButton.disabled = hide;
        emailButton.style.display = hide ? 'none' : '';
        if (!onlyHide) {
            const revealState = (set && setValue) || (!set && !this.emailMessageRevealed);
            revealImg.style.display = revealState ? 'none' : '';
            hideImg.style.display = revealState ? '' : 'none';
            this.emailMessageRevealed = revealState;
            errorDiv.style.maxHeight = revealState ? '100px' : '0';
        }
    }
    checkEmail(): void {
        const emailInput = document.getElementById("emailInputRegistration") as HTMLInputElement;
        let valid = false;
        const regex = new RegExp('^[-!#$%&\'*+\\/0-9=?^_\\p{L}{|}~](\\.?[-!#$%&\'*+\\/0-9=?^_\\p{L}`{|}~])*@[\\p{L}0-9](-*\\.?[\\p{L}0-9])*\\.[\\p{L}](-?[\\p{L}0-9])+$', 'u')
        if (this.registerEmail && this.registerEmail.length <= 254 && regex.test(this.registerEmail)) {
            const parts = this.registerEmail.split("@");
            if(parts[0].length <= 64) {
                const domainParts = parts[1].split(".");
                if(!domainParts.some(function(part) {return part.length > 63})) {
                    valid = true;
                }
            }
        }
        if (this.registerEmail.length > 0) {
            this.emailValid = valid;
            emailInput.style.borderColor = valid ? "#00ffaad8" : "#ff4b4bd8";
            this.revealEmailMessage(null, valid, false, true);
        } else {
            this.emailValid = false;
            emailInput.style.borderColor = "#8f8f8f";
            this.revealEmailMessage(null, true, false, true);
        }
        this.checkCredentials();
    }
    constructor(private http: HttpClient) {}
    onSubmit(event: Event, action: string): void {
        const loadingComponent = new LoadingComponent();
        loadingComponent.loadingActivate(event, action);
        const httpOptions = {headers: new HttpHeaders({'Content-Type': 'application/json'})};
        const body = {type: "login", email: this.loginEmail, pswd: this.loginPswd};
        this.http.post('http://127.0.0.1:8080/handle_data', body, httpOptions).subscribe(response => console.log(response));
    }
    checkCredentials(): void {
        const registerBtn = document.getElementById("register") as HTMLButtonElement;
        const loginBtn = document.getElementById("login") as HTMLButtonElement;
        const requirements: Array<[boolean, HTMLButtonElement]> = [
            [(this.pswdValid && this.emailValid), registerBtn],
            [this.loginPswd.length > 0 && this.loginEmail.length > 0, loginBtn]
        ];
        requirements.forEach(([valid, btn]) => btn.disabled = !valid);
    }
    checkPswd(): void {
        const lowerRegex = new RegExp("\\p{Ll}", "u");
        const upperRegex = new RegExp("\\p{Lu}", "u");
        const pswdInputDiv = document.getElementById("passwordInputRegistrationDiv") as HTMLDivElement;
        const pswdInput = document.getElementById("passwordInputRegistration") as HTMLInputElement;
        const criterias: Array<[boolean, number]> = [
            [this.registerPswd.length >= 8, 1],
            [this.registerPswd.length >= 10, 1],
            [upperRegex.test(this.registerPswd), 1],
            [lowerRegex.test(this.registerPswd), 1],
            // eslint-disable-next-line no-useless-escape
            [/[`!@#$%^&*()_+\-=\[\]{};":"\\|,.<>\/?~]/.test(this.registerPswd), 1],
            [/\d/.test(this.registerPswd), 1]
        ];
        const levels: {[name: number]: {color: string, text: string}} = {
            0: {"color": "#ff4b4bd8", "text": "Too Weak"},
            1: {"color": "#ff4b4bd8", "text": "Weak"},
            2: {"color": "#FAA916d8", "text": "Fair"},
            3: {"color": "#00FFAAd8", "text": "Good"},
            4: {"color": "#00FFAAd8", "text": "Excelent"}
        };
        let score = 0;
        criterias.forEach(element => {if(element[0]){score += element[1]}});
        const levelDispaly = (level: number) => {
            pswdInputDiv.style.borderColor = levels[level]["color"];
            (document.getElementById("levelTxt") as HTMLSpanElement).innerHTML = levels[level]["text"]
            const levelElements = [
                document.getElementById("weakLevel") as HTMLDivElement,
                document.getElementById("fairLevel") as HTMLDivElement,
                document.getElementById("goodLevel") as HTMLDivElement,
                document.getElementById("excelentLevel") as HTMLDivElement
            ];
            levelElements.forEach((elem, index) => elem.style.backgroundColor = level >= index + 1 ? levels[level]["color"] : "#8f8f8f");
        }
        if (this.registerPswd.length === 0) {
            this.pswdValid = false;
            if (document.activeElement === pswdInput) {
                levelDispaly(0);
            } else {
                pswdInputDiv.style.borderColor = "#8f8f8f";
            }
        } else if (this.registerPswd.length >= 6) {
            levelDispaly(score >= 4 && score < 5 ? 2 : score >= 5 && score < 6 ? 3 : score === 6 ? 4 : 1);
            this.pswdValid = score >= 4;
        } else {
            levelDispaly(0);
            this.pswdValid = false;
        }
        (document.getElementById("pswd_div") as HTMLDivElement).style.maxHeight = (this.pswdValid || this.registerPswd.length === 0) && document.activeElement !== pswdInput ? "0" : "100px";
        if (this.registerPswd.includes(" ")) {
            (document.getElementById("pswdError") as HTMLDivElement).style.maxHeight = "100px";
            pswdInputDiv.style.borderColor = "#ff4b4bd8";
            this.pswdValid = false;
        } else {
            (document.getElementById("pswdError") as HTMLDivElement).style.maxHeight = "0";
        }
        this.checkCredentials();
    }
}