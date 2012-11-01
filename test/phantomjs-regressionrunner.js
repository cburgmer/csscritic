// PhantomJS regression runner for csscritic
// This version references all dependencies and can be used to test against the latest changes.

phantom.injectJs("lib/imagediff.js");
phantom.injectJs("components/rasterizeHTML.js/lib/URI.js");
phantom.injectJs("components/rasterizeHTML.js/lib/cssParser.js");
phantom.injectJs("components/rasterizeHTML.js/rasterizeHTML.js");
phantom.injectJs("src/phantomjsrenderer.js");
phantom.injectJs("src/autoacceptingreporter.js");
phantom.injectJs("src/csscritic.js");
phantom.injectJs("src/phantomjs-runnerlib.js");
