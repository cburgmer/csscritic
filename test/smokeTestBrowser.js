// Don't care about the examples
csscritic.addReporter(csscritic.NiceReporter())
    .add('pageThatDoesNotExist')
    .add('yetAnotherPageThatDoesNotExist')
    .execute();
