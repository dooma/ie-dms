module.exports = function (config) {

    var self = this;

    $('#csvUpload').change(function () {
        var fileName = $(this).val().split('.');
        var extension = fileName[fileName.length-1].toLowerCase();

        if (extension != 'csv') {
            $('#importStage2Btn').attr('disabled', 'disabled');
        } else {
            $('#importStage2Btn').removeAttr('disabled');
        }
    });

    var buildOptions = function (data) {
        var options = '';
        var length = data.length;

        for (var i = 0, options = ''; i < length; ++i) {
            options += '<option value="' + data[i] + '">' + data[i] + '</option>';
        }
        return options;
    };

    var appendSelectToDom = function (parentElem, elements, id) {
        var select = '<select class="span2" id="' + id + '" name="' + id + '">' + buildOptions(elements) + '</select>';

        $(parentElem).append(select);
    };

    // TODO: Insert Fields from Templates.
    var setFieldsToDom = function (parentElem, times){
        var elem = '<div class="control-group"><label class="control-label"></label>' +
            '<div class="controls fields"></div></div>';

        for (; times; times--) { $(parentElem).after(elem); }
    };

    var loadTemplates = function () {
        var crudObj = {
            t: '_template',
            q: {},
            o: {},
            f: {}
        }

        self.emit('find', crudObj, function (error, docs) {
            if (error) {
                console.log(error);
                return;
            }

            var templates = docs;
            console.log(templates);
            // [Object, Object, Object, Object, Object]

            for (var i = 0; i < docs.length; ++i) {
                docs[i] = docs[i].name;
            }

            console.log(templates);
            // ["Templates", "Roles", "Lists", "Users", "Articles"]

            appendSelectToDom('#containerStage2 form .control-group:first .controls', docs, 'template');
            //setFieldsToDom('#containerStage2 form .control-group:first', data.length);
        });
    };

    $('#uploadFrame').load(function () {
        var data = eval($('#uploadFrame').contents().find('body pre').html());


        // check if server throwed an error
        if (typeof(data) === 'string') {
            console.log(data);
        } else if (typeof(data) === 'object') {
            // set array element to each select
            loadTemplates();

            appendSelectToDom('.fields', data);
        }
    });

    $('#containerStage2 #template').change(function (object) {
    });

}
