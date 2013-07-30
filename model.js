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

    CSV.parse(file, options, function (error, row) {
        if (error) {
            callback(error);
            return;
        }

        console.log(row);
        if (row !== null) {
            callback(null, row);
            return;
        }
    });

};
