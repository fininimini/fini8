import { Component } from "@angular/core";
import { validate } from "email-validator";
import { LoadingComponent } from "../loading/loading.component";

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

    registerEmail = "";
    emailValid = false;
    checkEmail(email: string, hover = false): void {
        const emailInput: HTMLInputElement = document.getElementById("emailInputRegistration") as HTMLInputElement;
        const errorDiv: HTMLDivElement = document.getElementById("emailError") as HTMLDivElement;
        const valid: boolean = validate(email);

        if (errorDiv != null && !valid) {
            if (document.activeElement == emailInput || hover) {
                errorDiv.style.maxHeight = "100px";
            } else {
                errorDiv.style.maxHeight = "0";
            }
        } else {
            const errorDiv: HTMLDivElement = document.getElementById("emailError") as HTMLDivElement;

            if (email.length == 0) {
                emailInput.style.borderColor = "#8f8f8f";
                if (errorDiv != null) {
                    errorDiv.style.maxHeight = "0";
                    setTimeout(function() {errorDiv.remove()}, 600);
                }
                this.emailValid = false;
            } else if (valid) {
                emailInput.style.borderColor = "#00ffaad8";
                if (errorDiv != null) {
                    errorDiv.style.maxHeight = "0";
                    setTimeout(function() {errorDiv.remove()}, 600);
                    this.emailValid = true;
                }
            } else {
                emailInput.style.borderColor = "#ff4b4bd8";
                if (email.length >= 6) {
                    const parrentDiv: HTMLDivElement = document.getElementById("emailDiv") as HTMLDivElement;
                    let errorDiv: HTMLDivElement = document.createElement("div") as HTMLDivElement;

                    errorDiv.id = "emailError";
                    errorDiv.innerHTML = '<div style="padding: 3px 0 3px 0;">Please enter a valid email address following this format: name@domain-name.domain</div>';
                    errorDiv.setAttribute("style", `transition: max-height 0.5s ease-out; border-left: #ff4b4bd8 3px solid; background-color: #ff4b4b11; box-sizing: border-box; padding-left: 10px; position: relative; overflow: hidden; margin-left: 3px; color: #ff4b4b; max-height: 0; bottom: 15px; width: ${parseInt(getComputedStyle(parrentDiv).width) - 3}px;`);
                    parrentDiv.appendChild(errorDiv);
                    errorDiv = document.getElementById("emailError") as HTMLDivElement;
                    setTimeout(function() {errorDiv.style.maxHeight = "100px";}, 10);
                }
                this.emailValid = false;
            }
        }
        this.checkCredentials();
    }

    onSubmit(event: Event): void {
        const loadingComponent = new LoadingComponent();
        loadingComponent.loadingActivate(event);
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