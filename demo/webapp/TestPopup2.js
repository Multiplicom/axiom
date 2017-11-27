
define([
        "require", "jquery", "_",
        "AXM/AXM"
    ],
    function (
        require, $, _,
        AXM
    ) {

        var Module = {};

        Module.create = function() {
            var Controls = AXM.Controls;

            var window = AXM.Windows.PopupWindow.create({
                title: 'Test popup 2',
                blocking:true,
                autoCenter: true
            });

            var ctrl = require('SampleForm').create();

            window.setRootControl(AXM.Controls.Compound.StandardMargin(ctrl));
            window.start();
        };


        return Module;
    });

