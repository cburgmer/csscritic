phantom.injectJs('linter.js');

jslinter.setFiles(['../cssregressiontester.js']);
jslinter.run();

phantom.exit();
