// PhantomJS regression runner for csscritic
// This version references all dependencies and can be used to test against the latest changes.

phantom.injectJs("lib/imagediff.js");
phantom.injectJs("lib/sha256.js");
phantom.injectJs("components/rasterizeHTML.js/dist/rasterizeHTML.allinone.js");
phantom.injectJs("src/phantomjsrenderer.js");
phantom.injectJs("src/signoffreporter.js");
phantom.injectJs("src/terminalreporter.js");
phantom.injectJs("src/htmlfilereporter.js");
phantom.injectJs("src/filestorage.js");
phantom.injectJs("src/csscritic.js");
phantom.injectJs("src/phantomjs-runnerlib.js");
