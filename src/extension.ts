import * as vscode from 'vscode'

// returns the render, as well as a flag indicating if it needs to be called on every second
function rendererGen() : [(time: Date) => string, boolean] {
    const config = vscode.workspace.getConfiguration('yaclock');
    const prefix = config.get<string>('prefix');
    const postfix = config.get<string>('postfix');
    const hour12 = config.get<boolean>('hour12');
    const showAmPm = hour12 && config.get<boolean>('ampm');
    const showDate = config.get<boolean>('showDate');
    const showDay = config.get<boolean>('showDay');
    const showSecond = config.get<boolean>('showSecond');
    const flash = config.get<boolean>('flash');
    let showSeparator = true;

    return [
        (time: Date) => {
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
        showSecond || flash || false,
    ];
}

function createClock(): vscode.StatusBarItem {
    const config = vscode.workspace.getConfiguration('yaclock');
    return vscode.window.createStatusBarItem(
        config.get<string>('position') === 'left' ? vscode.StatusBarAlignment.Left : vscode.StatusBarAlignment.Right,
        config.get<number>('priority'));
}

export function activate({ subscriptions }: vscode.ExtensionContext) {
    let clockItem: vscode.StatusBarItem;
    let renderer: (time: Date) => string;
    let refreshInSeconds: boolean;
    let schedule: number;

    const update = () => {
        const time = new Date();
        const interval = refreshInSeconds ? 1000 - time.getMilliseconds() : 60000 - time.getMilliseconds() - time.getSeconds() * 1000;
        schedule = setTimeout(update, interval);

        clockItem.text = renderer(time);
    }

    const setup = () => {
        clockItem = createClock();
        [ renderer, refreshInSeconds ] = rendererGen();
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