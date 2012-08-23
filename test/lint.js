phantom.injectJs('linter.js');

jslinter.setFiles(['../csscritic.js', 'RegressionSpec.js', 'UtilSpec.js', 'IntegrationSpec.js', 'ReporterSpec.js']);
jslinter.run();

phantom.exit();
