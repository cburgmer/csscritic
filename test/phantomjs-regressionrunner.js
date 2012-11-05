// PhantomJS regression runner for csscritic
// This version references all dependencies and can be used to test against the latest changes.

phantom.injectJs("lib/imagediff.js");
phantom.injectJs("src/phantomjsrenderer.js");
phantom.injectJs("src/autoacceptingreporter.js");
phantom.injectJs("src/domstorage.js");
phantom.injectJs("src/csscritic.js");
phantom.injectJs("src/phantomjs-runnerlib.js");
