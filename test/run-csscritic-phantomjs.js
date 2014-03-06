// PhantomJS regression runner for csscritic
// This version references all dependencies and can be used to test against the latest changes.

phantom.injectJs("node_modules/imagediff/imagediff.js");
phantom.injectJs("node_modules/jssha/src/sha.js");
phantom.injectJs("node_modules/rasterizehtml/dist/rasterizeHTML.allinone.js");
phantom.injectJs("src/utils.js");
phantom.injectJs("src/phantomjsrenderer.js");
phantom.injectJs("src/signoffreporter.js");
phantom.injectJs("src/terminalreporter.js");
phantom.injectJs("src/htmlfilereporter.js");
phantom.injectJs("src/filestorage.js");
phantom.injectJs("src/csscritic.js");
phantom.injectJs("src/phantomjs_runner.js");
