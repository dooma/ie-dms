M.wrap('github/gabipetrovay/ie-dms/dev/ui_import.js', function (require, module, exports) {

module.exports = function () {
    var self = this;
    
    // no inbox
    self.config.noInbox = self.config.noInbox || false;
    
    // process UI config
    self.config.import.ui.selectors = self.config.import.ui.selectors || {};
    self.config.import.ui.selectors.waiter = self.config.import.ui.selectors.waiter || '.waiter';
    self.config.import.ui.selectors.inboxPage = self.config.import.ui.selectors.inboxPage || '#inbox';
    self.config.import.ui.selectors.mappingPage = self.config.import.ui.selectors.mappingPage || '#mapping';
    // file list
    self.config.import.ui.selectors.file = self.config.import.ui.selectors.file || '.file';
    self.config.import.ui.selectors.files = self.config.import.ui.selectors.files || '.files';
    self.config.import.ui.selectors.inboxFilePath = self.config.import.ui.selectors.inboxFilePath || '.path';
    self.config.import.ui.selectors.inboxFileImport = self.config.import.ui.selectors.inboxFileImport || '.import';
    self.config.import.ui.selectors.inboxFileDelete = self.config.import.ui.selectors.inboxFileDelete || '.delete';
    self.config.import.ui.selectors.inboxFileDownload = self.config.import.ui.selectors.inboxFileDownload || '.download';
    // column mapping
    self.config.import.ui.selectors.field = self.config.import.ui.selectors.field || '.field';
    self.config.import.ui.selectors.fields = self.config.import.ui.selectors.fields || '.fields';
    self.config.import.ui.selectors.template = self.config.import.ui.selectors.template || '.template';
    self.config.import.ui.selectors.mappingPath = self.config.import.ui.selectors.mappingPath || '.path';
    self.config.import.ui.selectors.mappingBack = self.config.import.ui.selectors.mappingBack || '.back';
    self.config.import.ui.selectors.mappingImport = self.config.import.ui.selectors.mappingImport || '.import';

    // the waiter
    self.$.waiter = $(self.config.import.ui.selectors.waiter, self.dom);

    // the pages
    self.$.pages = {};
    self.$.pages.inbox = $(self.config.import.ui.selectors.inboxPage, self.dom);
    self.$.pages.mapping = $(self.config.import.ui.selectors.mappingPage, self.dom);

    // the file template
    self.$.file = $(self.config.import.ui.selectors.file, self.dom).detach();
    // the file container
    self.$.files = $(self.config.import.ui.selectors.files, self.dom);

    // the field template
    self.$.field = $(self.config.import.ui.selectors.field, self.dom).detach();
    // the field container
    self.$.fields = $(self.config.import.ui.selectors.fields, self.dom);

    // field template
    self.$.fieldTemplate = $('.field-template', self.dom);

    // the template select
    self.$.select = $(self.config.import.ui.selectors.template, self.dom);

    // columsData cache
    self.columsData = {};

    $(self.dom).on('click', self.config.import.ui.selectors.mappingBack, function() {
        self.emit('reset');
    });
    
    $(self.dom).on('click', self.config.import.ui.selectors.mappingImport, function () {
        self.emit('import');
    });

    // configure internal events
    self.on('_startWaiting', startWaiting);
    self.on('_endWaiting', endWaiting);
    self.on('_deleteFile', deleteFile);
    self.on('_download', download);
    self.on('_showMappings', showMappings);
    self.on('_setTemplates', setTemplates);
    self.on('_refreshTable', refreshTable);
    self.on('_refreshFields', refreshFields);

    // configure external events
    self.on('readInbox', readInbox);
    self.on('reset', reset);
    self.on('setTemplate', setTemplate);
    self.on('import', importData);

    // ******************************************

    // read the inbox
    if (!self.config.noInbox) {
        self.emit('readInbox');
    }

    // detect field select change
    // TODO Why this doesn't work?
    //$(self.dom).on('change', 'select.field-select', function () {
    $(document).on('change', 'select.field-select', function () {
        // get field name
        var columnIndex = parseInt($(this).val());
        var fieldKey = $(this).attr('name');

        self.mappings = self.mappings || {};

        if (isNaN(columnIndex)) {
            // if empty value, delete that field
            delete self.mappings[fieldKey];
        } else {
            // else set it in mappings
            self.mappings[fieldKey] = columnIndex;
        }

        // refresh table
        self.emit('_refreshTable');
    });

    // changes in data-option fields
    $(document).on('change', '#' + self.miid + ' [data-option]', function () {
        // get option name
        var option = $(this).attr('data-option');

        // update colums data
        self.columsData[option] = $(this).attr("type") !== "checkbox" ? $(this).val() : $(this).prop("checked");

        // and show mappings
        self.emit('_showMappings', function(err) {

            if (err) {
                alert(err);
                return;
            }

            resetMappings.call(self);
            self.emit('_refreshTable');
            self.emit("_refreshFields");
        });
        
    });

    // TODO remove hardcoded selectors
    $(document).on('change', 'input[name=operation]:radio', function () {

        var operation = $('input[name=operation]:radio:checked').val();

        if (operation === 'insert') {
            $('#upsert').attr('disabled', true);
            $('.update').hide();
        } else {
            $('#upsert').removeAttr('disabled');
            $('.update').show();
        }
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
        console.dir(files);

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
    $(self.dom).on('change', self.config.import.ui.selectors.template, function () {
        self.emit('setTemplate', $(this).val());
    });
}

function resetMappings () {
    var self = this;

    if (self.mappings) {
        self.mappings = {};
    }

}

function setTemplate (templateId) {
    var self = this;

    // we reset if the user clears the template selection
    if (!templateId) {
        self.emit('reset');
        return;
    }

    // otherwise we refresh the fields and the table
    self.emit('template', self.template);
    self.emit('_refreshFields');
    self.emit('_refreshTable');
}
    
function importData () {
    var self = this;
    
    // getting required info
    var info = gatherInfo.call(self);
    
    // calling server operation
    self.link('import', { data: info }, function (err) {
        
        if (err) { 
            $('body').append("<div class='message-popup error'><i class='icon-remove'></i> An error occurred!</div>");
            $(".message-popup").fadeIn(300);
            setTimeout (function () {
                $(".message-popup").fadeOut(1000, function () {
                    $(this).remove();
                });
            }, 1000);
            return;
        }
        
        // TODO handle "IMPORT SUCCESFUL" message
        $('body').append("<div class='message-popup success'><i class='icon-ok'></i> Import successful!</div>");
        $(".message-popup").fadeIn(300);
        setTimeout (function () {
            $(".message-popup").fadeOut(1000, function () {
                $(this).remove();
                self.emit('reset');
            });
        }, 1000);
    });
}

function getSelectedTemplate (templateId) {

    var self = this;

    for (var templateId in self.templates) {
        if (!self.templates.hasOwnProperty(templateId)) continue;

        if (templateId === templateId) {
            return self.templates[templateId];
        }
    }

    return undefined;
}

// Set template fields to DOM if page is rendered. Otherwise, it does not render templates options again.
function refreshFields () {
    var self = this;

    if (!self.template) {
        return;
    }
    
    // TODO Move to config
    var templateSel    = '.field-template',
        nameSel        = '.field-name',
        fieldSelectSel = '.field-select';

    // set template
    var $template = self.$.fieldTemplate;
    var fieldsToAdd = [];

    // show mapping fields
    $('.mapping-fields').show();

    // reorder the fields
    var fields = [];
    var schema = self.template.schema;

    // get the schema fields with keys and computed labels
    for (var key in schema) {
        if (!schema.hasOwnProperty(key)) continue;

        // ignore core fields and link fields
        if (key[0] === '_' || schema[key].link) continue;

        // clone the schema field to avoid changes in the referenced object
        var field = JSON.parse(JSON.stringify(schema[key]));

        // label (i18n) if available, else key
        var label = field.label || key;
        if (typeof label === 'object') {
            label = label[M.getLocale()] || key;
        }

        field.key = key;
        field.label = label;

        fields.push(field);
    }

    // sort the fields
    fields.sort(function(f1, f2) {
        if (f1.order < f2.order) {
            return -1;
        } else if (f1.order > f2.order) {
            return 1;
        } else {
            return f1.label <= f2.label ? -1 : 1;
        }
    });

    // add the fields
    for (var i = 0; i < fields.length; ++i) {

        // clone DOM template
        // TODO possible error due to substring
        var $field = $template.clone().removeClass(templateSel.substring(1));

        // set the label
        $field.find(nameSel).text(fields[i].label);

        // append options
        if (self.$.fieldOptions) 
            $(fieldSelectSel, $field).append(self.$.fieldOptions.clone()).attr('name', fields[i].key);

        if (fields[i].type === 'number') {
            $('.operator', $field).removeClass('hide');
        } else {
            $('.operator', $field).addClass('hide');
        }

        // push field into array
        fieldsToAdd.push($field);
    }

    // empty all fields
    self.$.fields.empty()
        // and append the new fields
        .append(fieldsToAdd);
};

function appendFile (file) {
    var self = this;

    var $file = self.$.file.clone();
    var ps = self.config.import.ui.selectors.inboxFilePath;
    var path = file.path;

    $file.find(ps).html(file.path);
    $file.on('click', self.config.import.ui.selectors.inboxFileImport, function() {
        // save path in colums data
        self.columsData.path = $(this).parents(self.config.import.ui.selectors.file).find(ps).text();
        // and show mappings
        self.emit('_showMappings');
    });
    $file.on('click', self.config.import.ui.selectors.inboxFileDelete, function() {
        var $thisFile = $(this).parents(self.config.import.ui.selectors.file);
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
    $file.on('click', self.config.import.ui.selectors.inboxFileDownload, function () {
        self.emit('_download', path);
    });
    // add the new file to the dom
    self.$.files.append($file);
}

function setTemplates () {
    var self = this;

    var selectElem = self.config.import.ui.selectors.template;
    var $options = $('<div>');

    for (var templateId in self.templates) {
        if (!self.templates.hasOwnProperty(templateId)) continue;

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

function download (path) {

    // get the module
    var self = this;

    // create a form
    var $form = $("<form>").attr({
        "action": "/@/" + self.miid + "/download",
        "method": "POST"
    });

    // append some inputs
    $form.append($("<input>").val(path).attr("name", "path"));

    // submit the form
    $form.submit();

}

function showMappings (callback) {
    var self = this;

    callback = callback || function () {};
    // start a waiter
    self.emit('_startWaiting');

    var $pathLabel = self.$.pages.mapping.find(self.config.import.ui.selectors.mappingPath);
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
            ',': 'COMMA',
            ';': 'SEMICOLON',
            '\t': 'TAB',
            ' ': 'SPACE'
        };

        // set separator
        columns.separator = separators[columns.separator];

        // update options in UI
        for (var op in columns) {
            $('[data-option="' + op + '"]', self.dom).val(columns[op]);
        }

        self.columns = columns;

        // remove all the files
        self.$.fields.empty();

        // build the options to be cloned later
        var $options = $('<div>');
        var firstLine = self.columns.lines[0];

        for (var j = 0; j < firstLine.length; ++j) {
            // build a new jQuery option element
            var $option = $('<option>');
            // and set its value to the field key
            $option.attr('value', j);
            // and the label
            $option.text('Column ' + (j + 1) + (firstLine[j] ? ' (' + firstLine[j] + ')' : ''));
            // and finally, push it
            $options.append($option);
        }

        self.$.fieldOptions = $options.children();

        callback(err);
    });
}

function refreshTable () {
    var self = this;
    var data = [];

    if (!jQuery.isEmptyObject(self.mappings) && self.template) {
        var lineTemplate = {};

        var lines = self.columns.lines || [];

        // if headers, ignore first line
        // TODO add the headers option linked to the headers checkbox
        for (var i = (self.headers ? 1 : 0); i < lines.length; ++i) {
            var dataLine = {};
            for (var fieldKey in self.mappings) {
                if (!self.mappings.hasOwnProperty(fieldKey)) continue;

                // we must buid real object now not a flat one
                var splits = fieldKey.split('.');
                var curObj = dataLine;
                var j = 0;
                for (; j < splits.length - 1; ++j) {
                    curObj[splits[j]] = curObj[splits[j]] || {};
                    curObj = curObj[splits[j]];
                }
                curObj[splits[j]] = self.columns.lines[i][self.mappings[fieldKey]];
            }

            // push the object to the result set
            data.push(dataLine);
        }
    }

    if (data) {
        self.emit('result', null, data);
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

    // remove the template selection
    $(self.config.import.ui.selectors.template, self.dom).val(null);

    // hide mapping fields
    $('.mapping-fields').hide();

    // remove sample table content
    // TODO Replace with a clear event emit that the table reacts to.
    //      The table should probably have 2 clears:
    //      - clearData
    //      - clearTemplate (which also clears the data)
    //      Here we will call then clearTemplate
    $('.sample-table', self.dom).find('tbody, thead').empty();

    // colums data is cleaned up
    self.columsData = {};

    self.$.pages['mapping'].hide();
    self.$.pages['inbox'].show();

    // empty the fields
    self.$.fields.empty();

    // remove the last getColumns select options
    self.$.options = $();
}

function gatherInfo () {
    var self = this;
    var info = {};
    var schema = self.template.schema;
    
    info.path = self.columsData.path;
    info.template = $(self.config.import.ui.selectors.template).val();
    info.separator = self.columns.separator;
    info.charset = $("[data-option=charset]").val();
    info.headers = self.headers;
    info.update = $("[name=operation]:checked").val() === "update" ? true : false ;
    info.upsert = $("[name=upsert]:checked").length ? true : false;
    info.key = $("[name=mapping]:checked").closest(".form-group").find("select.field-select").attr("name");
    info.mappings = self.mappings;
    
    // if the update option is selected get the mapping
    if (info.update) {
        
        var updateMappings = {};
        var fields = $(".field-select");
        for (var i = 0, l = fields.length; i < l; ++ i) {
            
            var fieldVal = $(fields[i]).val();
            
            if (fieldVal) {
                
                var templateKey = $(fields[i]).attr("name");
                
                if (schema[templateKey].type === "number") {
                    var operator = $(fields[i]).closest(".form-group").find("div.operator>select").val();
                    updateMappings[templateKey] = { value: fieldVal, operator: operator};
                } else {
                    updateMappings[templateKey] = { value: fieldVal };
                }
            }
        }
        info.mappings = updateMappings;
    }
    
    return info;
}
    
return module; });