var model;
//var model = require('./model.js');
var fs = require('fs');
var modm = require('modm');
var ObjectId = modm.ObjectId;
var Charset = require("jschardet");
var CSV = require("a-csv");

var APP_DIR = M.config.APPLICATION_ROOT + M.config.app.id;

// operations

function checkLink (link, mustHaveData) {
    if (!link.params || !link.params.inboxDir) {
        link.send(400, 'Missing inboxDir parameter');
        return false;
    }

    if (mustHaveData && !link.data) {
        link.send(400, 'Missing operation data');
        return false;
    }

console.log(APP_DIR + '/' + link.params.inboxDir);

    if (!fs.existsSync(APP_DIR + '/' + link.params.inboxDir)) {
        link.send(400, 'Inbox directory not found: ' + link.params.inboxDir);
        return false;
    }

    return true;
}

exports.import = function (link) {

    if (!checkLink(link, true)) { return; }

    if (!link.data) {
        link.send(400, JSON.stringify({ error: 'Missing data' }));
        return;
    }

    model.importData(link.data, function (error) {
        if (error) {
            link.send(400, JSON.stringify({error: error}));
            return;
        }

        link.send(200, JSON.stringify({success: 'Data received'}));
    });
};

exports.export = function (link) {
    link.send(200, 'OK');
};

exports.readInbox = function (link) {
setTimeout(function() {

    if (!checkLink(link)) { return; }

    fs.readdir(APP_DIR + '/' + link.params.inboxDir, function(err, files) {

        var inboxFiles = [];

        for (var i in files) {
            // do not return hidden files
            if (files[i][0] === '.') {
                continue;
            }
            inboxFiles.push({ path: files[i] });
        }

        link.send(200, inboxFiles);
    });

}, 500);
};

exports.deleteFile = function (link) {

    if (!checkLink(link, true)) { return; }

    //console.log(">>> " + link.data);

    var path = link.data;

    if (!path) { return; }

    //process path
    var modifiedPath = path.replace(/\.\.\//g, "");
    modifiedPath = modifiedPath.replace(/\.\//g, "");

    fs.unlink(APP_DIR + '/' + link.params.inboxDir + "/" + modifiedPath, function (err) {
        if (err) {
            link.send(400, "Bad Request");
            return;
        }
    });

    link.send(200, 'ok');
};

exports.getColumns = function (link) {

    if (!checkLink(link, true)) { return; }

    // the file path from inbox directory
    var path = APP_DIR + '/' + link.params.inboxDir + '/' + link.data.path;

    // separators
    var separators = {
        "COMMA"     : ",",
        "SEMICOLON" : ";",
        "TAB"       : "\t",
        "SPACE"     : " "
    };

    // TODO stream the file content here, do not read the entire file
    //      1. read the first line only
    //      2. autodetect stuff (sparators, charset)
    //      3. continue to read lines up to the number wanted by the user
    //      4. if headers are users, return to the client also a headers: [..] object
    // get the lines from file
    fs.readFile(path, function (err, fileContent) {

        // handle error
        if (err) { return link.send(400, err); }

        // get file content
        fileContent = fileContent.toString();

        // how many lines?
        var l = parseInt(link.data.lineCount) || 10;

        // number of lines from file
        var lineCount = fileContent.split("\n").length;

        // cannot choose a number of lines greater than
        // the number of lines from file
        if (l > lineCount) {
            l = lineCount;
        }

        // separator
        var s = link.data.separator || getCSVSeparator(fileContent)[0];
        s = separators[s] || s;

        // charset
        var c = link.data.charset || Charset.detect(fileContent).encoding;

        // set parse options
        var options = {
            delimiter: s,
            charset: c
        };

        var i = 0;
        var lines = [];
        // parse the file
        CSV.parse(path, options, function (err, row, next) {

            // handle error
            if (err) { return link.send(400, err); }

            // push line
            lines.push(row);

            // push next line
            if (++i < l) {
                next();
            }
            else {
                // set mappings obj
                var mappings = {
                    lines: lines,
                    separator: s,
                    charset: c
                };

                // send response
                link.send(200, mappings);
            }
        });
    });
};

// get csv separator
// TODO Handle quoted fields
function getCSVSeparator (text) {

    var possibleDelimiters = [";", ",", "\t"];

    return possibleDelimiters.filter(weedOut);

    function weedOut (delimiter) {
        var cache = -1;
        return text.split('\n').every(checkLength);

        function checkLength (line) {
            if (!line) {
                return true;
            }

            var length = line.split(delimiter).length;
            if (cache < 0) {
                cache = length;
            }
            return cache === length && length > 1;
        }
    }
}

// internal functions

function getUpload(link, callback) {

    var ds = 'dsUpload';
    if (!link.params || !link.params[ds]) {
        return callback('Missing datasource operations parameter: ' + ds);
    }

    if (!link.data || !link.data.upload) {
        return callback('Missing upload id');
    }

    M.datasource.resolve(link.params[ds], function(err, ds) {

        if (err) { return callback(err); }

        M.database.open(ds, function(err, db) {

            if (err) { return callback(err); }

            db.collection(ds.collection, function(err, collection) {

                if (err) { return callback(err); }

                collection.findOne({ _id: new ObjectId(link.data.upload) }, function(err, upload) {

                    if (err || !upload) { return callback(err || 'No such upload: ' + link.data.upload); }

                    callback(null, upload);
                });
            });
        });
    });
}

