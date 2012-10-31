// PhantomJS regression runner for csscritic
// In the current stage pages will be auto-accepted in the default size. Failing tests need to be dealt with manually.

phantom.injectJs("lib/imagediff.js");
phantom.injectJs("components/rasterizeHTML.js/lib/URI.js");
phantom.injectJs("components/rasterizeHTML.js/lib/cssParser.js");
phantom.injectJs("components/rasterizeHTML.js/rasterizeHTML.js");
phantom.injectJs("phantomjsrenderer.js");
phantom.injectJs("autoacceptingreporter.js");
phantom.injectJs("csscritic.js");
phantom.injectJs("phantomjs-runnerlib.js");
