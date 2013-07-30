module.exports = function (config) {

    var self = this;
    var options = {};

    $('#csvUpload').change(function () {
        var fileName = $(this).val().split('.');
        var extension = fileName[fileName.length-1].toLowerCase();

        if (extension != 'csv') {
            $('#importStage2Btn').attr('disabled', 'disabled');
        } else {
            $('#importStage2Btn').removeAttr('disabled');
        }
    });

}
