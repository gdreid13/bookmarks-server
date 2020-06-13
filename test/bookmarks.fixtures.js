function makeBookmarksArray() {
  return [
    {
      id: 1,
      title: 'First test bookmark',
      url: 'first.est',
      description: 'Lorem ipsum whatever',
      rating: '1',
    },
    {
      id: 2,
      title: 'Second test bookmark',
      url: 'second.est',
      description: 'Fakus Latinumus',
      rating: '3'
    },
    {
      id: 3,
      title: 'Third test bookmark',
      url: 'third.est',
      description: 'Carthago delenda est',
      rating: '5'
    },
    {
      id: 4,
      title: 'Fourth test bookmark',
      url: 'fourth-test-another.url',
      description: 'This language is English',
      rating: '2'
    },
  ];
}


module.exports = {
  makeBookmarksArray,
}