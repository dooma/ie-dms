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

exports.download = function (link) {
    
    if (!checkLink(link, true)) { return; }
    
    var path = APP_DIR + '/' + link.params.inboxDir + "/" + link.data;
    
    if(!path) { return; }
    
    link.res.setHeader('Content-disposition', 'attachment; filename=' + path);
    
    var filestream = fs.createReadStream(path);
    filestream.pipe(link.res);
    
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

    // create the read stream
    var readStream = fs.createReadStream(path);

    // initialize first line as empty string
    var firstLine = "";

    // on data
    readStream.on("data", function (chunk) {
        // add chunk to firstLine
        firstLine += chunk;

        // if we have a new line, it means that
        // we've got the entire first line from file
        var index = firstLine.indexOf("\n");

        if (index !== -1) {

            // end stream
            readStream.close();

            // substring it!
            firstLine = firstLine.substring(0, index);

            // how many lines?
            var l = parseInt(link.data.lineCount) || 10;

            // separator
            var s = link.data.separator || getCSVSeparator(firstLine)[0];
            s = separators[s] || s;

            // charset
            var c = link.data.charset || Charset.detect(firstLine).encoding;

            // force hasHeaders to be boolean
            link.data.hasHeaders = link.data.hasHeaders ? true : false;

            // set parse options
            var options = {
                delimiter: s,
                charset: c
            };

            var i = 0;
            var lines = [];
            var headers;

            // parse the file
            CSV.parse(path, options, function (err, row, next) {

                // handle error
                if (err) { return link.send(400, err); }

                // push line or set headers
                if (link.data.hasHeaders && i === 0) {
                    headers = row;
                }
                // row exits, push it
                else if (row) {
                    lines.push(row);
                // row is null, that means that we've read the entire file
                } else {
                    l = i + 1;
                }

                // go to next line
                if (++i < l) {
                    next();
                }
                else {
                    // set mappings obj
                    var mappings = {
                        // the read lines
                        lines: lines,
                        // separator
                        separator: s,
                        // charset
                        charset: c,
                        // how many lines
                        lineCount: l,
                        // the headers (an array or undefined)
                        headers: headers,
                        // hasHeaders: boolean
                        hasHeaders: link.data.hasHeaders
                    };

                    // send response
                    link.send(200, mappings);
                }
            });
        }
    });

    // handle errors
    readStream.on("error", function (err) {
        return link.send(400, err);
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

