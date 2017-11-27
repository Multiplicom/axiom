
define([
        "require", "jquery", "_",
        "AXM/AXM",
        "TestPopup2"
    ],
    function (
        require, $, _,
        AXM,
        TestPopup2
    ) {

        var Module = {};

        Module.create = function() {
            var Controls = AXM.Controls;
            var Frame = AXM.Panels.Frame;
            var PanelForm = AXM.Panels.PanelForm;

            var rootFrame = Frame.FrameSplitterHor();

            var form1 = PanelForm.create('p1');

            var bt1 = Controls.Button({text:'Test'});
            bt1.addNotificationHandler(function() {
                TestPopup2.create();
            });
            form1.setRootControl(bt1);

            rootFrame.addMember(Frame.FrameFinal(form1)).setTitle('A title 1').setFixedDimSize(Frame.dimX,150);

            var sf1 = rootFrame.addMember(Frame.FrameSplitterVert());
            sf1.addMember(Frame.FrameFinal(PanelForm.create('p2')));
            var sf2=sf1.addMember(Frame.FrameSplitterHor()).setTitle('A title 2');

            sf2.addMember(Frame.FrameFinal(PanelForm.create('p3')));
            sf2.addMember(Frame.FrameFinal(PanelForm.create('p4')));

            rootFrame.addMember(Frame.FrameFinal(PanelForm.create('p6')));

            var window = AXM.Windows.PopupWindow.create({
                title: 'Test popup 1',
                sizeX: 600,
                sizeY: 400,
                canDock: true
            });
            window.setRootFrame(rootFrame);
            window.start();
        };


        return Module;
    });

