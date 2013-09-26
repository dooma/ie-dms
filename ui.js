M.wrap('github/gabipetrovay/ie-dms/dev/ui.js', function (require, module, exports) {

function get(selector, dom) {
    return selector ? $(selector, dom) : $();
}

module.exports = function () {
    var self = this;

    // process UI config
    self.config.ui.selectors = self.config.ui.selectors || {};

    // the waiter
    self.$.waiter = get(self.config.ui.selectors.waiter, self.dom);
    // the pages
    self.$.pages = {};
    if (self.config.ui.selectors.pages) {
        $(self.config.ui.selectors.pages).each(function() {
            var $page = $(this);
            var id = $page.attr('id') || $page.attr('data-page');
            if (id) {
                self.$.pages[id] = $page;
            }
        });
    }
    // the file template
    self.$.file = get(self.config.ui.selectors.file);
    // the file template
    self.$.files = get(self.config.ui.selectors.files);

    // configure internal events
    self.on('_startWaiting', startWaiting);
    self.on('_endWaiting', endWaiting);

    // configure external events
    self.on('readInbox', readInbox);

    // ******************************************

    // read the inbox
    self.emit('readInbox');
}

function readInbox () {
    var self = this;

    // start a waiter
    self.emit('_startWaiting');

    self.link('readInbox', function(err, files) {

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

        // start a waiter
        self.emit('_startWaiting');
    });
}

function appendFile(file) {
    var self = this;

    var $file = self.$.file.clone();
    self.$.files.append(file);
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

return module; });
