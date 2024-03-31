'use strict';

import * as fs from 'fs';
import * as path from 'path';

import config from './config.json' assert { type: "json" };
import { downloadLogs } from './downloader.js';
import { analyzeLogs } from './analyzer.js';
import { summaryHtml } from './formatter.js';

const logs = await downloadLogs();
const errors = analyzeLogs(logs);

const topErrors = Object.keys(errors)
    .filter(key => errors[key].total > config.MINIMUM_ERRORS_TRESHOLD)
    .sort((a, b) => errors[b].total - errors[a].total)
    .map(key => {
        if (errors[key].total > config.CRITICAL_ERRORS_TRESHOLD) {
            errors[key].class = 'error-critical';
        }
        return errors[key];
    });

const today = new Date().toISOString().split('T')[0].replaceAll('-', '');
const summary = path.join(config.LOGSDIR, `${config.SUMMARY_FILENAME.replace('[DATE]', today)}.html`);

console.log(`Output: ${summary}`);
fs.writeFileSync(summary, summaryHtml(topErrors));

console.log('Done.');
