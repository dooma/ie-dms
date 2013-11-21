var model = require('./model.js');
var fs = require('fs');
var modm = require('modm');
var ObjectId = modm.ObjectId;
var Charset = require('jschardet');
var CSV = require('a-csv');

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

function arrayToObjectUpdate(data, schema, mappings, key, callback) {

    var obj = {};
    var keyValue;

    for (var fieldKey in mappings) {

        if (!data[mappings[fieldKey].value]) {
            continue;
        }

        var operator = '$set';
        if (schema[fieldKey].type === 'number' && mappings[fieldKey].operator === '$inc') {
            operator = '$inc';
        }

        if (!obj[operator]) {
                obj[operator] = {};
        }

        if (schema[fieldKey].type === 'string') {
            obj[operator][fieldKey] = data[mappings[fieldKey].value];
        } else if (schema[fieldKey].type === 'number') {
            obj[operator][fieldKey] = parseInt(data[mappings[fieldKey].value]);
        } else if (schema[fieldKey].type === 'date') {
            obj[operator][fieldKey] = new Date(data[mappings[fieldKey].value]);
        } else if (schema[fieldKey].type === 'boolean') {
            obj[operator][fieldKey] = Boolean(data[mappings[fieldKey].value]);
        }

        if (fieldKey === key) {
            keyValue = obj[operator][fieldKey];
        }
    }

    callback(obj, keyValue);
}

function insertItem (item, templateId, role, callback) {

    item._tp = ObjectId(templateId);

    var customRequest = {
        role: role,
        templateId: ObjectId(templateId),
        data: item,
        options: {},
        method: 'insert'
    };

    M.emit('crud.create', customRequest, callback);
}

function updateItem (item, keyValue, key, isUpsert, templateId, role, callback) {

    item.$set._tp = ObjectId(templateId);
    var query = {};
    var customRequest = {
        role: role,
        templateId: ObjectId(templateId),
        data: item,
        options: {
            upsert: isUpsert
        },
        method: 'update'
    };
    query[key] = keyValue;
    customRequest.query = query;

    M.emit('crud.update', customRequest, callback);
}

function arrayToObject (data, template, mappings) {

    var obj = {};

    for (var fieldKey in mappings) {

        if (!data[mappings[fieldKey]]) {
            continue;
        }

        var splits = fieldKey.split('.');
        var curObj = obj;
        var curSchema = template.schema;

        for (var j = 0; j < splits.length -1; ++j) {
            curObj[splits[j]] = curObj[splits[j]] || {};
            curObj = curObj[splits[j]];
        }

        if (curSchema[fieldKey].type === 'string') {
            curObj[splits[j]] = data[mappings[fieldKey]];
        } else if (curSchema[fieldKey].type === 'number') {
            curObj[splits[j]] = parseInt(data[mappings[fieldKey]]);
        } else if (curSchema[fieldKey].type === 'date') {
            curObj[splits[j]] = new Date(data[mappings[fieldKey]]);
        } else if (curSchema[fieldKey].type === 'boolean') {
            curObj[splits[j]] = Boolean(data[mappings[fieldKey]]);
        }
    }

    return obj;
}

function getTemplate (templateId, role, callback) {

    //build the request
    var customRequest = {
        role: role,
        templateId: ObjectId('000000000000000000000000'),
        query: {
            _id: ObjectId(templateId)
        },
        data: {},
        options: {},
        method: 'read'
    };

    //emit the request
    M.emit('crud.read', customRequest, function(err, data){

        if (err) {callback(err, null); return;}
        callback(null, data[0]);

    });
}

function sendError (link, operation, msg) {

    // let the client know we had an error
    M.emit('sockets.send', {
        dest: link.session._sid,
        type: 'session',
        event: 'ie',
        data: {
            operation: operation,
            file: link.data.path,
            template: link.data.template,
            status: 'error',
            message: msg
        }
    });
}

exports.import = function (link) {

    if (!checkLink(link, true)) { return; }

    var createRequest = {
        role: link.session.crudRole,
        templateId: ObjectId('000000000000000000000004'),
        data: {
            _tp: [ObjectId('000000000000000000000004')],
            name: 'Import ' + link.data.path,
            type: 'fixed',
            template: ObjectId(link.data.template)
        }
    };

    M.emit('crud.create', createRequest, function (err, results) {

        if (err || !results || !results[0]) {
            link.send(400, JSON.stringify({error: err || 'Could not create import list'}));
            return;
        }

        var updateRequest = {
            role: link.session.crudRole,
            templateId: ObjectId('000000000000000000000004'),
            query: {
                _id: results[0]._id
            },
            data: {
                $set: {
                    filters: [
                        {
                            field: '_li',
                            operator: '=',
                            value: results[0]._id
                        }
                    ]
                }
            }
        };

        M.emit('crud.update', updateRequest, function (err, resultCount) {

            if (err || !resultCount) {
                link.send(400, JSON.stringify({error: err || 'Could not save import list'}));
                return;
            }

            link.send(200, JSON.stringify({ success: 'Data imported' }));

            // insert the data

            // file path
            var path = APP_DIR + '/' + link.params.inboxDir + '/' + link.data.path;

            // separator
            var separators = {
                'COMMA': ',',
                'SEMICOLON': ';',
                'TAB': '\t',
                'SPACE': ' '
            }

            var s = link.data.separator;
            s = separators[s] || s;

            // charset
            var c = link.data.charset;

            // set parse options
            var options = {
                // separator
                delimiter: separators[link.data.separator] || link.data.separator,
                // charset
                charset: link.data.charset
            };

            // get the current template
            var template;
            getTemplate(link.data.template, link.session.crudRole, function(err, data){

                if (err) {
                    //let the client know whe had am error
                    sendError(link, 'import', err.toString());

                    return;
                }

                template = data;

                // parse the file
                var line = 0;
                var itemCount = 0;
                var errorCount = 0;

                CSV.parse(path, options, function (err, row, next){

                    if (err) {
                        // let the client know we had an error
                        sendError(link, 'import', err.toString());

                        return;
                    }

                    if (row) {
                        //if file contains headers skip first row
                        if (!link.data.headers || line > 0) {
                            //check if update
                            if (link.data.update) {

                                arrayToObjectUpdate(row, template.schema, link.data.mappings, link.data.key, function(obj, keyValue) {

                                    var object = obj;
                                    // add the import list to this item
                                    object.$addToSet = {};
                                    object.$addToSet._li = results[0]._id;

                                    updateItem(object, keyValue, link.data.key, link.data.upsert, link.data.template, link.session.crudRole, function(err) {
                                        line++;
                                        if (err) {
                                            errorCount++;
                                        } else {
                                            itemCount++;
                                        }

                                        next();
                                    });
                                });
                            } else {
                                var object = arrayToObject(row, template, link.data.mappings);
                                // add the import list to this item
                                object._li = [results[0]._id];

                                insertItem(object, link.data.template, link.session.crudRole, function(err) {
                                    line++;
                                    if (err) {
                                        errorCount++;
                                    } else {
                                        itemCount++;
                                    }

                                    next();
                                });
                            }
                        } else if (link.data.headers && line == 0){
                            line++;
                            next();
                        }
                    } else {
                        // TODO the next function above is called one more time after the row comes nulli
                        // and this code will also be called twice
                        M.emit('sockets.send', {
                            dest: link.session._sid,
                            type: 'session',
                            event: 'ie',
                            data: {
                                operation: 'import',
                                file: link.data.path,
                                template: link.data.template,
                                count: itemCount
                            }
                        });
                    }
                });

                link.send(200, JSON.stringify({success: 'Data imported'}));
            });

            //TODO give an appropriate notification message when the operation is complete
        });
    });
};

exports.export = function (link) {

    if (!checkLink(link, true)) { return; }

    try {
        var customRequest = {
            role: link.session.crudRole,
            templateId: link.data.template,
            query: link.data.query,
            data: {},
            options: {},
            method: 'read'
        };
    } catch (err) {
        return;
    }

    function createTransform () {
        return function (item) {
            var line = '';

            for (var column in link.data.columns) {
                var value = findValue(item, link.data.columns[column]);
                value = value.toString().indexOf(link.data.separator) !== -1? '"' + value + '"' : value;

                line += value + link.data.separator;
            }

            return line.slice(0, -1) + '\n';
        };
    }

    // we can already send the response to the client
    link.send(200, 'OK');

    M.emit('crud.read', customRequest, function(err, resultCursor, resultCount) {

        if (err) {
            // let the client know we had an error
            sendError(link, 'export', err.toString());

            return;
        }

        // get the file name provided, if it isn't provided make it an empty string
        var filename = link.data.filename || '';

        // if csv extension was provided, remove it!
        // we take care about that
        if (filename.substr(-4) === '.csv') {
            filename = filename.substring(0, filename.lastIndexOf('.'));
        }

        // generate a filename like this: "export_YYYYMMDD_HHMM_original_file_name.csv"
        // also, remove special characters and convert spaces in underscores
        filename = 'export_' +
                   getYYYYMMDD_HHMMTime() +
                   '_' +
                   filename.replace(new RegExp('[^a-zA-Z0-9\\-\\._ ]+', 'g'), '')
                           .replace(new RegExp(' ', 'g'), '_') +
                   '.csv';

        // create the write stream
        var file = fs.createWriteStream(APP_DIR + '/' + link.params.inboxDir + '/' + filename);

        // write headers
        if (link.data.hasHeaders) {
            var headers = '';

            for (var i = 0, l = link.data.columns.length; i < l; ++ i) {
                headers += link.data.labels[link.data.columns[i]] + link.data.separator;
            }

            file.write(headers.slice(0, -1) + '\n');
        }

        if (resultCursor.constructor.name === 'Array') {
            // TODO array cursor handling
            return;
        } else {
            var stream = resultCursor.stream({ transform: createTransform() });
        }

        stream.pipe(file);

        stream.on('end', function () {
            // let the client know we are done
            M.emit('sockets.send', {
                dest: link.session._sid,
                type: 'session',
                event: 'ie',
                data: {
                    operation: 'export',
                    file: filename,
                    template: link.data.template,
                    count: resultCount
                }
            });
        });
    });
};

exports.readInbox = function (link) {

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

        // sort the files in reverse order
        inboxFiles.sort(function(a, b) {
            if (a.path > b.path) return -1;
            if (a.path < b.path) return 1;
            return 0;
        });

        link.send(200, inboxFiles);
    });
};

exports.deleteFile = function (link) {

    if (!checkLink(link, true)) { return; }

    var path = link.data;

    if (!path) { return; }

    //process path
    var modifiedPath = path.replace(/\.\.\//g, '');
    modifiedPath = modifiedPath.replace(/\.\//g, '');

    fs.unlink(APP_DIR + '/' + link.params.inboxDir + '/' + modifiedPath, function (err) {
        if (err) {
            link.send(400, 'Bad Request');
            return;
        }
    });

    link.send(200, 'ok');
};

exports.download = function (link) {

    link.data = link.data.path || link.data;

    if (!checkLink(link, true)) { return; }

    var path = APP_DIR + '/' + link.params.inboxDir + '/' + link.data;

    if(!path) { return; }

    link.res.writeHead(200, {
        'Content-disposition': 'attachment;filename="' + link.data + '"',
        'Content-Type': 'text/csv'
    });

    var filestream = fs.createReadStream(path);
    filestream.pipe(link.res);
};

exports.getColumns = function (link) {

    if (!checkLink(link, true)) { return; }

    // the file path from inbox directory
    var path = APP_DIR + '/' + link.params.inboxDir + '/' + link.data.path;

    // separators
    var separators = {
        'COMMA'     : ',',
        'SEMICOLON' : ';',
        'TAB'       : '\t',
        'SPACE'     : ' '
    };

    // create the read stream
    var readStream = fs.createReadStream(path);

    // initialize first line as empty string
    var firstLine = '';

    // on data
    readStream.on('data', function (chunk) {

        // add chunk to firstLine
        firstLine += chunk;

        // if we have a new line, it means that
        // we've got the entire first line from file
        var index = firstLine.indexOf('\n');

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
                    l = i;
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

    readStream.on('end', function () {
        if (firstLine === '') {
            return link.send(400, 'Empty file');
        }
    });

    // handle errors
    readStream.on('error', function (err) {
        return link.send(400, err);
    });
};

// private functions

function findValue (parent, dotNot) {

    if (!dotNot) return undefined;

    var splits = dotNot.split('.');
    var value;

    for (var i = 0; i < splits.length; i++) {
        value = parent[splits[i]];
        if (value === undefined || value === null) return '';
        if (typeof value === 'object') parent = value;
    }

    return value;
}

// get csv separator
// TODO Handle quoted fields
function getCSVSeparator (text) {

    var possibleDelimiters = [';', ',', '\t'];

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

function getYYYYMMDD_HHMMTime() {

    var date = new Date();

    var hour = date.getHours();
    hour = ((hour < 10 ? '0' : '') + hour).toString();

    var min  = date.getMinutes();
    min = ((min < 10 ? '0' : '') + min).toString();

    var sec  = date.getSeconds();
    sec = ((sec < 10 ? '0' : '') + sec).toString();

    var year = date.getFullYear().toString();

    var month = date.getMonth() + 1;
    month = ((month < 10 ? '0' : '') + month).toString();

    var day  = date.getDate();
    day = ((day < 10 ? '0' : '') + day).toString();

    return year + month + day + '_' + hour + min;

}
