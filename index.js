// @param {string}
// @param {Object}
// @return {Object}
function module (path, object) {
  var i, l, seg, keys, key, value;
  var node = module;

  path = path.split('.');

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

    // Bind context if it's a function
    if (typeof value === 'function') {
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

  init: function init () {
    var i, l, fn, inits, key, keys;
    var sort = this.sortInits;
    var build = this.buildDependents;
    var load = this.loadLevel;

    inits = sort(build(load(module, [], {})));

    // Actually initialize!
    keys = Object.keys(inits);
    for (i = 0, l = keys.length; i < l; i++) {
      key = keys[i];
      fn = inits[key].fn;

      // As long as it's not this very function
      if (typeof fn === 'function' && fn !== init) {
        fn();
      }
    }
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

    for (i = 0, l = keys.length; i < l; i++) {
      key = keys[i];
      value = node[key];

      if (!!value && typeof value === 'object' && !Array.isArray(value)) {
        this.loadLevel(value, trail.concat([key]), inits);
      }

      if (key === 'init' && typeof value === 'function') {
        // If it's `init`, save it and remove from structure
        inits[trailPath].fn = value;
        delete node.init;
      }
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
  // @return {Array.<bootloader.Init>}
  sortInits: function sortInits (inits) {
    var dependents, depScore, score;
    var initArr = [];

    // Indefinitely iterate through all nodes until all sort scores have been
    // calculated
    paths = Object.keys(inits);
    k = paths.length - 1;
    var count = 0;
    while (paths.length > 0 && count++ < 10) {
      key = paths[k];
      init = inits[key];
      dependents = init.dependents || [];
      fn = init.fn;
      depScore = 0;

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

    // Sort
    return module.bootloader.quicksort.sort(initArr);
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
exports.bootloader = module.bootloader;
exports.module = module;
