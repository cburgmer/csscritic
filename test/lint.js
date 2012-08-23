phantom.injectJs('linter.js');

jslinter.setFiles(['../cssregressiontester.js', 'RegressionSpec.js', 'UtilSpec.js']);
jslinter.run();

phantom.exit();
