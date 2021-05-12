`use strict`;

const browserLauncher = require('./browserLauncher.js');
const createBidiMapperSession = require('./bidiMapperSession.js');
const createBidiServer = require('./bidiServer.js');
const mapperReader = require('./mapperReader.js');


(async () => {
    try {
        createBidiServer.runBidiServer(async ({ initialisationComplete }) => {
            const cdpUrl = await browserLauncher.launch();
            const bidiMapperScript = await mapperReader.readMapper();

            let bidiServer;

            const bidiMapperSession = await createBidiMapperSession.create(bidiMapperScript, cdpUrl, (mapperMessage) => {
                console.log("Mapper message received:\n", mapperMessage);
                if (bidiServer)
                    bidiServer.sendMessage(mapperMessage);
            });


            bidiServer = initialisationComplete();

            bidiServer.setOnMessageHandler((message) => {
                bidiMapperSession.sendBidiCommand(message);
            });
        });
    } catch (e) {
        console.log("Error", e);
    }
})();



