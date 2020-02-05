import * as vscode from 'vscode';

interface Renderer {
    renderText(time: Date): string;
    renderTooltip(time: Date): string;
    expireInSeconds: boolean;
}

// returns the render, as well as a flag indicating if it needs to be called on every second
function rendererGen(): Renderer {
    const config = vscode.workspace.getConfiguration('yaclock');
    const prefix = config.get<string>('prefix');
    const postfix = config.get<string>('postfix');
    const hour12 = config.get<boolean>('hour12');
    const showAmPm = hour12 && config.get<boolean>('showAmPm');
    const showDate = config.get<boolean>('showDate');
    const showDay = config.get<boolean>('showDay');
    const showSecond = config.get<boolean>('showSecond');
    const flash = config.get<boolean>('flashTimeSeparator');
    let showSeparator = true;

    return {
        renderText(time: Date) {
            let options: Intl.DateTimeFormatOptions = {};
            if (showDate) {
                options = { day: 'numeric', month: 'short' };
            }
            if (showDay) {
                options.weekday = 'short';
            }
            const day = (showDate || showDay) ? time.toLocaleDateString(undefined, options) + ' ' : '';

            const separator = showSeparator ? ':' : ' ';
            if (flash) {
                showSeparator = !showSeparator;
            }

            const hour = hour12 ? (time.getHours() + 11) % 12 + 1 : time.getHours();
            const minute = time.getMinutes().toString().padStart(2, '0');

            const second = showSecond ? separator + time.getSeconds().toString().padStart(2, '0') : '';

            const ampm = showAmPm ? (time.getHours() < 12 ? ' AM' : ' PM') : '';

            return `${prefix}${day}${hour}${separator}${minute}${second}${ampm}${postfix}`
        },

        renderTooltip(time: Date) {
            return time.toLocaleString();
        },

        expireInSeconds: showSecond || flash || false,
    };
}

function createClock(): vscode.StatusBarItem {
    const config = vscode.workspace.getConfiguration('yaclock');
    return vscode.window.createStatusBarItem(
        config.get<string>('position') === 'left' ? vscode.StatusBarAlignment.Left : vscode.StatusBarAlignment.Right,
        config.get<number>('priority'));
}

export function activate(context: vscode.ExtensionContext) {
    let clockItem: vscode.StatusBarItem;
    let renderer: Renderer;
    let schedule: number;

    let subscriptions = context.subscriptions

    const update = () => {
        const time = new Date();
        const interval = renderer.expireInSeconds ? 1000 - time.getMilliseconds() : 60000 - time.getMilliseconds() - time.getSeconds() * 1000;
        schedule = setTimeout(update, interval);

        clockItem.text = renderer.renderText(time);
        clockItem.tooltip = renderer.renderTooltip(time);
    }

    const setup = () => {
        clockItem = createClock();
        renderer = rendererGen();
        subscriptions.push(clockItem);
        clockItem.show();
    };

    const cleanup = () => {
        clockItem.dispose();
        clearTimeout(schedule);
    }

    setup();
    update();

    vscode.workspace.onDidChangeConfiguration(e => {
        if (!e.affectsConfiguration('yaclock')) {
            return;
        }
        cleanup();
        setup();
        update();
    });
}