import * as vscode from 'vscode'


export function activate({ subscriptions }: vscode.ExtensionContext) {
    const clockItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    clockItem.text = 'YaClock';
    clockItem.show();
    subscriptions.push(clockItem);
}