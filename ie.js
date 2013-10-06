M.wrap('github/gabipetrovay/ie-dms/dev/ie.js', function (require, module, exports) {

var ui = require('./ui');
var Bind = require('github/jillix/bind');
var Events = require('github/jillix/events');

module.exports = function (config) {

    var self = this;
    self.config = config;
    self.inbox = [];
    self.$ = {};

    Events.call(self, config);

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
            _id: 1
        };

        var crudObj = {
            t: '000000000000000000000000',
            q: query,
            o: options,
            f: fields
        };

        // get all template ids
        self.emit("find", crudObj, function (err, data) {

            // handle error
            if (err) {
                console.error(err);
                return;
            }

            // an array with template ids
            var _ids = [];
            for (var i = 0; i < data.length; ++i) {
                if (data[i]._id === '000000000000000000000004') { continue; }
                _ids.push(data[i]._id);
            }

            // get templates
            self.emit('getTemplates', _ids, function(err, data) {

                // handle error
                if (err) {
                    console.error(err);
                    return;
                }

                // and finally set self.templates
                self.templates = data;

                // and emit some events
                self.emit('_setTemplates');
            });
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
