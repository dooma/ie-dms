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
    self.config.ui.selectors.mappingTable = self.config.ui.selectors.mappingTable || '.mappingTable';

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

    $(self.dom).on('click', self.config.ui.selectors.mappingBack, function() {
        self.emit('reset');
    });

    // configure internal events
    self.on('_startWaiting', startWaiting);
    self.on('_endWaiting', endWaiting);
    self.on('_deleteFile', deleteFile);
    self.on('_showMappings', showMappings);
    self.on('_setTemplates', setTemplates);
    self.on('_renderTable', renderTable);

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
        var field = $(this).attr("data-field");
        var value = $(this).find("option:selected").index();

        self.mappings[field] = value;

        if (!value) {
            delete self.mappings[field];
        }

        self.emit("_refreshTable");
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
        self.emit('_renderTable');
    });
}

function getSelectedTemplate (templId) {

    var self = this;

    for (var i = 0; i < self.templates.length; ++i) {
        var cTemplate = self.templates[i];
        if (cTemplate._id === templId) {
            return cTemplate;
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
    var schema = self.template.schema;

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
    for (var key in schema) {
        var obj = schema[key];
        obj.keyName = key;

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
    for (var field = 0; field < orderedFields.length; ++field) {

        // clone template
        var $field = $template.clone().removeClass(template.substring(1));

        // set the label
        $field.find(name).text(
            (orderedFields[field].label || {})[M.getLocale()] ||
            orderedFields[field].keyName
        );

        // add options
        // TODO Is mappings in the correct format?
        //      I think server should validate csv file and send always a correct
        //      response
        var $options = [];
        var options = self.columns.lines[0];

        for (var i = 0; i < options.length; ++i) {
            var $option = $('<option>');
            $option.attr('value', options[i]);
            // TODO i18n
            $option.text('Column ' + (i + 1) + (options[i] ? ' (' + options[i] + ')' : ''));
            $options.push($option);
        }

        // append options
        $(fieldSelect, $field).append($options).attr("data-field", orderedFields[field].keyName);

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
        self.emit('_showMappings', $(this).parents(self.config.ui.selectors.file).find(ps).text());
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

    for (var key in self.templates) {
        if (!self.templates.hasOwnProperty(key)) return;

        var value = self.templates[key]._id;
        var name = self.templates[key].options.label[M.getLocale()];
        var $option = $('<option>').attr('value', value).text(name);
        $options.append($option);
    }

    $(selectElem).append($options.children());
}

function deleteFile (path, callback) {
    var self = this;
    self.link('deleteFile', { data: path }, callback);
}

function showMappings (path, callback) {
    var self = this;

    // start a waiter
    self.emit('_startWaiting');

    var $pathLabel = self.$.pages.mapping.find(self.config.ui.selectors.mappingPath);
    if ($pathLabel.prop('tagName') === 'INPUT') {
        $pathLabel.val(path);
    } else {
        $pathLabel.text(path);
    }

    self.link('getColumns', { data: { path: path } }, function(err, columns) {

        // end the waiter
        self.emit('_endWaiting', 'mapping');

        if (err) {
            alert(err);
            return;
        }

        self.columns = columns;
        self.emit('_renderTable');

        // remove all the files
        self.$.fields.empty();
    });
}

function renderTable () {
    var self = this;
    //clear the table
    $(self.config.ui.selectors.mappingTable).html('');

    if (self.columns) {
        //get the table data
        var lines = self.columns.lines;

        var body = '<tbody>';
        for (var i = 0; i < lines.length; ++i) {
            if (lines[i]) {
                if (i == 0) {
                    var header = '<thead><tr>';
                    for (var field = 0; field < lines[i].length; ++field) {
                        header += '<th>' + lines[i][field] + '</th>';
                    }
                    header += '</tr></thead>';
                } else {
                    body += '<tr>';
                    for (var field = 0; field < lines[i].length; ++field) {
                        body += '<td>' + lines[i][field] + '</td>';
                    }
                    body += '</tr>';
                }
            }
        }

        //append data to table
        $(self.config.ui.selectors.mappingTable).append(header);
        $(self.config.ui.selectors.mappingTable).append(body);
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

    self.$.pages['mapping'].hide();
    self.$.pages['inbox'].show();
    self.$.fields.empty();

}

return module; });
