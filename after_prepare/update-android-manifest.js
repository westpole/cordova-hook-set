#!/usr/bin/env node

/**
 * Author: Stanislav Spuzyak aka westpole
 * Git:    https://github.com/westpole/cordova-hook-set
 *
 * version: 0.1
 */

/**************************
 * Configuration.
 * Update this with your project data.
 */

var manifestFilePath = 'platforms/android/AndroidManifest.xml';

/**************************
 * Script body.
 * No need to update anything below this row.
 */

var cmd = process.env.CORDOVA_CMDLINE;

if (/\bandroid\b/.test(cmd) === false) {
    return;
}

var fs        = require('fs'),
    xml2js    = require('xml2js'),
    path      = require('path'),
    rootdir   = process.argv[2],
    parser    = new xml2js.Parser(),
    configMap = {},
    destFile  = path.join(rootdir, manifestFilePath);

fs.readFile(path.join(rootdir, 'config.xml'), function (err, data) {
    parser.parseString(data, function (err, result) {
        configMap.versionCode = result.widget.$['android-versionCode'];
        configMap.version     = result.widget.$.version;
    });
});

fs.readFile(destFile, function (err, data) {
    parser.parseString(data, function (err, result) {
        result.manifest.$['android:versionCode'] = configMap.versionCode;
        result.manifest.$['android:versionName'] = configMap.version;

        var builder = new xml2js.Builder(),
            xml     = builder.buildObject(result);

        fs.writeFileSync(destFile, xml, 'utf8');
    });
});