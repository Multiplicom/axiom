//Configuration of require.js
require.config({
  baseUrl: "lib",
  paths: {
    AXM: "axiom"
  }
});

var ctr = 0;

define(function(require) {
  var AXM = require("AXM");

  var theApp = AXM.Application.get();

  var Frame = AXM.Panels.Frame;
  var Controls = AXM.Controls;
  var FlexTabber = AXM.Panels.FlexTabber;

  var form1 = AXM.Panels.PanelForm.create("p1");
  var rootFrame = Frame.FrameFinal(form1);

  theApp.setRootFrame(rootFrame);

  var inputField = Controls.EditTextItemButton({
    width: 100
  });

  var inputEdit = Controls.Edit({
    width: 100,
    height: 10,
    value: "testjan",
    passWord: false
  });

  var datePicker = Controls.DatePicker({
    width: 100,
    height: 10
  });
  form1.setRootControl(Controls.Compound.StandardMargin(datePicker));

  theApp.init();

  //$("#datepicker").datepicker();
});
