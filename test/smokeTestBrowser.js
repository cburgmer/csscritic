csscritic.addReporter(csscritic.NiceReporter());
// Don't care about the examples
csscritic.add('pageThatDoesNotExist');
csscritic.add('yetAnotherPageThatDoesNotExist');
csscritic.execute();
