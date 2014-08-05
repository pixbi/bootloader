if (! Element) {
  var Element = function Element () {};
}

// @param {string=}
// @param {Object=}
// @return {Object}
function module (path, object) {
  var i, l, seg, keys, key, value;
  var node = module;

  // @param {function}
  // @param {*}
  // @return {function}
  function asynchronify (fn, ctx) {
    function async (fn, params, done) {
      fn.call(this, params);
      done && done();
    }

    var fnStr = fn.toString();
    var argStartIndex = fnStr.indexOf('(');
    var argEndIndex = fnStr.indexOf(')');
    var argList = fnStr.substring(argStartIndex + 1, argEndIndex);
    var args = argList.replace(/ /g, '');

    // Normal function -> "asynchronous" function
    if (args.indexOf('done') < 0) {
      fn = async.bind(ctx, fn);
    } else {
      fn = fn.bind(ctx);
    }

    return fn;
  }

  object = object || {};
  path = (path || '').split('.');
  // Handle edge case with `split()`
  if (path.length === 1 && path[0] === '') path = [];

  // First, make sure the base is there
  for (i = 0, l = path.length; i < l; i++) {
    seg = path[i];
    node[seg] = node[seg] || {};
    node = node[seg];
  }

  // Then, load all properties onto it one by one to avoid replacing existing
  // properties
  keys = Object.keys(object);
  for (i = 0, l = keys.length; i < l; i++) {
    key = keys[i];
    value = object[key];

    // Force async for inits
    if (key === 'init') {
      node[key] = value = asynchronify(value, node);
    // Bind context if it's a function
    } else if (typeof value === 'function') {
      node[key] = value.bind(node);
    } else {
      node[key] = value;
    }
  }

  return node;
}

module('bootloader', {
  dependsOn: ['bootloader.quicksort'],

  // @typdef {Object.<string, *>}
  Init: null,

  // @param {Object}
  init: function init (params) {
    params = params || {};

    var load = this.loadLevel;
    var build = this.buildDependents;
    var sort = this.sortInits;
    var compact = this.compact;
    var chain = this.chain;
    var fn = chain(compact(sort(build(load(module, [], {})))));

    fn(params);
  },


  // @param {Array.<function>}
  // @return {Array.<function>}
  chain: function chain (fns) {
    function seq (fn1, fn2, params) {
      fn1(params, fn2);
    }

    // Start from the second to the end
    for (var i = fns.length - 2, l = 0; i >= l; i--) {
      fns[i] = seq.bind(this, fns[i], fns[i + 1]);
    }

    // Only need the head
    return fns[0];
  },

  // @param {Array.<function>}
  compact: function compact (fns) {
    return fns.reduce(function (prev, cur) {
      var fn = cur.fn;
      return (typeof fn === 'function') ? prev.concat([fn]) : prev;
    }, []);
  },

  // @param {Object.<string, *>}
  // @param {Array.<string>}
  // @param {Array.<bootloader.Init>}
  // @return {Array.<bootloader.Init>}
  loadLevel: function loadLevel (node, trail, inits) {
    var i, l, key, value;
    var keys = Object.keys(node);
    var deps = node.dependsOn;
    var trailPath = trail.join('.');

    inits[trailPath] = {};

    // Store dependency information
    if (deps) {
      inits[trailPath].deps = deps;
      delete node.dependsOn;
    }

    // `init` must be a function
    if (typeof node.init === 'function') {
      // Save it and remove from structure
      inits[trailPath].fn = node.init;
      delete node.init;
    }

    // Recurse
    for (i = 0, l = keys.length; i < l; i++) {
      key = keys[i];
      value = node[key];

      if (// It exists
          (!! value) &&
          // It's an object
          (typeof value === 'object') &&
          // It's not a DOM element
          (! (value instanceof Element)) &&
          // It's not an array
          (! Array.isArray(value))) {
        loadLevel(value, trail.concat([key]), inits);
      }
    }

    // Can't init the bootloader or the top-level module
    if (trailPath === '' || trailPath === 'bootloader') {
      delete inits[trailPath];
    }

    return inits;
  },

  // @param {Array.<bootloader.Init>}
  // @return {Array.<bootloader.Init>}
  buildDependents: function buildDependents (inits) {
    var i, l, j, m, k, keys, key, deps, dep, init, target;

    keys = Object.keys(inits);
    for (i = 0, l = keys.length; i < l; i++) {
      key = keys[i];
      init = inits[key];
      deps = init.deps || [];

      // Go through deps and build dependent list
      for (j = 0, m = deps.length; j < m; j++) {
        dep = deps[j];
        target = inits[dep];

        if (! target) {
          throw new Error('"' + dep + '" is expected as a dependency');
        }

        target.dependents = target.dependents || [];
        target.dependents.push(init);
      }
    }

    return inits;
  },

  // @param {Array.<bootloader.Init>}
  // @return {Array.<function>}
  sortInits: function sortInits (inits) {
    var dependents, depScore, score, paths, k, key, init, fn, i, l;
    var initArr = [];
    // Limit on how long this can run
    var threshold = 10000;
    var count = 0;

    // Indefinitely iterate through all nodes until all sort scores have been
    // calculated
    paths = Object.keys(inits);
    k = paths.length - 1;
    while (paths.length > 0) {
      key = paths[k];
      init = inits[key];
      dependents = init.dependents || [];
      fn = init.fn;
      depScore = 0;

      // Circular dependency check
      if (count++ > threshold) {
        throw new Error('Unterminated sort: there may be an `init` circular dependency.');
      }

      // Accumulate dependents' scores
      for (i = 0, l = dependents.length; i < l; i++) {
        score = dependents[i].score;

        if (typeof score === 'number') {
          depScore += score;
        } else {
          depScore = -1;
          break;
        }
      }

      // Only if all dependents have scores
      if (depScore > -1) {
        // A node's score equals the number of dependents plus the number of
        // dependents for each of its dependents
        init.score = dependents.length + depScore;

        // Take off the list
        paths.splice(k, 1);

        // Add to array for later processing
        initArr.push(init);
      }

      // Move onto the next or start over
      k = (k === 0) ? (paths.length - 1) : (k - 1);
    }

    // Sort the initializers by score. The higher the score the more depended
    // upon, so we need to reverse it.
    return module.bootloader.quicksort.sort(initArr).reverse();
  }
});

module('bootloader.quicksort', {
  // Specialized quicksort adapted from
  // http://www.nczonline.net/blog/2012/11/27/computer-science-in-javascript-quicksort/
  //
  // @param {Array.<bootloader.Init>}
  // @param {number}
  // @param {number}
  // @return {Array.<bootloader.Init>}
  sort: function sort (items, left, right) {
    var index;

    if (items.length > 1) {
      left = typeof left != 'number' ? 0 : left;
      right = typeof right != 'number' ? items.length - 1 : right;
      index = this.partition(items, left, right);

      if (left < index - 1) {
        this.sort(items, left, index - 1);
      }

      if (index < right) {
        this.sort(items, index, right);
      }
    }

    return items;
  },

  // @param {Array.<bootloader.Init>}
  // @param {number}
  // @param {number}
  // @return {number}
  partition: function partition (items, left, right) {
    var pivot = items[Math.floor((right + left) / 2)];
    var i = left;
    var j = right;

    while (i <= j) {
      while (items[i].score < pivot.score) {
        i++;
      }

      while (items[j].score > pivot.score) {
        j--;
      }

      if (i <= j) {
        this.swap(items, i, j);
        i++;
        j--;
      }
    }

    return i;
  },

  // @param {Array.<bootloader.Init>}
  // @param {number}
  // @param {number}
  swap: function swap (items, i, j){
    var temp = items[i];
    items[i] = items[j];
    items[j] = temp;
  }
});

// Expose API
module.init = module.bootloader.init;

// CommonJS interface
var exports;
if (exports) exports.bootloader = module.bootloader;
if (exports) exports.module = module;
