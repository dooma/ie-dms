var model = require('./model.js');

exports.import = function (link) {
    if (!link.data) {
        link.send(200, 'No data sent to me');
        return;
    }
};

exports.uploadImage = function (link) {
    model.validateFile(link.files, function (error) {
        if (error) {
            link.send(400, error);
            return;
        }
    });

    var options = {};
    model.getOptions(link.data, function (error, options) {
        if (error) {
            link.send(400, error);
            return;
        }

        options = options;
    });

    model.getFirstRow(link.files.csv.path, options, function(error, data) {
        if (error) {
            link.send(400, error);
            return;
        }

        link.send(200, data);
    });
};

exports.export = function (link) {
    if (!link.data) {
        link.send(200, 'No data sent to me');
        return;
    }
};
