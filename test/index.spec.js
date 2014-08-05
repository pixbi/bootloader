var chai = require('chai');
var expect = chai.expect;
var exp = require('../app/index.js');
var module = exp.module;
var bootloader = exp.bootloader;

describe('bootloader', function () {
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
    var object, deps, init1, init2;
    var subject = bootloader.loadLevel;

    beforeEach(function () {
      init1 = function () { return 'init1'; };
      init2 = function () { return 'init2'; };
      dpes = ['x.y', 'x.y.z'];
      object = {
        dependsOn: deps,
        p: 1,
        q: {
          r: 2,
          s: 3,
          init: init2
        },
        init: init1,
        t: function () {}
      };
    });

    it('prepares dependencies and inits', function () {
      var inits = subject(object, ['x', 'y'], []);

      expect(object.init).to.be.an('undefined');
      expect(object.dependsOn).to.be.an('undefined');
      expect(inits['x.y'].fn()).to.equal('init1');
      expect(inits['x.y'].deps).to.equal(deps);
      expect(inits['x.y.q'].fn()).to.equal('init2');
      expect(inits['x.y.q'].deps).to.be.an('undefined');
    });
  });

  describe('#buildDependents', function () {
    var subject = bootloader.buildDependents;

    it('builds dependent lists from dependency lists', function () {
      var object = {
        'a.b.c': { name: 'a.b.c', deps: ['a.b', 'd.e'] },
        'a.b': { name: 'a.b', deps: ['d.e'] },
        'd.e': { name: 'd.e' }
      };
      var output = subject(object);

      expect(output['a.b.c'].dependents).to.be.an('undefined');
      expect(output['a.b'].dependents).to.deep.equal([output['a.b.c']]);
      expect(output['d.e'].dependents).to.deep.equal([output['a.b.c'], output['a.b']]);
    });
  });

  describe('#sortInits', function () {
    var object;
    var subject = bootloader.sortInits;

    beforeEach(function () {
      var abc, pq, xy;

      object = {
        'a.b.c': {
          score: 1,
          fn: function () {
            return 'a.b.c';
          }
        },
        'p.q': {
          score: 0,
          fn: function () {
            return 'p.q';
          }
        },
        'x.y': {
          score: 2,
          fn: function () {
            return 'x.y';
          }
        }
      };

      abc = object['a.b.c'];
      pq = object['p.q'];
      xy = object['x.y'];
      abc.dependents = [xy];
      pq.dependents = [abc];
    });

    it('sorts init objects', function () {
      var output = subject(object);

      expect(output[0]()).to.equal('p.q');
      expect(output[1]()).to.equal('a.b.c');
      expect(output[2]()).to.equal('x.y');
    });
  });

  describe('#chain', function () {
    it('chains all inits', function (done) {
      var asynchronify = bootloader.asynchronify ;
      var chain = bootloader.chain;
      var output = [];
      var fns = [
        // 0
        function () {
          output.push(Date.now());
        },
        // 1
        function (done) {
          setTimeout(function () {
            output.push(Date.now());
            done();
          }, 400);
        },
        // 2
        function () {
          output.push(Date.now());
        },
        // 3
        function (done) {
          setTimeout(function () {
            output.push(Date.now());
            done();
          }, 800);
        },
        // 4
        function () {
          output.push(Date.now());
        }
      ];

      fns = asynchronify(fns);
      fns.forEach(function (fn) {
      });
      chain(fns, function () {
        expect(output[1] - output[0]).to.be.least(400);
        expect(output[2] - output[1]).to.be.most(10);
        expect(output[3] - output[2]).to.be.least(800);
        expect(output[4] - output[3]).to.be.most(10);
        done();
      })();
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
