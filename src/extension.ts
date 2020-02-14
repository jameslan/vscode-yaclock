import * as vscode from 'vscode';
import { Clock } from './clock';

export function activate(context: vscode.ExtensionContext) {
    let clock: Clock;

    let subscriptions = context.subscriptions

    clock = new Clock();
    subscriptions.push(clock);

    vscode.workspace.onDidChangeConfiguration(e => {
        if (!e.affectsConfiguration('yaclock')) {
            return;
        }
        clock.dispose();
        clock = new Clock();
        subscriptions.push(clock);
    });
}