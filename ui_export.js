M.wrap('github/gabipetrovay/ie-dms/dev/ui_export.js', function (require, module, exports) {

module.exports = function () {
    var self = this;
    
    // processing export global config
    self['export'] = self['export'] || {};
    
    // processing UI config
    self.config['export'].ui.selectors = self.config['export'].ui.selectors || {};
    self.config['export'].ui.selectors.hideUi = self.config['export'].ui.selectors.hideUi || ".close";
    self.config['export'].ui.selectors.target = self.config['export'].ui.selectors.target || "#export";
    self.config['export'].ui.selectors.exportList = self.config['export'].ui.selectors.exportList || "#export-items";
    self.config['export'].ui.selectors.otherList = self.config['export'].ui.selectors.otherList || "#other-items";
    self.config['export'].ui.selectors.listsClass = self.config['export'].ui.selectors.listsClass || ".export-lists";
    self.config['export'].ui.selectors.listItem = self.config['export'].ui.selectors.listItem || ".item-template";
    self.config['export'].ui.selectors.listTemplate = self.config['export'].ui.selectors.listTemplate || ".field-template";
    self.config['export'].ui.selectors.listSeparator = self.config['export'].ui.selectors.listSeparator || ".item-separator";
    self.config['export'].ui.selectors.filename = self.config['export'].ui.selectors.filename || "#filename";
    self.config['export'].ui.selectors.headers = self.config['export'].ui.selectors.headers || "#headers";
    self.config['export'].ui.selectors.email = self.config['export'].ui.selectors.email || "#email";
    self.config['export'].ui.selectors.separator = self.config['export'].ui.selectors.separator || "#separator";
    
    // configure internal events
    
    // configure external events
    self.on('reset', reset);
    self.on('showUi', showUi);
    self.on('hideUi', hideUi);
    self.on('setExportFields', setFields);
    
    // configure UI
    initUi.call(self);
}

function initUi () {
    var self = this;
    
    // hide UI config
    $(document).on("click", self.config['export'].ui.selectors.hideUi, function () {
        hideUi.call(self);
    });
    
    // sortable lists
    $(self.config['export'].ui.selectors.exportList + ", " + self.config['export'].ui.selectors.otherList).sortable({
        connectWith: self.config['export'].ui.selectors.listsClass,
        stop: function(event, ui) {
            updateFields.call(self);
        }
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
            "TAB": "tab",
            "SPACE": "space"
        };
        var mySeparator = $(this).val();
        $(".item-separator").html(separators[mySeparator]);
        self['export'].separator = mySeparator;
    });
    
    // headers checkbox
    $(self.config['export'].ui.selectors.headers).change(function () {
        if ($(this).is(":checked")) {
            self['export'].headers = true;
        } else {
            self['export'].headers = false;
        }
    });
    
    // email checkbox
    $(self.config['export'].ui.selectors.email).change(function () {
        if ($(this).is(":checked")) {
            self['export'].email = true;
        } else {
            self['export'].email = false;
        }
    });
    
    // filename change
    $(self.config['export'].ui.selectors.filename).keyup(function () {
        self['export'].filename = $(this).val();
    });
}
    
function showUi () {
    var self = this;
    $(self.config['export'].ui.selectors.target).fadeIn(100);
}
    
function hideUi () {
    var self = this;
    $(self.config['export'].ui.selectors.target).fadeOut(100);    
}

function updateFields () {
    var self = this;

    self['export'].columns = [];
    
    var lis = $(self.config['export'].ui.selectors.exportList + ">li");
    
    for(var i = 1, l = lis.length; i < l; ++ i) {
        var field = $(lis[i]).attr("data-field");
        self['export'].columns.push(field);
    }
}

function reset () {
    var self = this;
    
    // reseting form
    $(self.config['export'].ui.selectors.filename).val("");
    $(self.config['export'].ui.selectors.headers).prop('checked', false);
    $(self.config['export'].ui.selectors.email).prop('checked', false);
    $(self.config['export'].ui.selectors.separator).val("COMMA");
    $(self.config['export'].ui.selectors.listSeparator).html(",");
    
    // reset export config
    self['export'].columns = [];
    self['export'].separator = "COMMA";
    self['export'].headers = false;
    self['export'].email = false;
    
    // reseting list UI
    var fieldTemplateExport = $(self.config['export'].ui.selectors.exportList + " " + self.config['export'].ui.selectors.listTemplate).clone();

    $(self.config['export'].ui.selectors.exportList).html("");
    $(self.config['export'].ui.selectors.exportList).append(fieldTemplateExport);
    
    var fieldTemplateOther = $(self.config['export'].ui.selectors.otherList + " " + self.config['export'].ui.selectors.listTemplate).clone();
    
    $(self.config['export'].ui.selectors.otherList).html("");
    $(self.config['export'].ui.selectors.otherList).append(fieldTemplateOther);
}
    
function setFields (template) {
    var self = this;
    self['export'].template = template;
    var tableFields = [];
    var otherFields = [];
    
    // reseting UI
    reset.call(self);
    
    // TODO handle undefined variable
    
    for (var field in template.schema) {
        
        if (!template.schema.hasOwnProperty(field)) continue;
        
        // Skip keys that begin with "_"
        if (field.toString().charAt(0) === "_") continue;
        
        if ("hidden" in template.schema[field] && template.schema[field].hidden) {
            var myField = {};
            if ("label" in template.schema[field]) {
                if (typeof template.schema[field].label === "object") {
                    myField.label = template.schema[field].label[M.getLocale()];
                    myField.field = field;
                } else {
                    myField.label = template.schema[field].label;
                    myField.field = field;
                }
            } else {
                myField.label = field;
                myField.field = field;
            }
            otherFields.push(myField);
        } else {
            var myField = {};
            if ("label" in template.schema[field]) {
                if (typeof template.schema[field].label === "object") {
                    myField.label = template.schema[field].label[M.getLocale()];
                    myField.field = field;
                } else {
                    myField.label = template.schema[field].label;
                    myField.field = field;
                }
            } else {
                myField.label = field;
                myField.field = field;
            }
            tableFields.push(myField);
        }
    }

    // update export UI
    var exportFieldTemplate = $(self.config['export'].ui.selectors.exportList + " " +  self.config['export'].ui.selectors.listTemplate);
    var otherFieldTemplate = $(self.config['export'].ui.selectors.otherList + " " + self.config['export'].ui.selectors.listTemplate);
    
    for(var i = 0, l = tableFields.length; i < l; ++ i) {
        var myField = exportFieldTemplate.clone();
        myField.removeClass("hided").removeClass("field-template").attr("data-field", tableFields[i].field);
        myField.find(self.config['export'].ui.selectors.listItem).html(tableFields[i].label);
        $(self.config['export'].ui.selectors.exportList).append(myField);
    }
    for(var i = 0, l = otherFields.length; i < l; ++ i) {
        var myField = otherFieldTemplate.clone();
        myField.removeClass("hided").removeClass("field-template").attr("data-field", otherFields[i].field);
        myField.find(self.config['export'].ui.selectors.listItem).html(otherFields[i].label);
        $(self.config['export'].ui.selectors.otherList).append(myField);
    }
    
    // get columns
    updateFields.call(self);
}

return module; });
    