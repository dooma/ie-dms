var model = require('./model.js');

exports.import = function (link) {
    if (!link.data) {
        link.send(200, 'No data sent to me');
        return;
    }
}

exports.uploadImage = function (link) {
    model.validateFile(link.files, function (error) {
        if (error) {
            link.send(400, error);
            return;
        }
    });

    if (!link.data) {
        link.send(400, 'No data sent to me');
        return;
    }

    link.send(200, 'File uploaded');
}

exports.export = function (link) {
    if (!link.data) {
        link.send(200, 'No data sent to me');
        return;
    }
}
