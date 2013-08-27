var model = require('./model.js');
var modm = require('modm');
var ObjectId = modm.ObjectId;

// operations

exports.import = function (link) {

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

    if (!link.data) {
        link.send(400, JSON.stringify({ error: 'Missing data' }));
        return;
    }
};

exports.mappings = function () {

    if (!link.data) {
        link.send(400, JSON.stringify({ error: 'Missing data' }));
        return;
    }

    if (!link.data.upload) {
        link.send(400, JSON.stringify({ error: 'Missing upload id' }));
        return;
    }

    getUpload(link, function(err, upload) {

        if (err) {
            link.send(400, err);
            return;
        }

        model.getFirstRow(upload.file, function(err, row) {

            if (err) {
                link.send(500, error);
                return;
            }

console.dir(row);

            var sampleMappings = {
                'col1': [0, 'First'],
                'col2': [2, 'Third'],
                'col3': [1, 'Second'],
                'col4': [3]
            };

            link.send(200, sampleMappings);
        });
    });
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

