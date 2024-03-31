'use strict';

import * as fs from 'fs';
import * as fsExtra from 'fs-extra';
import * as path from 'path';
import * as zlib from 'zlib';
import { AuthType, createClient } from 'webdav';

import config from './config.json' assert { type: "json" };
import dwconfig from './dwconfig.json' assert { type: "json" };

async function getWebDAVClient() {
    try {
        const options = {};
        if (dwconfig.profiles.api_client.client_id && dwconfig.profiles.api_client.client_secret) {
            const url = 'https://account.demandware.com/dw/oauth2/access_token?grant_type=client_credentials';
            options.authType = AuthType.Token;
            options.token = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Basic ' +
                        btoa(`${dwconfig.profiles.api_client.client_id}:${dwconfig.profiles.api_client.client_secret}`)
                }
            }).then((res) => res.json());
        } else {
            // Deprecated but still acceptable
            options.username = dwconfig.profiles.bm_user.username;
            options.password = dwconfig.profiles.bm_user.password;
        }

        const logsDir = `https://${dwconfig.hostname}/on/demandware.servlet/webdav/Sites/Logs`;
        return createClient(logsDir, options);
    } catch (e) {
        console.log(e);
    }

    console.log('Error: Cannot create WebDAV client');
    process.exit(1);
}

function getFilenameRegex() {
    const regex = `{error,customerror,quota}-*.{log,log.gz}`;
    return regex;
}

function isGZipFile(filename) {
    return filename && path.extname(filename) === '.gz';
}

async function downloadFile(client, filename) {
    if (isGZipFile(filename)) {
        const filenameUnzipped = filename.substring(0, filename.length - 3);
        writeStreamArchive = fs.createWriteStream(config.LOGSDIR + filenameUnzipped);
        return new Promise(resolve => {
            client.createReadStream(filename).pipe(zlib.createGunzip()).pipe(writeStreamArchive);
            writeStreamArchive.on('close', resolve);
            writeStreamArchive.on('error', console.error);
        });
    }

    const writeStreamLog = fs.createWriteStream(config.LOGSDIR + filename);
    return new Promise(resolve => {
        client.createReadStream(filename).pipe(writeStreamLog);
        writeStreamLog.on('close', resolve);
        writeStreamLog.on('error', console.error);
    });
}

export async function downloadLogs() {
    fsExtra.ensureDirSync(config.LOGSDIR);
    fsExtra.emptyDirSync(config.LOGSDIR);

    const client = await getWebDAVClient();
    const directoryItems = await client.getDirectoryContents('/', { glob: getFilenameRegex() });
    for (const itemStat of directoryItems) {
        await downloadFile(client, itemStat.filename);
    }

    console.log('Finished downloading all logs files from WebDAV');

    const logs = fs.readdirSync(config.LOGSDIR)
        .filter(fname => path.extname(fname) === '.log')
        .map(fname => path.join(config.LOGSDIR, fname));

    return logs;
}
