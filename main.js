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
        var length = data.length;

        for (var i = 0, options = ''; i < length; ++i) {
            options += '<option value="' + data[i] + '">' + data[i] + '</option>';
        }

        if (select) {
            $(parentElem).append(options);
        } else {
            $(parentElem).append(options);
        }
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
        var ios = 0;
        templates = JSON.parse(JSON.stringify(docs));

        for (var i = 0; i < docs.length; ++i) {
            docs[i] = docs[i].name;
        }

        if (selected) {
            ios = docs.indexOf(selected);
        } else {
            appendOptionsToDom('#template', docs);
        };

        setFieldsToDom('#containerStage2 form .control-group:first', templates[ios].schema);
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

    $('#uploadFrame').load(function () {
        try {
            data = eval($('#uploadFrame').contents().find('body pre').html());
        } catch (e) {
            data = $('#uploadFrame').contents().find('body pre').html();
        }


        // check if server throwed an error
        if (typeof(data) === 'string') {
            console.log(data);
        } else if (typeof(data) === 'object') {
            // set array element to each select
            loadTemplates();
        }
    });

    $('#containerStage2 #template').change(function () {
        $('#containerStage2 form .control-group:not(:first)').remove();

        var selected = $(this).find('option:selected').val();
        setTemplateFields(templates, selected);
    });

}
