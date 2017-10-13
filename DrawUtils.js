//Copyright (c) 2015 Multiplicom NV
//
//Permission is hereby granted, free of charge, to any person obtaining a copy of this software
//and associated documentation files (the "Software"), to deal in the Software without restriction,
//including without limitation the rights to use, copy, modify, merge, publish, distribute,
//sublicense, and/or sell copies of the Software, and to permit persons to whom the Software
//is furnished to do so, subject to the following conditions:
//
//The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
//THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
//INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
//PURPOSE AND NON INFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
//DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
//ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

define([
        "require", "jquery", "_",
        "AXM/Test",
    ],
    function (
        require, $, _,
        Test
    ) {


        /**
         * Module encapsulatinh some tools assisting drawing
         * @type {{Test: *}}
         */
        var Module = {
            Test: Test
        };


        /**
         * Produces a minor/major scale tick set that matches the desired minor jump distance as close as possible
         * @param {float} DesiredJump1 - desired minor tick jump distance
         * @returns {{Jump1 {float} - minor tick jump distance, JumpReduc {int} - number of grouped jumps for a major tick}}
         */
        Module.getScaleJump = function (DesiredJump1) {
            var JumpPrototypes = [{ Jump1: 1, JumpReduc: 5 }, { Jump1: 2, JumpReduc: 5 }, { Jump1: 5, JumpReduc: 4}];
            var mindist = 1.0e99;
            var bestjump;
            for (var JumpPrototypeNr in JumpPrototypes) {
                var q = Math.floor(Math.log(DesiredJump1 / JumpPrototypes[JumpPrototypeNr].Jump1) / Math.log(10));
                var TryJump1A = Math.pow(10, q) * JumpPrototypes[JumpPrototypeNr].Jump1;
                var TryJump1B = Math.pow(10, q + 1) * JumpPrototypes[JumpPrototypeNr].Jump1;
                if (Math.abs(TryJump1A - DesiredJump1) < mindist) {
                    mindist = Math.abs(TryJump1A - DesiredJump1);
                    bestjump = { Jump1: TryJump1A, JumpReduc: JumpPrototypes[JumpPrototypeNr].JumpReduc };
                }
                if (Math.abs(TryJump1B - DesiredJump1) < mindist) {
                    mindist = Math.abs(TryJump1B - DesiredJump1);
                    bestjump = { Jump1: TryJump1B, JumpReduc: JumpPrototypes[JumpPrototypeNr].JumpReduc };
                }
            }
            if (!bestjump)
                return -1;

            var frcdigits = -(Math.log(bestjump.Jump1 * bestjump.JumpReduc) / Math.log(10.0));
            bestjump.textDecimalCount = Math.max(0, Math.ceil(frcdigits));

            bestjump.value2String = function(val) {
                if ( (Math.abs(val)>=100000) ) {
                    return val.toExponential();
                }
                else
                    return val.toFixed(this.textDecimalCount);
            };

            return bestjump;
        };


        return Module;
    });









