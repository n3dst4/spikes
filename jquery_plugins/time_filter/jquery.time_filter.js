/*
 * jquery.time_filter.js
 * =====================
 * http://bitbucket.org/n3dst4/spikes/
 *
 * Simple time field formatter for jQuery.
 *
 * Usage:
 * ------
 * $(myField).time_filter()
 *
 * Copyright and licence
 * ---------------------
 * Copyright (c) 2009, Neil de Carteret
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of the <organization> nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY NEIL DE CARTERET ''AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL NEIL DE CARTERET BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

jQuery.fn.extend({
    // set a field up to be a filtered time entry field
    time_filter: function() {
        this.change(function() {
            var time_re, matches, hour, minute, ampm;
            // match field contents
            time_re = /^\s*(\d{1,2}?)[ :.]*(\d{2})?\s*([ap]m?)?\s*$/i;
            matches = jQuery(this).val().match(time_re);
            // gibberish
            if (matches === null)
                { return jQuery(this).reset_time(); }
            hour = parseInt(matches[1], 10);
            minute = parseInt(matches[2], 10) || 0;
            ampm = matches[3] || null;
            // pm times
            if (ampm && ampm.slice(0,1).toLowerCase() === "p" && hour < 13)
                { hour = hour + 12; }
            // impossible times
            if (hour >  23 || minute > 59)
                { return jQuery(this).reset_time(); }
            // set field
            return jQuery(this).val((hour<10?"0":"") + hour + ":" +
                                    (minute<10?"0":"") + minute);
        });
        return this;
    },
    // quickly reset a meaningless field to midnight
    reset_time: function() {
           return jQuery(this).val("00:00");
    }
});

