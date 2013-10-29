M.wrap('github/gabipetrovay/ie-dms/dev/ui_export.js', function (require, module, exports) {

module.exports = function () {
    var self = this;
    
    // processing UI config
    self.config.export.ui.selectors = self.config.export.ui.selectors || {};
    self.config.export.ui.selectors.hideUi = self.config.export.ui.selectors.hideUi || ".close";
    self.config.export.ui.selectors.target = self.config.export.ui.selectors.target || "#export";
    self.config.export.ui.selectors.exportList = self.config.export.ui.selectors.exportList || "#export-items";
    self.config.export.ui.selectors.otherList = self.config.export.ui.selectors.exportList || "#other-items";
    self.config.export.ui.selectors.listsClass = self.config.export.ui.selectors.listsClass || ".export-lists";
    
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
    
    // sortable lists
    $(self.config.export.ui.selectors.exportList + ", " + self.config.export.ui.selectors.otherList).sortable({
        connectWith: self.config.export.ui.selectors.listsClass
    }).disableSelection();
    
    // add more fields button
    $(".add-items").click(function () {
        $(".other-fields-wrapper").slideDown(400);
    });
    
    $(".cancel-add").click(function () {
        $(".other-fields-wrapper").slideUp(400);
    });
    
    // separator change
    $("#separator").change(function () {
        var separators = {
            "COMMA": ",",
            "SEMICOLON": ";",
            "TAB": "T",
            "SPACE": "S"
        };
        var mySeparator = $(this).val();
        $(".item-separator").html(separators[mySeparator]);
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
    