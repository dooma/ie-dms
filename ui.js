M.wrap('github/gabipetrovay/ie-dms/dev/ui.js', function (require, module, exports) {

module.exports = function () {
    var self = this;

    // process UI config
    self.config.ui.selectors = self.config.ui.selectors || {};
    self.config.ui.selectors.waiter = self.config.ui.selectors.waiter || '.waiter';
    self.config.ui.selectors.inboxPage = self.config.ui.selectors.inboxPage || '#inbox';
    self.config.ui.selectors.mappingPage = self.config.ui.selectors.mappingPage || '#mapping';
    // file list
    self.config.ui.selectors.file = self.config.ui.selectors.file || '.file';
    self.config.ui.selectors.files = self.config.ui.selectors.files || '.files';
    self.config.ui.selectors.inboxFilePath = self.config.ui.selectors.inboxFilePath || '.path';
    self.config.ui.selectors.inboxFileImport = self.config.ui.selectors.inboxFileImport || '.import';
    self.config.ui.selectors.inboxFileDelete = self.config.ui.selectors.inboxFileDelete || '.delete';
    // column mapping
    self.config.ui.selectors.field = self.config.ui.selectors.field || '.field';
    self.config.ui.selectors.fields = self.config.ui.selectors.fields || '.fields';
    self.config.ui.selectors.template = self.config.ui.selectors.template || '.template';
    self.config.ui.selectors.mappingPath = self.config.ui.selectors.mappingPath || '.path';
    self.config.ui.selectors.mappingBack = self.config.ui.selectors.mappingBack || '.back';
    self.config.ui.selectors.mappingImport = self.config.ui.selectors.mappingImport || '.import';

    // the waiter
    self.$.waiter = $(self.config.ui.selectors.waiter, self.dom);

    // the pages
    self.$.pages = {};
    self.$.pages.inbox = $(self.config.ui.selectors.inboxPage, self.dom);
    self.$.pages.mapping = $(self.config.ui.selectors.mappingPage, self.dom);

    // the file template
    self.$.file = $(self.config.ui.selectors.file, self.dom).detach();
    // the file container
    self.$.files = $(self.config.ui.selectors.files, self.dom);

    // the field template
    self.$.field = $(self.config.ui.selectors.field, self.dom).detach();
    // the field container
    self.$.fields = $(self.config.ui.selectors.fields, self.dom);

    // field template
    self.$.fieldTemplate = $('.field-template', self.dom);

    // the template select
    self.$.select = $(self.config.ui.selectors.template, self.dom);

    // columsData cache
    self.columsData = {};

    $(self.dom).on('click', self.config.ui.selectors.mappingBack, function() {
        self.emit('reset');
    });

    // configure internal events
    self.on('_startWaiting', startWaiting);
    self.on('_endWaiting', endWaiting);
    self.on('_deleteFile', deleteFile);
    self.on('_showMappings', showMappings);
    self.on('_setTemplates', setTemplates);
    self.on('_refreshTable', refreshTable);

    // configure external events
    self.on('readInbox', readInbox);
    self.on('reset', reset);

    // ******************************************

    // read the inbox
    self.emit('readInbox');

    self.mappings = {};
    // detect data-field select change
    // TODO Why this doesn't work?
    // $(self.dom).on("change", "select[data-field]", function () {
    $(document).on("change", "select[data-field]", function () {
        // get field name
        var field = $(this).attr("data-field");

        // and its value
        var value = parseInt($(this).val());

        // set it in mappings
        self.mappings[field] = value;

        // if value is empty, delete that field
        if (isNaN(value)) {
            delete self.mappings[field];
        }

        // delete first line if it contains the headers
        if ($(".headersInFirstLine", self.dom).prop("checked")) {
            self.colums.lines.splice(0, 1);
        }

        // refresh table
        self.emit("_refreshTable");
    });

    // changes in data-option fields
    $(document).on("change", "#" + self.miid + " [data-option]", function () {
        // get option name
        var option = $(this).attr("data-option");

        // update colums data
        self.columsData[option] = $(this).val();

        // and show mappings
        self.emit("_showMappings");
    });

    // add change handler for template select
    templateChangeHandler.call(self);
}


function readInbox () {
    var self = this;

    // start a waiter
    self.emit('_startWaiting');

    self.link('readInbox', function(err, files) {

        // end the waiter
        self.emit('_endWaiting', 'inbox');

        if (err) {
            alert(err);
            return;
        }

        self.inbox = files;

        // no need to continue if we don't have a file container
        if (!self.$.files.length) {
            return;
        }

        // remove all the files
        self.$.files.empty();

        // add back the new files
        for (var i = 0; i < files.length; ++i) {
            appendFile.call(self, files[i]);
        }
    });
}

function templateChangeHandler () {
    var self = this;

    $(self.dom).off('change');
    $(self.dom).on('change', self.config.ui.selectors.template, function () {
        setTemplateFields.call(self, getSelectedTemplate.call(self, ($(this).val())));
        self.emit("_refreshTable");
    });
}

function getSelectedTemplate (templId) {

    var self = this;

    for (var templateId in self.templates) {
        if (templateId === templId) {
            return self.templates[templateId];
        }
    }

    return undefined;
}

// Set template fields to DOM if page is rendered. Otherwise, it does not render templates options again.
function setTemplateFields (selected) {

    var self = this;

    if (!selected) {
        // empty the fields
        self.$.fields.empty();
        // delete the saved template
        delete self.template;
        // hide mapping fields
        $('.mapping-fields').hide();
        return;
    }

    self.template = JSON.parse(JSON.stringify(selected));

    // TODO Move to config
    var template    = '.field-template',
        name        = '.field-name',
        fieldSelect = '.field-select';

    // set template
    var $template = self.$.fieldTemplate;
    var $fieldsToAdd = [];

    // show mapping fields
    $('.mapping-fields').show();

    // reorder the fields
    var orderedFields = [];
    var schema = self.template.schema;
    for (var key in schema) {

        var splits = key.split(".");

        // TODO Use continue in the second for
        var cont = 0;

        // verify if it has pushed already
        for (var i = 0; i < orderedFields.length; ++i) {
            if (orderedFields[i].keyName === splits[0]) {
                // TODO Here... :-)
                cont = 1;
            }
        }

        // if cont, conitnue
        if (cont) { continue; }

        // it is a schema field
        var obj = {};

        // the label doesn't exist. We need labels!
        if (!schema[key].label) {
            continue;
        }

        // set keyName
        obj.keyName = splits[0];

        // and the order
        obj.order = schema[key].order;

        // and label (object: using getLocale)
        obj.label = schema[key].label[M.getLocale()];

        // if it is undefined, then it must be a string
        // if it really doesn't exist, key will appear in UI
        if (!obj.label) {
            obj.label = schema[key].label || key;
        }

        // ...and push the object
        orderedFields.push(obj);
    }

    orderedFields.sort(function(f1, f2) {
        if (f1.order < f2.order) {
            return -1;
        } else {
            return 1;
        }
    });

    // add the fields
    for (var i = 0; i < orderedFields.length; ++i) {

        // clone template
        var $field = $template.clone().removeClass(template.substring(1));

        // set the label
        $field.find(name).text(orderedFields[i].label);

        // add options
        var $options = [];
        var options = self.columns.lines[0];

        // for each option
        for (var ii = 0; ii < options.length; ++ii) {
            // build a new jQuery option element
            var $option = $('<option>');
            // and set its value
            $option.attr('value', ii.toString());
            // and the label
            $option.text('Column ' + (ii + 1) + (options[ii] ? ' (' + options[ii] + ')' : ''));
            // and finally, push it
            $options.push($option);
        }

        // append options
        $(fieldSelect, $field).append($options).attr("data-field", orderedFields[i].keyName);

        // push field into array
        $fieldsToAdd.push($field);
    }

    // empty all fields
    self.$.fields.empty()
        // and append the new fields
        .append($fieldsToAdd);
};

function appendFile (file) {
    var self = this;

    var $file = self.$.file.clone();
    var ps = self.config.ui.selectors.inboxFilePath;

    $file.find(ps).html(file.path);
    $file.on('click', self.config.ui.selectors.inboxFileImport, function() {
        // save path in colums data
        self.columsData.path = $(this).parents(self.config.ui.selectors.file).find(ps).text();
        // and show mappings
        self.emit('_showMappings');
    });
    $file.on('click', self.config.ui.selectors.inboxFileDelete, function() {
        var $thisFile = $(this).parents(self.config.ui.selectors.file);
        // only hide the file
        $thisFile.hide();
        // trigger a file deletion operations
        self.emit('_deleteFile', $thisFile.find(ps).text(), function(err) {
            // show back the file on error or remove on success
            if (err) {
                $thisFile.fadeIn();
            } else {
                $thisFile.remove();
            }
        });
    });
    // add the new file to the dom
    self.$.files.append($file);
}

function setTemplates () {
    var self = this;

    var selectElem = self.config.ui.selectors.template;
    var $options = $('<div>');

    for (var templateId in self.templates) {
        var value = templateId;
        var name = self.templates[templateId].options.label[M.getLocale()] || self.templates[templateId].options.label;
        var $option = $('<option>').attr('value', value).text(name);
        $options.append($option);
    }

    $(selectElem).append($options.children());
}

function deleteFile (path, callback) {
    var self = this;
    self.link('deleteFile', { data: path }, callback);
}

function showMappings (callback) {
    var self = this;

    // start a waiter
    self.emit('_startWaiting');

    var $pathLabel = self.$.pages.mapping.find(self.config.ui.selectors.mappingPath);
    if ($pathLabel.prop('tagName') === 'INPUT') {
        $pathLabel.val(self.columsData.path);
    } else {
        $pathLabel.text(self.columsData.path);
    }

    self.link('getColumns', { data: self.columsData }, function(err, columns) {

        // end the waiter
        self.emit('_endWaiting', 'mapping');

        if (err) {
            alert(err);
            return;
        }

        // separators
        var separators = {
            ",": "COMMA",
            ";": "SEMICOLON",
            "\t": "TAB",
            " ": "SPACE"
        };

        // set separator
        columns.separator = separators[columns.separator];

        // update options in UI
        for (var op in columns) {
            $("[data-option='" + op + "']", self.dom).val(columns[op]);
        }

        self.columns = columns;

        // remove all the files
        self.$.fields.empty();
    });
}

function refreshTable () {
    var self = this;

    if (getSelectedTemplate.call(self, self.template.id)) {
       var template = getSelectedTemplate.call(self, self.template.id);
    }
    var lines = self.columns.lines;

    if (!jQuery.isEmptyObject(self.mappings) && template) {
        var data = [];
        var lineTemplate = {};

        for (var key in self.mappings) {
            for (var field in template.schema) {
                if (key.toLowerCase() === field.toLowerCase()) {
                    lineTemplate[field] = self.mappings[key];
                }
            }
        }

        for (var line = 1; line < lines.length; ++line) {
            var dataLine = {};
            if (lines[line]) {
                for(var field in lineTemplate) {
                    dataLine[field] = lines[line][lineTemplate[field]];
                }
                data.push(dataLine);
            }
        }
    }

    if (data) {
        self.emit("template", template);
        self.emit("result", null, data);
    } else {
        //TODO clear table
    }
}

function startWaiting () {
    var self = this;

    // hide all the pages
    for (var id in self.$.pages) {
        self.$.pages[id].hide();
    }

    // show wwaiter if one available
    if (self.$.waiter) {
        self.$.waiter.show();
    }
}

function endWaiting (pageId) {
    var self = this;

    // show wwaiter if one available
    if (self.$.waiter) {
        self.$.waiter.hide();
    }

    // show the wanted page
    if (self.$.pages[pageId]) {
        self.$.pages[pageId].show();
    }
}

function reset () {
    var self = this;

    // colums data is cleaned up
    self.columsData = {};

    self.$.pages['mapping'].hide();
    self.$.pages['inbox'].show();
    self.$.fields.empty();

}

return module; });
