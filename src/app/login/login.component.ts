import {
    Component
} from "@angular/core";
import {
    validate
} from "email-validator";

@Component({
    selector: "app-login",
    templateUrl: "./login.component.html",
    styleUrls: ["./login.component.sass"]
})

export class LoginComponent {
    pswdRevealed = false;
    revealPassword(event: Event, subID: string): void {
        event.preventDefault();
        const reveal: HTMLImageElement = document.getElementById("revealPasswordImage" + subID) as HTMLImageElement;
        const hide: HTMLImageElement = document.getElementById("hidePasswordImage" + subID) as HTMLImageElement;
        const pswdInput: HTMLInputElement = document.getElementById("passwordInput" + subID) as HTMLInputElement;
        if (!this.pswdRevealed) {
            reveal.style.display = "none";
            hide.style.display = "";
            pswdInput.type = "text";
            this.pswdRevealed = true;
        } else {
            reveal.style.display = "";
            hide.style.display = "none";
            pswdInput.type = "password";
            this.pswdRevealed = false;
        }
    }

    displayMessage(parentName: string, message = "", error = true): void {
        const parent: HTMLInputElement = document.getElementById(parentName) as HTMLInputElement;
        if (error) {
            parent.style.borderColor = "#ff4b4bd8";
        } else {
            parent.style.borderColor = "#00ffaad8";
        }
        //let messageDiv: HTMLDivElement = document.createElement("div");
        //let target = document.getElementById("main")!;
        //messageDiv.innerHTML = message;
        //messageDiv.className = "error_collapsed";
        //messageDiv.style.width = parseInt(getComputedStyle(target).width) - 25 + "px";
        //target.appendChild(messageDiv);
    }

    registerEmail = "";
    emailValid = false;
    checkEmail(email: string) {
        if (email.length == 0) {
            const emailInput: HTMLInputElement = document.getElementById("emailInputRegistration") as HTMLInputElement;
            emailInput.style.borderColor = "#8f8f8f";
            this.emailValid = false;
            this.checkCredentials();
            return;
        }
        if (validate(email)) {
            this.displayMessage("emailInputRegistration", "Please use a valid email address!", false);
            this.emailValid = true;
        } else {
            this.displayMessage("emailInputRegistration");
            this.emailValid = false;
        }
        this.checkCredentials();
    }

    onSubmit(event: Event): void {
        event.preventDefault();
    }

    loginEmail = ''
    checkCredentials(): void {
        const registerBtn: HTMLButtonElement = document.getElementById("register") as HTMLButtonElement;
        const loginBtn: HTMLButtonElement = document.getElementById("login") as HTMLButtonElement;
        if (this.pswdValid && this.emailValid) {
            registerBtn.removeAttribute("disabled");
        } else {
            registerBtn.setAttribute("disabled", "");
        }
        if (this.loginPswd.length > 0 && this.loginEmail.length > 0) {
            loginBtn.removeAttribute("disabled");
        } else {
            loginBtn.setAttribute("disabled", "");
        }
    }

    loginPswd = "";
    registerPswd = "";
    pswdValid = false;
    checkPswd(registerPswd: string): void {
        const pswdInput: HTMLInputElement = document.getElementById("passwordInputRegistration") as HTMLInputElement;
        const criterias: Array < [string, boolean] > = [
            ["#pswd_spaces", registerPswd.includes(" ") == false && registerPswd.length >= 1],
            ["#pswd_min_char", registerPswd.length >= 8],
            ["#pswd_big_char", /[A-Z]/.test(registerPswd)],
            ["#pswd_sml_char", /[a-z]/.test(registerPswd)],
            // eslint-disable-next-line no-useless-escape
            ["#pswd_spc_char", /\d/.test(registerPswd) || /[`!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/.test(registerPswd)]
        ];

        for (const criteria of criterias) {
            const dot: HTMLDivElement = document.querySelector(criteria[0]) as HTMLDivElement;
            if (criteria[1]) {
                dot.style.backgroundColor = "#00ffaad8";
            } else if (registerPswd.length == 0) {
                dot.style.backgroundColor = "#8f8f8f";
            } else {
                dot.style.backgroundColor = "#ff4b4bd8";
            }
        }

        const pswdDiv: HTMLDivElement = document.getElementById("pswd_div") as HTMLDivElement;
        if (criterias.every(criteria => criteria[1] === true)) {
            pswdDiv.style.borderColor = "#00ffaad8";
            pswdInput.style.borderColor = "#00ffaad8";
            this.pswdValid = true;
        } else if (registerPswd.length == 0) {
            pswdDiv.style.borderColor = "#8f8f8f";
            pswdInput.style.borderColor = "#8f8f8f";
            this.pswdValid = false;
        } else {
            pswdDiv.style.borderColor = "#ff4b4bd8"
            pswdInput.style.borderColor = "#ff4b4bd8";
            this.pswdValid = false;
        }
        this.checkCredentials();
    }
}