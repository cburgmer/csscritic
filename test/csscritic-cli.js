"use strict";

phantom.injectJs("node_modules/imagediff/imagediff.js");
phantom.injectJs("node_modules/jssha/src/sha.js");
phantom.injectJs("node_modules/ayepromise/ayepromise.js");
phantom.injectJs("build/dependencies/inlineresources.js");
phantom.injectJs("src/boot/scope.js");
phantom.injectJs("src/cli/phantomjsbind.js");
phantom.injectJs("src/cli/phantomjsrenderer.js");
phantom.injectJs("src/cli/signoffreporterutil.js");
phantom.injectJs("src/cli/signoffreporter.js");
phantom.injectJs("src/cli/terminalreporter.js");
phantom.injectJs("src/cli/htmlfilereporter.js");
phantom.injectJs("src/cli/filestorage.js");
phantom.injectJs("src/cli/phantomjs_runner.js");
phantom.injectJs("src/util.js");
phantom.injectJs("src/reporting.js");
phantom.injectJs("src/csscritic.js");
