M.wrap('github/gabipetrovay/ie-dms/dev/ui_export.js', function (require, module, exports) {

module.exports = function () {
    var self = this;
    
    // processing UI config
    self.config.export.ui.selectors = self.config.export.ui.selectors || {};
    
    // configure internal events
    
    // configure external events
    self.on('reset', reset);
}

function reset () {
    // TODO export reset stuff
}

return module; });
    