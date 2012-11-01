// PhantomJS regression runner for csscritic
// This version references all dependencies and can be used to test against the latest changes.

phantom.injectJs("lib/imagediff.js");
phantom.injectJs("components/rasterizeHTML.js/lib/URI.js");
phantom.injectJs("components/rasterizeHTML.js/lib/cssParser.js");
phantom.injectJs("components/rasterizeHTML.js/rasterizeHTML.js");
phantom.injectJs("phantomjsrenderer.js");
phantom.injectJs("autoacceptingreporter.js");
phantom.injectJs("csscritic.js");
phantom.injectJs("phantomjs-runnerlib.js");
