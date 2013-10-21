var CSV = require('a-csv');
var modm = require('modm');

// Modm model with settings
var model = modm('dms', {
    host: 'localhost',
    port: 27017,
    server: {
        pooSize: 5
    },
    db: {w: 1}
});
var schema = new modm.Schema({field: String});

// Validate uploaded file
exports.validateFile = function (file, callback) {
    if (!file.csv || !file.csv.size) {
        callback('Invalid file upload!');
    } else if (file.csv.type != 'text/csv') {
        callback('Invalid file type');
    }
};

// Get first row of the uploaded file. It does not need header parameter to parse CSV.
exports.getFirstRow = function (filePath, options, callback) {

    if (typeof opitons === 'function') {
        callback = options;
        options = {};
    }

    var absolutePath = M.config.APPLICATION_ROOT + M.config.app.id + '/' + filePath;

    CSV.parse(absolutePath, options, function (err, row, next) {

        if (err || !row) {
            return callback(err || 'Could not read the first row from file: ' + filePath);
        }

        callback(null, row);
    });
};

// Parse options selected by user
exports.getOptions = function (options, callback) {
    if (!options || !options.charset || !options.separator) {
        callback('Invalid options');
        return;
    }
    // tmp object store options
    var tmp = {
        charset: options.charset
    }

    switch (options.separator) {
        case 'semicolon':
            tmp.delimiter = ';';
            break;
        case 'comma':
            tmp.delimiter = ',';
            break;
    }

    callback(null, tmp);
};

/*
 * Insert the import fixed list into database
 * */
exports.insertImportFixedList = function (listToInsert, callback) {
    
    // set default value for callback
    callback = callback || function () {};
    
    // get collection
    var collection = model("d_lists", schema);
    
    // insert the list
    collection.insert(listToInsert, callback);
}

// Import data operation
exports.importData = function (data, callback) {
   var collection = model('d_templates', schema);
   collection.find({name: data.template}, function (error, cursor) {
       cursor.toArray(function (error, docs) {
           console.log(docs);
       })
   });
};