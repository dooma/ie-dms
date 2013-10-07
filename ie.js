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

    // process the UI only if the configuration is present
    if (self.config.ui) {
        ui.call(self);
    }

    // start by getting all the templates
    getTemplates.call(self);
}

function reset () {
    var self = this;

    delete self.template;
    delete self.mappings;
    delete self.columns;
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

function getTemplates () {
    var self = this;

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
