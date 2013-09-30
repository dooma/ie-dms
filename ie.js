M.wrap('github/gabipetrovay/ie-dms/dev/ie.js', function (require, module, exports) {

var ui = require('./ui');

module.exports = function (config) {

    var self = this;
    self.config = config;
    self.inbox = [];
    self.$ = {};

    getTemplates.call(self);

    if (self.config.ui) {
        ui.call(self);
    } else {
        self.on('reset', function () {
            // TODO
        });
    }

    function getTemplates () {

        var query = {};
        var options = {};
        var fields = {
            options: 1,
            _id: 1,
            uploads: 1,
            schema: 1
        };
        var filter = {
            _id: { $nin: ["000000000000000000000004"] }
        }

        var crudObj = {
            t: '000000000000000000000000',
            q: query,
            o: options,
            f: fields
        };

        for (var key in filter) {
            if (!filter.hasOwnProperty(key)) return;
            crudObj.q[key] = filter[key];
        }

        self.emit("find", crudObj, function(err, data) {

            if (err) {
                console.error(err);
                return;
            }

            self.templates = data;
            self.emit("_setTemplates");
        });
    }

    // self.emit('getTemplates', function(err, data) {

    //     // TODO show an error
    //     if (err) { return; }

    //     // TODO stop the waiter
    //     self.templates = data;
    //     console.log('data')
    //     setOptionsToSelect(document.getElementById('inputTemplate'), self.templates, { value: 'id', name: 'label' });
    // });

    // Change the state of upload button
    // $('#csvUpload').change(function () {
    //     var fileName = $(this).val().split('.');
    //     var extension = fileName[fileName.length-1].toLowerCase();

    //     if (extension != 'csv') {
    //         $('#importStage2Btn').attr('disabled', 'disabled');
    //     } else {
    //         $('#importStage2Btn').removeAttr('disabled');
    //     }
    // });

    // set options to a given select tag
    // function setOptionsToSelect (selectElem, data, keys) {
    //     var $options = $("<div>");
    //     for (var key in data) {
    //         // the option name might be with i18n
    //         var name = '';
    //         if (typeof data[key][keys.name] === 'object') {
    //             name = data[key][keys.name][M.getLocale()];
    //         } else {
    //             name = data[key][keys.name];
    //         }
    //         var $option = $("<option>").attr("value", data[key][keys.value]).text(name);
    //         $options.append($option);;
    //     }
    //     $(selectElem).html($options.html());
    // };


    // Fix hidden fields. This is necessary to make second request to backend module
    // var setHiddenToForm = function (data) {
    //     for (var key in data) {
    //         $('#containerStage2 form').append('<input type="hidden" value="'
    //             + data[key] + '" name="'+ key +'"/>')
    //     }
    // };

    // // Handling response from backend module
    // $('#uploadFrame').load(function () {
    //     var response = JSON.parse($('#uploadFrame').contents().find('body pre').html());

    //     // check if server throwed an error
    //     // TODO: set this announcements to DOM
    //     if (response['error']) {
    //         console.log(response['error']);
    //     } else if (response['success']) {
    //         console.log(response['success']);
    //     }
    //     if (response['data']) {
    //         // set array element to each select
    //         data = response['data'];
    //         loadTemplates();
    //         setHiddenToForm({
    //             file: response['file'],
    //             header: response['header']
    //         });
    //     }
    // });

    // Rerender files by specified template
    // $('#containerStage2 #template').change(function () {
    //     $('#containerStage2 form .control-group:not(:first)').remove();

    //     var selected = $(this).find('option:selected').val();
    //     setTemplateFields(templates, selected);
    // });

}

return module; });
