module.exports = function (config) {

    var self = this;
    var templates;
    var data;

    $('#csvUpload').change(function () {
        var fileName = $(this).val().split('.');
        var extension = fileName[fileName.length-1].toLowerCase();

        if (extension != 'csv') {
            $('#importStage2Btn').attr('disabled', 'disabled');
        } else {
            $('#importStage2Btn').removeAttr('disabled');
        }
    });

    var appendOptionsToDom = function (parentElem, data, select) {
        var options = '';

        for (var key in data) {
            options += '<option value="' + data[key] + '">' + data[key] + '</option>';
        }

        $(parentElem).append(options);
    };

    var setFieldsToDom = function (parentElem, schema){
        for (key in schema) {
            $(parentElem).after('<div class="control-group">' +
            '<label class="control-label">'+ key +'</label>' +
            '<div class="controls fields">' +
            '<select class="span2" id="' + key + '" name="' + key + '"></select>' +
            '</div></div>');
        }
    };

    var setTemplateFields = function (docs, selected) {
        templates = JSON.parse(JSON.stringify(docs));

        for (var key in docs) {
            docs[key] = docs[key].name;
            if (docs[key] === selected || typeof(selected) === 'undefined') {
                selected = key;
            }
        }

        if (docs[selected] === 'Templates') {
            appendOptionsToDom('#template', docs);
        };

        setFieldsToDom('#containerStage2 form .control-group:first', templates[selected].schema);
        appendOptionsToDom('#containerStage2 form select:not(:first)', data, true);
    };

    var loadTemplates = function () {
        self.emit('getTemplates', function (error, docs) {
            if (error) {
                console.log(error);
                return;
            }

            setTemplateFields(docs);
        });
    };

    var setFilenameToForm = function (fileName) {
        $('#containerStage2 form').append('<input type="hidden" value="'
            + fileName + '" name="file"/>')
    };

    $('#uploadFrame').load(function () {
        var response = JSON.parse($('#uploadFrame').contents().find('body pre').html());

        // check if server throwed an error
        if (response['error']) {
            console.log(response['error']);
        } else if (response['data']) {
            // set array element to each select
            data = response['data'];
            loadTemplates();
            setFilenameToForm(response['file']);
        }
    });

    $('#containerStage2 #template').change(function () {
        $('#containerStage2 form .control-group:not(:first)').remove();

        var selected = $(this).find('option:selected').val();
        setTemplateFields(templates, selected);
    });

}
