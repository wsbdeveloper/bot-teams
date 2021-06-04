// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler } = require("botbuilder");

class DialogBot extends ActivityHandler {
    constructor(expireSeconds, conversationState, userState, dialog) {
        super();
        if (!conversationState)
            throw new Error(
                "[DialogBot]: Missing parameter. conversationState is required"
            );
        if (!userState)
            throw new Error(
                "[DialogBot]: Missing parameter. userState is required"
            );
        if (!dialog)
            throw new Error(
                "[DialogBot]: Missing parameter. dialog is required"
            );

        this.conversationState = conversationState;
        this.userState = userState;
        this.dialog = dialog;
        this.dialogState = this.conversationState.createProperty("DialogState");

        this.lastAccessProperty = this.conversationState.createProperty("lastAccess");
        this.expireSeconds = expireSeconds;

        this.onMessage(async (context, next) => {
            // Run the Dialog with the new message Activity.
            await this.dialog.run(context, this.dialogState);

            await next();
        });
    }

    async run(context) {
        // now
        const now = new Date();
        // Last access
        const lastAccess = new Date(
            await this.lastAccessProperty.get(context, now.toISOString())
        );
        

        if (now !== lastAccess && ((now.getTime() - lastAccess.getTime()) / 1000) >= this.expireSeconds) {
            await context.sendActivity(
                "Seja bem vindo novamente!  Sessão será iniciada novamente."
            );

            // Clear state.
            await this.conversationState.clear(context);
        }

        await super.run(context);

        // Set last access to the current time.
        await this.lastAccessProperty.set(context, now.toISOString());    

        // Save any state changes. The load happened during the execution of the Dialog.
        await this.conversationState.saveChanges(context, false);
        await this.userState.saveChanges(context, false);
    }
}

module.exports.DialogBot = DialogBot;
