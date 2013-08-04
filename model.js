var CSV = require('a-csv');

exports.validateFile = function (file, callback) {
    if (!file.csv || !file.csv.size) {
        callback('Invalid file upload!');
    } else if (file.csv.type != 'text/csv') {
        callback('Invalid file type');
    }
};

exports.getFirstRow = function (file, options, callback) {
    if (typeof(callback) === 'undefined' && typeof(opitons) === 'function') {
        callback = options;
    }

    var filePath = M.config.APPLICATION_ROOT + M.config.app.id + '/' + file;

    CSV.parse(filePath, options, function (error, row, next) {
        if (error) {
            callback(error);
            return;
        }

        if (row !== null) {
            callback(null, row);
            return;
        }
    });

};

exports.getOptions = function (options, callback) {
    if (!options || !options.charset || !options.separator) {
        callback('Invalid options');
        return;
    }

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

exports.importData = function (data, callback) {
    var crudObj = {
        t: '_template',
        q: {},
        o: {},
        f: {}
    }

    self.emit('find', crudObj, function (error, docs) {
        if (error) {
            console.log(error);
            return;
        }

        console.log(docs);
    });
};
