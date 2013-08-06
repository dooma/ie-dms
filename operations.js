var model = require('./model.js');

exports.import = function (link) {
    if (!link.data) {
        link.send(200, JSON.stringify({error: 'No data sent to me'}));
        return;
    }
    console.log(link.data);
    model.importData(link.data, function (error) {
        if (error) {
            link.send(400, JSON.stringify({error: error}));
            return;
        }

    });

    link.send(200, JSON.stringify({success: 'Data received'}));
};

exports.uploadImage = function (link) {
    model.validateFile(link.files, function (error) {
        if (error) {
            link.send(400, JSON.stingify({error: error}));
        }
    });

    var options = {};
    model.getOptions(link.data, function (error, options) {
        if (error) {
            link.send(400, JSON.stringify({error: error}));
            return;
        }

        options = options;
    });

    model.getFirstRow(link.files.csv.path, options, function(error, data) {
        if (error) {
            link.send(400, JSON.stringify({error: error}));
            return;
        }

        link.send(200, JSON.stringify({
                data: data,
                file: link.files.csv.path.replace('uploads/', ''),
                header: link.data.headers ? true : false
            })
        );
    });
};

exports.export = function (link) {
    if (!link.data) {
        link.send(200, JSON.stringify({error: 'No data sent to me'}));
        return;
    }
};
