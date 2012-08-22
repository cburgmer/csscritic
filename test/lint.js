phantom.injectJs('linter.js');

jslinter.setFiles(['../cssregressiontester.js', 'RegressionSpec.js']);
jslinter.run();

phantom.exit();
