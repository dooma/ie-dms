module.exports = function (config) {

    var self = this;
    var options = {};

    $('button#uploadFileBtn').click(function(){
        options.separator = $('#separator option:selected').text();
        options.charset = $('#charset option:selected').text();
        options.headers = $('.checkbox').is(':checked');
    });

}
