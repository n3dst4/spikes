/*
 * Simple time field formatter for jQuery
 * 
 * Call $(myField).time_filter() to turn myField into a formatted
 * time entry box.
 */
jQuery.fn.extend({
    // set a field up to be a filtered time entry field
    time_filter: function() {
        jQuery(this).change(function() {
            var time_re, matches, hour, minute, ampm;
            // match field contents
            time_re = /^\s*(\d{1,2}?)[ :.]*(\d{2})?\s*([ap]m?)?\s*$/i;
            matches = jQuery(this).val().match(time_re);
            // gibberish
            if (matches === null) 
                { return jQuery(this).default_time(); }
            hour = parseInt(matches[1], 10);
            minute = parseInt(matches[2], 10) || 0;
            ampm = matches[3] || null;
            // pm times
            if (ampm && ampm.slice(0,1).toLowerCase() === "p" && hour < 13)
                { hour = hour + 12; }
            // impossible times
            if (hour >  23 || minute > 59)
                { return jQuery(this).default_time(); }
            // set field
            return jQuery(this).val((hour<10?"0":"") + hour + ":" + 
                                    (minute<10?"0":"") + minute);
        });
    },
    // quickly reset a meaningless field to midnight
    default_time: function() {
           return jQuery(this).val("00:00");
    }
});

