M.wrap('github/gabipetrovay/ie-dms/dev/ie.js', function (require, module, exports) {

var ui_export = require('./ui_export');
var ui_import = require('./ui_import');
var Bind = require('github/jillix/bind');
var Events = require('github/jillix/events');

module.exports = function (config) {

    var self = this;
    self['import'] = self['import'] || {};
    self.config = config;
    self.inbox = [];
    self.$ = {};
    self.config.binds = self.config.binds || [];

    Events.call(self, config);

    // configure the external events
    self.on('reset', reset);
    self.on('setTemplate', setTemplate);
    self.on('setQuery', setQuery);
    self.on('export', startExport);

    // process the export UI only if the configuration is present
    if (self.config['export'] && self.config['export'].ui) {
        ui_export.call(self);
        
        // run the binds
        for (var i = 0; i < self.config.binds.length; ++i) {
            Bind.call(self, self.config.binds[i]);
        } 
    }
    
    // process the import UI only if the configuration is present
    if (self.config.import && self.config.import.ui) {
        ui_import.call(self);
        
        // run the binds
        for (var i = 0; i < self.config.binds.length; ++i) {
            Bind.call(self, self.config.binds[i]);
        } 
    }

    // start by getting all the templates
    getTemplates.call(self);
}

function reset () {
    var self = this;

    // common properties
    delete self['import'].template;

    // import properties
    delete self.mappings;
    delete self.columns;

    // export properties
    delete self.query;

    // TODO when what else
}

function setTemplate (templateId) {
    var self = this;

    if (!templateId) {
        self.emit('reset');
        return;
    }

    self['import'].template = JSON.parse(JSON.stringify(self.templates[templateId]));
}

function setQuery (query, options) {
    var self = this;

    self.query = query;
    self.queryOptions = options;
}

function startExport() {
    var self = this;
    
    self['export'] = self['export'] || {};
    
    if (!self.query) {
        alert('No data query set for export');
        return;
    }
    if (!self['export'].template) {
        alert('No data template set for export');
        return;
    }

    // TODO generate a token or let the user decide the name of
    //      the export this is necessary for later reference
    
    var columns = [];
    
    if (self['export'].columns) {
        columns = self['export'].columns;
    } else {
        for (var field in self['export'].template.schema) {
            
            if (!self['export'].template.schema.hasOwnProperty(field)) continue;
            
            // Skip keys that begin with "_"
            if (field.toString().charAt(0) === "_") continue;
            
            if (!("hidden" in self['export'].template.schema[field])) {
                columns.push(field);
            }
        }
    }
    
    // get the labels for the columns
    
    var labels = {};
    
    for (var i = 0, l = columns.length; i < l; ++ i) {
        
        if ("label" in self['export'].template.schema[columns[i]]) {
            if (typeof self['export'].template.schema[columns[i]].label === "object") {
                labels[columns[i]] = self['export'].template.schema[columns[i]].label[M.getLocale()];
            } else {
                labels[columns[i]] = self['export'].template.schema[columns[i]].label;
            }
        } else {
            labels[columns[i]] = columns[i];
        }
    }
    
    var templateName = "";
    
    if (typeof self['export'].template.options.label === "object") {
        templateName += self['export'].template.options.label[M.getLocale()];
    } else {
        templateName += self['export'].template.options.label;
    }
    
    if (!templateName) {
        templateName = self['export'].template.name;
    }
    
    var date = new Date().toISOString().replace(/[^\d]/g, '');
    var timestamp = date.substr(0, 8) + '_' + date.substr(8, 4);
    
    var separators = {
        "COMMA": ",",
        "SEMICOLON": ";",
        "TAB": "\t",
        "SPACE": " "
    };
    
    var options = {
        data: {
            template: self['export'].template._id,
            query: self.query,
            options: self.queryOptions,
            hasHeaders: self['export'].headers || false,
            columns: columns,
            labels: labels,
            separator: separators[self['export'].separator]  || ";",
            filename: self['export'].filename || "export_" + templateName.toLowerCase().replace(" ", "_") + "_" + timestamp
        }
    }
    
    self.link('export', options, function(err) {

        // give it a name
        var templateName;
        if (self['export'].template.options && self['export'].template.options.label) {
            templateName = self['export'].template.options.label;
            if (typeof templateName === 'object') {
                templateName = templateName[M.getLocale()];
            }
        }
        if (!templateName) {
            templateName = self['export'].template.name;
        }
        
        self.emit('notifications.show', {
            type: err ? 'error' : 'info',
            message: err ? err.error || err : (templateName + ' export started and will be available shortly in the import inbox.')
        });
    });
    
    // hiding the UI
    self.emit('hideUi');
}

function getTemplates () {
    var self = this;

    var query = {};
    var options = {
        fields: {
            _id: 1,
            'options.label': 1
        }
    };

    var crudObj = {
        t: '000000000000000000000000',
        q: query,
        o: options,
        noMerge: true
    };

    // get all template ids
    self.emit('find', crudObj, function (err, data) {

        // handle error
        if (err) {
            console.error(err);
            return;
        }

        // an array with template ids
        self.templates = {};
        for (var i = 0; i < data.length; ++i) {
            if (data[i]._id === '000000000000000000000004') {
                continue;
            }
            self.templates[data[i]._id] = data[i];
        }

        // and emit some events
        self.emit('_setTemplates');
        self.emit('ready');
        return;
    });
}


return module; });
