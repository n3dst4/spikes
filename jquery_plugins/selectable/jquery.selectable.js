

/*globals jQuery*/

(function(){
    var falsey = function () { return false; };
    $.fn.selectable = function(change) {
        // no argument - return status (defaults to true)
        if (change === undefined) {
            return this.data("selectable")===undefined?
                true:
                this.data("selectable");
        }
        // make it selectable
        if (change === true) {
            if ($.browser.mozilla) { //FF
                this.each(function(){
                    var e = $(this);
                    e.css('MozUserSelect', e.data('original_moz_user_select'));
                });
            }
            else if ($.browser.msie) { // MSIE
                this.unbind('selectstart', falsey);
            }
            else { // Opera, Chrome etc.
                this.unbind('MouseDown', falsey);
            }
        }
        else if (change === false) {
            if ($.browser.mozilla) { // FF
                this.each(function(){
                    var e = $(this);
                    e.data('original_moz_user_select', e.css('MozUserSelect'));
                });
                this.css('MozUserSelect', 'none');
            }
            else if ($.browser.msie) { // MSIE
                this.bind('selectstart', falsey);
            }
            else { // Opera, Chrome etc.
                this.bind('MouseDown', falsey);
            }
        }
        this.data('selectable', change);
        return this;
    };
})(jQuery);
