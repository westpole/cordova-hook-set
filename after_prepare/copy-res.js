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
 *
 * !!! Lines 24, 25, 28 and 29 have to be updated before run script.
 */

var
    // add or remove platform name if necessary
    platformList = ['android', 'ios'],

    // add platform if you added new platform to the list above
    settings = {
        android: {
            resource:    'path/to/your/project/resource',
            destination: 'path/to/your/platform/resource'
        },
        ios: {
            resource:    'path/to/your/project/resource',
            destination: 'path/to/your/platform/resource'
        }
    },

    // set files that should not be deleted
    // from destination directory
    ignoreMap = {
        android: ['values', 'xml']
    },

    formatOutput = {
        notification: {
            fileCopyStarted:  '*** Copy assets started:',
            fileCopyFinished: '*** Copy assets finished.',
            directoryCleared: '*** Destination directory was cleared successfully'
        },
        success: {
            fileCopy: '\t from %%filename%%\n\t to %%destfile%%\n\t -------'
        },
        error: {
            existDirectory:       '****\n* Specified in settings destination directory does not exist. It will be created.\n****\n',
            existSourceDirectory: '****\n* CopyRes hook script faild! Source folder does not exist.\n****\n',
            critical:             '****\n* CopyRes hook script faild! You should specify platform name.\n****\n'
        }
    };

/**************************
 * Script body.
 * No need to update anything below this row.
 */

var fs         = require('fs'),
    path       = require('path'),
    rootdir    = process.argv[2],
    cmd        = process.env.CORDOVA_CMDLINE,
    platformId = null,
    index,
    platformNumber,
    pattern,

    /**
     * Clear destination platform directory
     *
     * @param {string} dirPath
     */
    clearDir = function (dirPath) {
        // terminate only ClearDir function execution if destination directory does not exist
        if (!fs.existsSync(dirPath)) {
            return console.error(formatOutput.error.existDirectory);
        }

        var list       = fs.readdirSync(dirPath),
            listLength = list.length,
            index,
            filename,
            stat,
            directoryListToDelete = [];

        for (index = 0; index < listLength; index += 1) {
            if (typeof ignoreMap[platformId] !== 'undefined' && ignoreMap[platformId].indexOf(list[index]) > -1) {
                continue;
            }

            filename = path.join(dirPath, list[index]);
            stat     = fs.statSync(filename);

            if (stat.isDirectory()) {
                directoryListToDelete.push(filename);
                clearDir(filename);

            } else {
                fs.unlinkSync(filename);
            }
        }

        directoryListToDelete.forEach(function (item) {
            fs.rmdirSync(item);
        });
    },

    /**
     * Copy files
     *
     * @param  {string} resource    project directory
     * @param  {string} destination platform directory
     *
     * @return {string}             error message if operation fails
     */
    copyFiles = function (resource, destination) {
        // terminate script execution if resource directory does not exist
        if (!fs.existsSync(resource)) {
            return console.error(formatOutput.error.existSourceDirectory);
        }

        if (!fs.existsSync(destination)) {
            fs.mkdirSync(destination);
        }

        var list       = fs.readdirSync(resource),
            listLength = list.length,
            index,
            filename,
            stat,
            destfile,
            output;

        for (index = 0; index < listLength; index += 1) {
            filename = path.join(resource, list[index]);
            stat     = fs.statSync(filename);
            destfile = path.join(destination, list[index]);

            if (stat.isDirectory()) {
                copyFiles(filename, destfile);

            } else {
                fs.createReadStream(filename).pipe(fs.createWriteStream(destfile));

                output = formatOutput.success.fileCopy.replace(/%%filename%%/, filename);
                output = output.replace(/%%destfile%%/, destfile);

                console.log(output);
            }
        }
    };

// get platform name from command/bash line
platformNumber = platformList.length;

for (index = 0; index < platformNumber; index += 1) {
    pattern = new RegExp('\\b' + platformList[index] + '\\b');

    if (pattern.test(cmd)) {
        platformId = platformList[index];
        break;
    }
}

// if user did not specify platform name in a call,
// then terminate script with an error message
if (!platformId) {
    return console.error(formatOutput.error.critical);
}

// Clear destination directory before copy files
clearDir(settings[platformId].destination);

console.log(formatOutput.notification.directoryCleared);
console.log(formatOutput.notification.fileCopyStarted);

// copy resource files to the project directory
copyFiles(settings[platformId].resource, settings[platformId].destination);

console.log(formatOutput.notification.fileCopyFinished);
