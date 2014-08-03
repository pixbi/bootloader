var chai = require('chai');
var expect = chai.expect;
var module = require('../index.js');

describe('bootloader', function () {
  describe('#bootload', function () {
  });

  describe('#loadLevel', function () {
  });

  describe('#buildDependents', function () {
    var subject = module.bootloader.buildDependents;

    it('builds dependent lists from dependency lists', function () {
      var a = {
        'a.b.c': { deps: ['a.b', 'd.e'] },
        'a.b': { deps: ['d.e'] },
        'd.e': {}
      };
      var b = subject(a);

      expect(b['a.b.c'].dependents).to.be.an('undefined');
      expect(b['a.b'].dependents).to.equal(['a.b.c']);
      expect(b['d.e'].dependents).to.equal(['d.e', 'a.b.c']);
    });
  });

  describe('#sortInits', function () {
  });
});

describe('bootloader.quicksort', function () {
  describe('#sort', function () {
    var subject = module.bootloader.quicksort.sort;

    it('sorts', function () {
      var a = [
        { score: 5 },
        { score: 2 },
        { score: 9 },
        { score: 3 },
      ];

      subject(a);

      expect(a[0].score).to.equal(2);
      expect(a[1].score).to.equal(3);
      expect(a[2].score).to.equal(5);
      expect(a[3].score).to.equal(9);
    });
  });
});
