global.chai = require('chai');
global.expect = global.chai.chai;
var module = require('../index.js');

describe('bootloader', function () {
  describe('#bootload', function () {
  });

  describe('#loadLevel', function () {
  });

  describe('#buildDependents', function () {
  });

  describe('#sortInits', function () {
  });
});

describe('bootloader.quicksort', function () {
  describe('#sort', function () {
  });

  describe('#partition', function () {
  });

  describe('#swap', function () {
    it('swaps', function () {
      var a = [
        { score: 5 },
        { score: 2 },
        { score: 9 },
        { score: 3 },
      ];

      module.bootloader.quicksort.swap(a, 1, 3);

      chai.expect(a[0].score).to.equal(5);
      chai.expect(a[1].score).to.equal(3);
      chai.expect(a[2].score).to.equal(9);
      chai.expect(a[3].score).to.equal(2);
    });
  });
});
