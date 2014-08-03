var chai = require('chai');
var expect = chai.expect;
var module = require('../index.js').module;
var bootloader = require('../index.js').bootloader;

describe('bootloader', function () {
  var simpleGraph, complexGraph, simpleGraphDeps, complexGraphDeps, init1, init2;

  beforeEach(function () {
    init1 = function () { return 'init1'; };
    init2 = function () { return 'init2'; };
    simpleGraphDeps = ['x.y', 'x.y.z'];
    simpleGraph = {
      dependsOn: simpleGraphDeps,
      p: 1,
      q: {
        r: 2,
        s: 3,
        init: init2
      },
      init: init1,
      t: function () {}
    };

    complexGraph = {
      dependsOn: [],
      init: function () {}
    };
  });

  describe('#init', function () {
    it('initializes!', function () {
      var count = 0;

      module('pixbi.app', {
        dependsOn: ['pixbi.user'],

        initialized: -1,

        init: function init () {
          this.initialized = 3;
          count += 2;
        },

        isInit: function isInit () {
          count += this.initialized;
        }
      });

      module('pixbi.user', {
        init: function init () {
          count += 1;
        }
      });

      module.init();
      module.pixbi.app.isInit.call(null);

      expect(count).to.equal(6);
    });
  });

  describe('#loadLevel', function () {
    var a, inits, deps;
    var subject = bootloader.loadLevel;

    beforeEach(function () {
      deps = simpleGraphDeps;
      a = simpleGraph;
      inits = [];
    });

    it('prepares dependencies and inits', function () {
      subject(a, ['x', 'y'], inits);

      expect(a.init).to.be.an('undefined');
      expect(a.dependsOn).to.be.an('undefined');
      expect(inits['x.y'].fn()).to.equal('init1');
      expect(inits['x.y'].deps).to.equal(deps);
      expect(inits['x.y.q'].fn()).to.equal('init2');
      expect(inits['x.y.q'].deps).to.be.an('undefined');
    });
  });

  describe('#buildDependents', function () {
    var subject = bootloader.buildDependents;

    it('builds dependent lists from dependency lists', function () {
      var a = {
        'a.b.c': { name: 'a.b.c', deps: ['a.b', 'd.e'] },
        'a.b': { name: 'a.b', deps: ['d.e'] },
        'd.e': { name: 'd.e' }
      };
      var b = subject(a);

      expect(b['a.b.c'].dependents).to.be.an('undefined');
      expect(b['a.b'].dependents).to.deep.equal([b['a.b.c']]);
      expect(b['d.e'].dependents).to.deep.equal([b['a.b.c'], b['a.b']]);
    });
  });

  describe('#sortInits', function () {
    var a, inits, deps;
    var subject = bootloader.sortInits;

    beforeEach(function () {
      deps = complexGraphDeps;
      a = bootloader.buildDependents(complexGraph);
      inits = [];
    });

    it('sorts init objects', function () {
      var b = subject(a);
    });
  });
});

describe('bootloader.quicksort', function () {
  describe('#sort', function () {
    var subject = bootloader.quicksort.sort;

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
