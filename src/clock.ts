import * as vscode from 'vscode';

export class Clock {
    clockItem: vscode.StatusBarItem;
    schedule: number;

    // configs
    expireInSeconds: boolean;
    prefix: string;
    postfix: string;
    hour12: boolean;
    showAmPm: boolean;
    showDate: boolean;
    showDay: boolean;
    showSecond: boolean;
    flash: boolean;
    showSeparator: boolean;

    constructor() {
        const config = vscode.workspace.getConfiguration('yaclock');
        this.prefix = config.get('prefix', '');
        this.postfix = config.get('postfix', '');
        this.hour12 = config.get('hour12', false);
        this.showAmPm = this.hour12 && config.get('showAmPm', false);
        this.showDate = config.get('showDate', false);
        this.showDay = config.get('showDay', false);
        this.showSecond = config.get('showSecond', false);
        this.flash = config.get('flashTimeSeparator', false);
        this.showSeparator = true;
        this.expireInSeconds = this.showSecond || this.flash || false;

        this.clockItem = vscode.window.createStatusBarItem(
            config.get('position', 'right') === 'right'
                ? vscode.StatusBarAlignment.Right
                : vscode.StatusBarAlignment.Left,
            config.get('priority', 10),
        );
        this.clockItem.show();
        this.update = this.update.bind(this);
        this.schedule = setTimeout(this.update, 0);
    }

    dispose() {
        this.clockItem.dispose();
        clearTimeout(this.schedule);
    }

    renderText(time: Date) {
        let options: Intl.DateTimeFormatOptions = {};
        if (this.showDate) {
            options = { day: 'numeric', month: 'short' };
        }
        if (this.showDay) {
            options.weekday = 'short';
        }
        const day = (this.showDate || this.showDay) ? time.toLocaleDateString(undefined, options) + ' ' : '';
        const separator = this.showSeparator ? ':' : ' ';
        if (this.flash) {
            this.showSeparator = !this.showSeparator;
        }
        const hour = this.hour12 ? (time.getHours() + 11) % 12 + 1 : time.getHours();
        const minute = time.getMinutes().toString().padStart(2, '0');
        const second = this.showSecond ? separator + time.getSeconds().toString().padStart(2, '0') : '';
        const ampm = this.showAmPm ? (time.getHours() < 12 ? ' AM' : ' PM') : '';
        this.clockItem.text = `${this.prefix}${day}${hour}${separator}${minute}${second}${ampm}${this.postfix}`;
    }

    renderTooltip(time: Date) {
        this.clockItem.tooltip = time.toLocaleString();
    }

    update() {
        const time = new Date();
        const interval = this.expireInSeconds ? 1000 - time.getMilliseconds() : 60000 - time.getMilliseconds() - time.getSeconds() * 1000;
        this.schedule = setTimeout(this.update, interval);
        this.renderText(time);
        this.renderTooltip(time);
    }
}
