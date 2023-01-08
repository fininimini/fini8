import {
    Component
} from '@angular/core';

@Component({
    selector: 'app-loading',
    templateUrl: './loading.component.html',
    styleUrls: ['./loading.component.sass']
})
export class LoadingComponent {
    loadingActivate(event: Event): void {
        const container: HTMLDivElement = document.getElementById("container") as HTMLDivElement;
        const containerStyle: CSSStyleDeclaration = getComputedStyle(container) as CSSStyleDeclaration;
        const loading: HTMLDivElement = document.getElementById("loading") as HTMLDivElement;
        const loadingParrent: HTMLDivElement = document.getElementById("loading_outer") as HTMLDivElement;
        const containerHeight: number = parseInt(containerStyle.height.replace('px', ''));
        const containerWidth: number = parseInt(containerStyle.width.replace('px', ''));
        const size: number = (containerWidth < containerHeight) ? containerWidth : containerHeight;

        event.preventDefault();

        loading.style.width = size * 0.4 + 'px';
        loading.style.height = size * 0.4 + 'px';

        loadingParrent.style.display = "";
        container.style.display = "none";
    }
}