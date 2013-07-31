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

    var setElementsToDom = function (parentElem, elements) {
        var length = elements.length;
        var select = '<select class="span2">';
        for (var i = 0; i < length; ++i) {
            select += '<option value="' + elements[i] + '">' + elements[i] + '</option>';
        }
        select += '</select>';

        $(parentElem).append(select);
    };

    // TODO: Insert Fields from Templates.
    var setFieldsToDom = function (parentElem, times){
        var elem = '<div class="control-group"><label class="control-label"></label>' +
            '<div class="controls fields"></div></div>';

        for (; times; times--) { $(parentElem).after(elem); }
    };

    $('#uploadFrame').load(function () {
        var data = eval($('#uploadFrame').contents().find('body pre').html());

        // check if server throwed an error
        if (typeof(data) === 'string') {
        } else if (typeof(data) === 'object') {
            // set array element to each select
            setFieldsToDom('#containerStage2 form .control-group:first', data.length);
            setElementsToDom('.fields', data);
        }
    });

}
