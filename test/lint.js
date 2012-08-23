phantom.injectJs('linter.js');

jslinter.setFiles(['../cssregressiontester.js', 'RegressionSpec.js', 'UtilSpec.js', 'IntegrationSpec.js']);
jslinter.run();

phantom.exit();
