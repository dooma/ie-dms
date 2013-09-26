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

    $(self.dom).on('click', self.config.ui.selectors.mappingBack, function() {
        self.emit('reset');
    });

    // configure internal events
    self.on('_startWaiting', startWaiting);
    self.on('_endWaiting', endWaiting);
    self.on('_deleteFile', deleteFile);
    self.on('_showMappings', showMappings);

    // configure external events
    self.on('readInbox', readInbox);
    self.on('reset', reset);

    // ******************************************

    // read the inbox
    self.emit('readInbox');
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

function deleteFile (path, callback) {
    var self = this;
    self.link('deleteFile', { data: path }, callback);
}

function showMappings (path, callback) {
    var self = this;

    // start a waiter
    self.emit('_startWaiting');

    self.$.pages.mapping.find(self.config.ui.selectors.mappingPath).text(path);

    self.link('getColumns', { data: { path: path } }, function(err, mappings) {

        // end the waiter
        self.emit('_endWaiting', 'mapping');

        if (err) {
            alert(err);
            return;
        }

        self.mappings = mappings;

        // remove all the files
        self.$.fields.empty();

        // TODO populate the fields from the self.template (set when the template select is changed) and from self.mappings
        // always reset the fields when a template is changed
    });
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
