'use strict';

let _strace;
let _errors;

export function analyzeLogs(logs) {
    _strace = {};
    _errors = {};
    logs.map(trace).map(analyze);
    return _errors;
}

const RE = {
    STAMP   : /^\[.+GMT\]\s(.+)/,
    SITES   : /Sites-(.*?)-?Site/,
    SESSION : /^(.+?)\s+\d{17,20}\s*\-?\s*/,
    STRACE  : /^Stack trace <(ref:)?(\w+)>/,
    ERROR   : /ERROR\sPipelineCallServlet/
}

import { LineByLine } from './liner.js';

function trace(log) {
    console.log(`trace: ${log}`);
    let liner = new LineByLine(log);
    let line = liner && liner.next() || null;

    while (line !== null) {
        const found = line.match(RE.STRACE);
        if (found && !found[1]) {
            const key = found[2];
            _strace[key] = liner.next();
            line = liner.next();
            if (!RE.STAMP.test(line)) _strace[key] += line;
        }
        line = liner.next();
    }
    return log;
}

import { createHash } from 'crypto';

function analyze(log) {
    console.log(`analyze: ${log}`);
    let liner = new LineByLine(log);
    let line = liner && liner.next() || null;
    let site, pipe, msg;

    while (line !== null) {
        const found = line.match(RE.STAMP);
        if (found) {
            const parts = found[1].split('|');
            site = parts && RE.ERROR.test(parts[0]) && parts[2];
            if (site) {
                pipe = parts[3];
                site = site.replace(RE.SITES, '$1');
                msg = parts[5] && parts[5].replace(RE.SESSION, '') || '';
            }
        }
        else {
            const found = line.match(RE.STRACE);
            if (found && site) {
                const desc = _strace[found[2]] || "no-trace-available";
                const key = createHash('md5').update(desc).digest('hex');;
                let count;

                if (!(key in _errors)) {
                    _errors[key] = {
                        'total': 0,
                        'sites': {},
                        'pipes': {},
                        'desc': desc,
                        'msg': msg,
                        'class': ''
                    };
                }
                _errors[key].total++;

                count = _errors[key].sites[site];
                _errors[key].sites[site] = count ? count + 1 : 1;
                count = _errors[key].pipes[pipe];
                _errors[key].pipes[pipe] = count ? count + 1 : 1;
            }
        }
        line = liner.next();
    }
    return log;
}
