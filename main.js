M.wrap('github/gabipetrovay/ie-dms/dev/main.js', function (require, module, exports) {
module.exports = function (config) {

    var self = this;
    self.config = config;


    // TODO start a waiter

    self.emit('getTemplates', function(err, data) {

        // TODO show an error
        if (err) { return; }

        // TODO stop the waiter
        self.templates = data;

        setOptionsToSelect(document.getElementById('inputTemplate'), self.templates, { value: 'id', name: 'label' });
    });

    // Change the state of upload button
    $('#csvUpload').change(function () {
        var fileName = $(this).val().split('.');
        var extension = fileName[fileName.length-1].toLowerCase();

        if (extension != 'csv') {
            $('#importStage2Btn').attr('disabled', 'disabled');
        } else {
            $('#importStage2Btn').removeAttr('disabled');
        }
    });

    // set options to a given select tag
    function setOptionsToSelect (selectElem, data, keys) {
        var options = '';
        for (var key in data) {
            // the option name might be with i18n
            var name = '';
            if (typeof data[key][keys.name] === 'object') {
                name = data[key][keys.name][M.getLocale()];
            } else {
                name = data[key][keys.name];
            }
            options += '<option value="' + data[key][keys.value] + '">' + name + '</option>';
        }
        selectElem.innerHTML = options;
    };

    // Append label and select tags after first element which is Templates
    var setFieldsToDom = function (parentElem, schema){
        for (key in schema) {
            $(parentElem).after('<div class="control-group">' +
            '<label class="control-label">'+ key +'</label>' +
            '<div class="controls fields">' +
            '<select class="span2" id="' + key + '" name="' + key + '"></select>' +
            '</div></div>');
        }
    };

    // Set template fields to DOM if page is rendered. Otherwise, it does not render templates options again.
    var setTemplateFields = function (docs, selected) {
        templates = JSON.parse(JSON.stringify(docs));

        for (var key in docs) {
            docs[key] = docs[key].name;
            // If page is rendered first time, we do not have an template selected. So we select first template.
            if (docs[key] === selected || typeof(selected) === 'undefined') {
                selected = key;
            }
        }

        // Append template options to DOM
        if (docs[selected] === 'Templates') {
            appendOptionsToDom('#template', docs);
        };

        setFieldsToDom('#containerStage2 form .control-group:first', templates[selected].schema);
        appendOptionsToDom('#containerStage2 form select:not(:first)', data, true);
    };

    // Load templates from CRUD module
    var loadTemplates = function () {
        self.emit('getTemplates', function (error, docs) {
            if (error) {
                console.log(error);
                return;
            }

            setTemplateFields(docs);
        });
    };

    // Fix hidden fields. This is necessary to make second request to backend module
    var setHiddenToForm = function (data) {
        for (var key in data) {
            $('#containerStage2 form').append('<input type="hidden" value="'
                + data[key] + '" name="'+ key +'"/>')
        }
    };

    // Handling response from backend module
    $('#uploadFrame').load(function () {
        var response = JSON.parse($('#uploadFrame').contents().find('body pre').html());

        // check if server throwed an error
        // TODO: set this announcements to DOM
        if (response['error']) {
            console.log(response['error']);
        } else if (response['success']) {
            console.log(response['success']);
        }
        if (response['data']) {
            // set array element to each select
            data = response['data'];
            loadTemplates();
            setHiddenToForm({
                file: response['file'],
                header: response['header']
            });
        }
    });

    // Rerender files by specified template
    $('#containerStage2 #template').change(function () {
        $('#containerStage2 form .control-group:not(:first)').remove();

        var selected = $(this).find('option:selected').val();
        setTemplateFields(templates, selected);
    });

}

return module; });
