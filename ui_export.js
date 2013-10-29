M.wrap('github/gabipetrovay/ie-dms/dev/ui_export.js', function (require, module, exports) {

module.exports = function () {
    var self = this;
    
    // processing UI config
    self.config.export.ui.selectors = self.config.export.ui.selectors || {};
    self.config.export.ui.selectors.hideUi = self.config.export.ui.selectors.hideUi || ".close";
    self.config.export.ui.selectors.target = self.config.export.ui.selectors.target || "#export";
    self.config.export.ui.selectors.exportList = self.config.export.ui.selectors.exportList || "#export-items";
    self.config.export.ui.selectors.otherList = self.config.export.ui.selectors.otherList || "#other-items";
    self.config.export.ui.selectors.listsClass = self.config.export.ui.selectors.listsClass || ".export-lists";
    self.config.export.ui.selectors.listItem = self.config.export.ui.selectors.listItem || ".item-template";
    self.config.export.ui.selectors.filename = self.config.export.ui.selectors.filename || "#filename";
    self.config.export.ui.selectors.headers = self.config.export.ui.selectors.headers || "#headers";
    self.config.export.ui.selectors.email = self.config.export.ui.selectors.email || "#email";
    self.config.export.ui.selectors.separator = self.config.export.ui.selectors.separator || "#separator";
    
    // configure internal events
    
    // configure external events
    self.on('reset', reset);
    self.on('showUi', showUi);
    self.on('setExportFields', setFields);
    
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
    var self = this;
    
    $(self.config.export.ui.selectors.filename).val("");
    $(self.config.export.ui.selectors.headers).prop('checked', false);
    $(self.config.export.ui.selectors.email).prop('checked', false);
    $(self.config.export.ui.selectors.separator).val("COMMA");
    
    // TODO empty the lists
}
    
function setFields (template) {
    var self = this;
    var tableFields = [];
    var otherFields = [];
    
    // reseting UI
    
    reset.call(self);
    
    // TODO handle undefined variable
    
    for(var field in template.schema) {
        // Skip keys that begin with "_"
        if (!template.schema.hasOwnProperty(field)) continue;
        if (field.toString().charAt(0) === "_") continue;
        if ("hidden" in template.schema[field] && template.schema[field].hidden) {
            if (typeof template.schema[field].label === "object")
                otherFields.push(template.schema[field].label[M.getLocale()]);
        } else {
            if (typeof template.schema[field].label === "object")
                tableFields.push(template.schema[field].label[M.getLocale()]);
        }
    }
    
    // update export UI
    for(var i = 0, l = tableFields.length; i < l; ++ i) {
        var myField = $(self.config.export.ui.selectors.exportList + ">li:first").clone();
        myField.find(self.config.export.ui.selectors.listItem).html(tableFields[i]);
        $(self.config.export.ui.selectors.exportList).append(myField);
    }
    for(var i = 0, l = otherFields.length; i < l; ++ i) {
        var myField = $(self.config.export.ui.selectors.otherList + ">li:first").clone();
        myField.find(self.config.export.ui.selectors.listItem).html(otherFields[i]);
        $(self.config.export.ui.selectors.otherList).append(myField);
    } 
    $(self.config.export.ui.selectors.exportList + ">li:first-child").hide();
    $(self.config.export.ui.selectors.otherList + ">li:first-child").hide();
}

return module; });
    