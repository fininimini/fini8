import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';

@Component({
    selector: 'app-notification',
    templateUrl: './notification.component.html',
    styleUrls: ['./notification.component.scss']
})
export class NotificationComponent implements OnInit {
    @Input() notification!: {message: string, id: string, type: string};
    @Output() removeNotification = new EventEmitter<string>();
    message = ""
    id = ""
    ngOnInit(): void {
        this.message = this.notification.message
        this.id = this.notification.id
        setTimeout(() => {
            const notification = document.getElementById(this.id) as HTMLDivElement;
            notification.style.borderLeftColor = ((): string => {
                if (this.notification.type === 'success') {
                    return "#00FFAAd8"
                } else if (this.notification.type === 'error') {
                    return "#ff4b4bd8"
                } else {
                    return "#8f8f8f"
                }
            })();
        }, 50)
    }
    close(): void {this.removeNotification.emit(this.id)}
}