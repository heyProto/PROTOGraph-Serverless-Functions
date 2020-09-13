var system = require('system');
var page = require('webpage').create();


page.settings.userAgent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36';
page.settings.webSecurityEnabled = false;

page.onError = function(msg, trace) {
  var msgStack = ['\nERROR: ' + msg];
  if (trace && trace.length) {
    msgStack.push('TRACE:');
    trace.forEach(function(t) {
      msgStack.push(' -> ' + t.file + ': ' + t.line + (t.function ? ' (in function "' + t.function +'")' : ''));
    });
  }
  system.stdout.write(msgStack.join('\n'));
  phantom.exit();
};

page.onResourceError = function(resourceError) {
  system.stdout.write('Unable to load resource (#' + resourceError.id + ' URL:' + resourceError.url + ')');
  system.stdout.write('Error code: ' + resourceError.errorCode + '. Description: ' + resourceError.errorString);
};
page.onResourceTimeout = function(request) {
  system.stdout.write('Response Timeout (#' + request.id + '): ' + JSON.stringify(request));
};

page.onConsoleMessage = function(msg, lineNum, sourceId) {
  system.stdout.write('\nCONSOLE: ' + msg + ' (from line #' + lineNum + ' in "' + sourceId + '")');
};

system.stdout.write(system.args[1]+"\n");
system.stdout.write(system.args[2]+"\n");
system.stdout.write(system.args[3]+"\n");
system.stdout.write(system.args[4]+"\n");
system.stdout.write(system.args[5]+"\n");
system.stdout.write(system.args[6]+"\n");
system.stdout.write(system.args[7]+"\n");
system.stdout.write(system.args[8]+"\n");
system.stdout.write(system.args[9]+"\n");


var s = system.args;


page.open(system.args[1], function(k) {
  system.stdout.write('\n PAGE OPEN \n', k);


  page.includeJs(system.args[2], function() {
    //system.stdout.write(s[3]+"\n");

    page.evaluate(function(s) {

      var css_script = document.createElement('link'),
        height_diff = 0;
      css_script.rel = 'stylesheet';
      css_script.href = s[3];
      document.head.appendChild(css_script);


      if(s[8] == "ProtoGraph.Card.toExplain")
        {
          var x = new ProtoGraph.Card.toExplain();
          x.init({
            selector: document.querySelector('#explainer-div'),
            data_url: s[4],
            schema_url: s[5],
            configuration_url: s[6],
            configuration_schema_url: s[7]
          })
        }
      else if(s[8] == "ProtoGraph.Card.toSocial")
        {
          var x = new ProtoGraph.Card.toSocial();
          x.init({
            selector: document.querySelector('#explainer-div'),
            data_url: JSON.parse(s[4]),
            schema_url: s[5]
          })
          height_diff = 5;
        } else if (s[8] == "ProtoGraph.Card.toReportViolence"){
          var x = new ProtoGraph.Card.toReportViolence();
          x.init({
            selector: document.querySelector('#explainer-div'),
            data_url: s[4],
            schema_url: s[5],
            configuration_url: s[6],
            configuration_schema_url: s[7]
          })
        } else if (s[8] == "ProtoGraph.Card.toQuiz"){
          var x = new ProtoGraph.Card.toQuiz();
          x.init({
            selector: document.querySelector('#explainer-div'),
            data_url: s[4],
            schema_url: s[5],
            configuration_url: s[6],
            configuration_schema_url: s[7]
          })
        } else if (s[8] == "ProtoGraph.Card.toTimeline"){
          var x = new ProtoGraph.Card.toTimeline();
          x.init({
            selector: document.querySelector('#explainer-div'),
            data_url: s[4],
            schema_url: s[5],
            configuration_url: s[6],
            configuration_schema_url: s[7]
          })
        } else if (s[8] == "ProtoGraph.Card.toLink"){
          var x = new ProtoGraph.Card.toLink();
          x.init({
            selector: document.querySelector('#explainer-div'),
            data_url: s[4],
            schema_url: s[5],
            configuration_url: s[6],
            configuration_schema_url: s[7]
          })
        } else if (s[8] == "ProtoGraph.Card.toReportJournalistKilling"){
          var x = new ProtoGraph.Card.toReportJournalistKilling();
          x.init({
            selector: document.querySelector('#explainer-div'),
            data_url: s[4],
            schema_url: s[5],
            configuration_url: s[6],
            configuration_schema_url: s[7]
          })
        } else if (s[8] == "ProtoGraph.Card.toDistrictProfile"){
          var x = new ProtoGraph.Card.toDistrictProfile();
          x.init({
            selector: document.querySelector('#explainer-div'),
            data_url: s[4],
            schema_url: s[5],
            configuration_url: s[6],
            configuration_schema_url: s[7]
          })
        } else if (s[8] == "ProtoGraph.Card.toRainfall"){
          var x = new ProtoGraph.Card.toRainfall();
          x.init({
            selector: document.querySelector('#explainer-div'),
            data_url: s[4],
            schema_url: s[5],
            configuration_url: s[6],
            configuration_schema_url: s[7]
          })
        } else if (s[8] == "ProtoGraph.Card.toPoliticalLeadership"){
          var x = new ProtoGraph.Card.toPoliticalLeadership();
          x.init({
            selector: document.querySelector('#explainer-div'),
            data_url: s[4],
            schema_url: s[5],
            configuration_url: s[6],
            configuration_schema_url: s[7]
          })
        } else if (s[8] == "ProtoGraph.Card.toLandUse"){
          var x = new ProtoGraph.Card.toLandUse();
          x.init({
            selector: document.querySelector('#explainer-div'),
            data_url: s[4],
            schema_url: s[5],
            configuration_url: s[6],
            configuration_schema_url: s[7]
          })
        } else if (s[8] == "ProtoGraph.Card.toWaterExploitation"){
          var x = new ProtoGraph.Card.toWaterExploitation();
          x.init({
            selector: document.querySelector('#explainer-div'),
            data_url: s[4],
            schema_url: s[5],
            configuration_url: s[6],
            configuration_schema_url: s[7]
          })
        } else if (s[8] == "ProtoGraph.Card.toArticle"){
          var x = new ProtoGraph.Card.toArticle();
          x.init({
            selector: document.querySelector('#explainer-div'),
            data_url: s[4],
            schema_url: s[5],
            configuration_url: s[6],
            configuration_schema_url: s[7]
          })
        }

        switch(s[9]){
        case "facebook":
        case "twitter":
          x.renderFacebookCard();
          break;

        case "instagram":
          x.renderInstagramCard();
          break;

        case "screenshot":
        default:
          x.renderScreenshot();
          break;
      }

  }, s);
});

  setTimeout(function() {
    //console.log("Fetching Data\n");
    var clipRect = page.evaluate(function(){
      return document.querySelector('#ProtoScreenshot').getBoundingClientRect();
    });

    height_diff = (system.args[8] == "ProtoGraph.Card.toSocial" ? 5 : 0)

    page.clipRect = {
      top:    clipRect.top,
      left:   clipRect.left,
      width:  clipRect.width,
      height: (clipRect.height - height_diff)
    };

    page.render('/tmp/temp_screenshot.png');
    system.stdout.write("Done Writing");
    phantom.exit();
  }, 6000);

});
