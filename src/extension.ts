'use strict';
import * as vscode from 'vscode';
import { commands, TextEditor, TextEditorEdit, Uri, ViewColumn } from 'vscode';
import * as path from 'path';
import * as fs from 'fs';


const KEEP_ACTIVE = 0;
const KEEP_INACTIVE = 1;
const KEEP_LEFT = 2;
const KEEP_RIGHT = 3;


export function activate(context: vscode.ExtensionContext) {

  let windowSplitter = new WindowSplitter();

  let useSecondColumn = vscode.commands.registerTextEditorCommand('extension.useSecondColumn', (editor: TextEditor, edit: TextEditorEdit) => {
    windowSplitter.useSecondColumn(editor, edit);
  });

  let removeSecondColumnKeepActive = vscode.commands.registerTextEditorCommand('extension.removeSecondColumnKeepActive',
    (editor: TextEditor, edit: TextEditorEdit) => {
      windowSplitter.removeSecondColumn(KEEP_ACTIVE, editor, edit);
    }
  );

  let removeSecondColumnKeepInactive = vscode.commands.registerTextEditorCommand('extension.removeSecondColumnKeepInactive',
    (editor: TextEditor, edit: TextEditorEdit) => {
      windowSplitter.removeSecondColumn(KEEP_INACTIVE, editor, edit);
    }
  );

  let removeSecondColumnKeepLeft = vscode.commands.registerTextEditorCommand('extension.removeSecondColumnKeepLeft',
    (editor: TextEditor, edit: TextEditorEdit) => {
      windowSplitter.removeSecondColumn(KEEP_LEFT, editor, edit);
    }
  );

  let removeSecondColumnKeepRight = vscode.commands.registerTextEditorCommand('extension.removeSecondColumnKeepRight',
    (editor: TextEditor, edit: TextEditorEdit) => {
      windowSplitter.removeSecondColumn(KEEP_RIGHT, editor, edit);
    }
  );

  let showInOtherColumn = vscode.commands.registerTextEditorCommand('extension.showInOtherColumn',
    (editor: TextEditor, edit: TextEditorEdit) => {
      windowSplitter.showInOtherColumn(editor, edit);
    }
  );

  context.subscriptions.push(useSecondColumn);
  context.subscriptions.push(removeSecondColumnKeepActive);
  context.subscriptions.push(removeSecondColumnKeepInactive);
  context.subscriptions.push(removeSecondColumnKeepLeft);
  context.subscriptions.push(removeSecondColumnKeepRight);
  context.subscriptions.push(showInOtherColumn);
}


export function deactivate() {
}


class WindowSplitter {
  async useSecondColumn(editor: TextEditor, edit: TextEditorEdit){
    if (editor.viewColumn === ViewColumn.One) {
      let currentFile = editor.document.uri;
      let onlyOne = true;
      for (let ed of vscode.window.visibleTextEditors) {
        if (ed.viewColumn !== ViewColumn.One) {
          onlyOne = false;
          break;
        }
      }

      if (onlyOne) {
        await commands.executeCommand('workbench.action.splitEditorRight');
      }  else {
        await commands.executeCommand('workbench.action.focusRightGroup');
      }
    } else if (editor.viewColumn === ViewColumn.Two) {
      await commands.executeCommand('workbench.action.focusLeftGroup');
    } else{
      await commands.executeCommand('workbench.action.focusLeftGroup');
      this.columnWarning();
    }
  }


  async removeSecondColumn(keep: number, editor: TextEditor, edit: TextEditorEdit){
    let currentFile = editor.document.uri;

    if (editor.viewColumn !== ViewColumn.One && editor.viewColumn !== ViewColumn.Two) {
      await commands.executeCommand('workbench.action.closeEditorsInGroup');
      this.columnWarning();
      return;
    }

    if (keep === KEEP_LEFT) {
      await commands.executeCommand('workbench.action.focusLeftGroup');
      await commands.executeCommand('workbench.action.closeEditorsInOtherGroups');
      return;
    }

    if (editor.viewColumn === ViewColumn.One) {

      var onlyOne = true;
      var secondPanelEditor: any = undefined;

      for (let ed of vscode.window.visibleTextEditors){
        if (ed.viewColumn !== ViewColumn.One) {
          onlyOne = false;
          if (ed.viewColumn === ViewColumn.Two && ed.document.uri === currentFile) {
            secondPanelEditor = ed;
            break;
          }
        }
      }

      if (onlyOne) {
        this.useSecondColumn(editor, edit);
      } else if(keep === KEEP_ACTIVE) {
        await commands.executeCommand('workbench.action.closeEditorsInOtherGroups');
      } else {
        if (secondPanelEditor !== undefined) {
          await commands.executeCommand('workbench.action.closeActiveEditor');
          await commands.executeCommand('workbench.action.focusRightGroup');
          await commands.executeCommand('vscode.open', currentFile, ViewColumn.Two);
          await commands.executeCommand('workbench.action.moveEditorToLeftGroup');
          await commands.executeCommand('workbench.action.focusLeftGroup');
        }
        await commands.executeCommand('workbench.action.closeEditorsInOtherGroups');
      }

    } else if (editor.viewColumn === ViewColumn.Two) {

      var firstPanelEditor: any = undefined;

      for (let ed of vscode.window.visibleTextEditors){
        if (ed.viewColumn === ViewColumn.One && ed.document.uri === currentFile) {
            firstPanelEditor = ed;
            break;
        }
      }

      if (keep === KEEP_ACTIVE || keep === KEEP_RIGHT) {
        if (firstPanelEditor !== undefined)
        {
            await commands.executeCommand('workbench.action.focusLeftGroup');
            await commands.executeCommand('vscode.open', currentFile, ViewColumn.One);
            await commands.executeCommand('workbench.action.closeActiveEditor');
            await commands.executeCommand('workbench.action.focusRightGroup');
        }
        await commands.executeCommand('workbench.action.moveEditorToLeftGroup');
      }

      await commands.executeCommand('workbench.action.focusLeftGroup');
      await commands.executeCommand('workbench.action.closeEditorsInOtherGroups');

    }
  }


  async showInOtherColumn(editor: TextEditor, edit: TextEditorEdit) {
    let currentFile = editor.document.uri;

    let onlyOne = true;
    for (let ed of vscode.window.visibleTextEditors) {
      if (ed.viewColumn !== ViewColumn.One) {
        onlyOne = false;
        break;
      }
    }

    if(onlyOne) {
      await commands.executeCommand('workbench.action.splitEditorRight');
      return;
    }

    if (editor.viewColumn === ViewColumn.One) {
      await commands.executeCommand('workbench.action.focusRightGroup');
      await commands.executeCommand('vscode.open', currentFile, ViewColumn.Two);
    } else if (editor.viewColumn === ViewColumn.Two) {
      await commands.executeCommand('workbench.action.focusLeftGroup');
      await commands.executeCommand('vscode.open', currentFile, ViewColumn.One);
    } else {
      this.columnWarning();
      await commands.executeCommand('workbench.action.focusLeftGroup');
    }
  }


  private columnWarning() {
    vscode.window.showInformationMessage('WindowSplitter is designed to be used in the first two columns only.');
  }
}
