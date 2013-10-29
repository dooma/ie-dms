M.wrap('github/gabipetrovay/ie-dms/dev/ui_export.js', function (require, module, exports) {

module.exports = function () {
    var self = this;
    
    // processing UI config
    self.config.export.ui.selectors = self.config.export.ui.selectors || {};
    self.config.export.ui.selectors.hideUi = self.config.export.ui.selectors.hideUi || ".close";
    self.config.export.ui.selectors.target = self.config.export.ui.selectors.target || "#export";
    
    // configure internal events
    
    // configure external events
    self.on('reset', reset);
    self.on('showUi', showUi);
    
    // configure UI
    initUi.call(self);
}

function initUi () {
    var self = this;
    
    // hide UI config
    $(document).on("click", self.config.export.ui.selectors.hideUi, function () {
        $(self.config.export.ui.selectors.target).fadeOut(100);
    });
}
    
function showUi () {
    var self = this;
    $(self.config.export.ui.selectors.target).fadeIn(100);
}

function reset () {
    // TODO export reset stuff
}

return module; });
    