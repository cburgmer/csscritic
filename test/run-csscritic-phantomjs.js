// PhantomJS regression runner for csscritic
// This version references all dependencies and can be used to test against the latest changes.

phantom.injectJs("bower_components/js-imagediff/imagediff.js");
phantom.injectJs("bower_components/jssha/src/sha256.js");
phantom.injectJs("bower_components/rasterizeHTML.js/dist/rasterizeHTML.allinone.js");
phantom.injectJs("src/phantomjsbind.js");
phantom.injectJs("src/utils.js");
phantom.injectJs("src/phantomjsrenderer.js");
phantom.injectJs("src/signoffreporter.js");
phantom.injectJs("src/terminalreporter.js");
phantom.injectJs("src/htmlfilereporter.js");
phantom.injectJs("src/filestorage.js");
phantom.injectJs("src/csscritic.js");
phantom.injectJs("src/phantomjs_runner.js");
