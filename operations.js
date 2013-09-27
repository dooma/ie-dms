var model;
//var model = require('./model.js');
var fs = require('fs');
var modm = require('modm');
var ObjectId = modm.ObjectId;

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

}, 2000);
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
setTimeout(function() {
console.dir(link.data);
    if (!checkLink(link, true)) { return; }

    // TODO input data:
    // s = separator (default ,)
    // c = charset (default utf-8)
    // l = lines (default 5)
    // path = file in inbox to read from

    var mappings = {
        // TODO read the first l lines in the file given in link.data.path
        columns: [['Start', 'End', 'Title'], ['2013-12-20', '2013-12-30', 'Christmas Campaign'], ['2014-03-01', '2014-04-10', 'End-of-Winter Aktion']],
        separator: ',',
        charset: 'utf-8'
    };

    link.send(200, mappings);

}, 2000);
};

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

