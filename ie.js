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

    // configure the external events
    self.on('reset', reset);
    self.on('setTemplate', setTemplate);
    self.on('setQuery', setQuery);
    self.on('export', startExport);

    // process the UI only if the configuration is present
    if (self.config.ui) {
        ui.call(self);
    }

    // start by getting all the templates
    getTemplates.call(self);
}

function reset () {
    var self = this;

    // common properties
    delete self.template;

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

    self.template = JSON.parse(JSON.stringify(self.templates[templateId]));
}

function setQuery (query, options) {
    var self = this;

    self.query = query;
    self.queryOptions = options;
}

function startExport() {
    var self = this;

    if (!self.query) {
        alert('No data query set for export');
        return;
    }
    if (!self.template) {
        alert('No data template set for export');
        return;
    }

    // TODO generate a token or let the user decide the name of
    //      the export this is necessary for later reference
    
    var columns = [];
    
    for (var field in self.template.schema) {
        
        // Skip keys that begin with "_"
        if (field.toString().charAt(0) === "_") continue;
        
        if (!("hidden" in self.template.schema[field])) {
            columns.push(field);
        }
    }
    
    var templateName = "";
    
    if (typeof self.template.options.label === "object") {
        templateName += self.template.options.label[M.getLocale()];
    } else {
        templateName += self.template.options.label;
    }
    
    if (!templateName) {
        templateName = self.template.name;
    }
    
    var date = new Date().toISOString().replace(/[^\d]/g, '');
    var timestamp = date.substr(0, 8) + '_' + date.substr(8, 4);
    
    var options = {
        data: {
            template: self.template._id,
            query: self.query,
            options: self.queryOptions,
            columns: columns,
            separator: ";",
            filename: "export_" + templateName.toLowerCase().replace(" ", "_") + "_" + timestamp
        }
    }
    
    self.link('export', options, function(err, result) {

        // TODO enhance

        if (err) {
            alert(err);
            return;
        }

        // give it a name
        var templateName;
        if (self.template.options && self.template.options.label) {
            templateName = self.template.options.label;
            if (typeof templateName === 'object') {
                templateName = templateName[M.getLocale()];
            }
        }
        if (!templateName) {
            templateName = self.template.name;
        }

        alert(templateName + ' export started and will be available shortly in the import inbox.');
        return;
    });
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
        return;
    });
}


return module; });
