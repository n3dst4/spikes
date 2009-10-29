/*
 * stopwatch.js
 * ============
 * http://bitbucket.org/n3dst4/spikes/
 *
 * Lightweight stopwatch for ad-hoc timings in JS.
 *
 * Usage:
 * ------
 * stopwatch.start(label);  // start timing label
 * stopwatch.stop(label);   // stop timing label
 * stopwatch.report();      // return a string showing timed labels
 * stopwatch.reset();       // clear all labels
 *
 * Example:
 * --------
 * stopwatch.start("Long difficult task");
 * stopwatch.start("Particular subtask");
 * stopwatch.sop("Particular subtask");
 * stopwatch.stop("Long difficult task");
 * alert(stopwatch.report());
 *
 * Notes
 * -----
 * You can start() and stop() any number of labels. They are all tracked
 * independently.
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
 * DISCLAIMED. IN NO EVENT SHALL <copyright holder> BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

stopwatch = {
    _times: {},
    start: function(label) {
        if (typeof this._times[label] === "undefined")
            this._times[label] = [null, null];
        this._times[label][0] = new Date().getTime();
    },
    stop: function(label) {
        this._times[label][1] += (new Date().getTime() - this._times[label][0]);
        this._times[label][0] = null;
    },
    report: function() {
        var rep;
        for (var i in this._times)
            rep += i + ": " + this._times[i][1] + "\n";
        return rep;
    },
    reset: function() {
        this._times = {};
    }
};
