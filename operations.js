exports.import = function (link) {
    if (!link.data) {
        link.send(200, 'No data sent to me');
        return;
    }
}

exports.uploadImage = function (link) {
    if (!link.files || !link.files.image || !link.files.image.size) {
        return link.send(400, { error: 'Invalid image upload' });
    }
}

exports.export = function (link) {
    if (!link.data) {
        link.send(200, 'No data sent to me');
        return;
    }
}
