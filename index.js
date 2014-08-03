bootloader = {
  // @type {Object.<string, boolean>}
  loaded: {},

  // @typdef {Object.<string, *>}
  Init: null,

  // @param {string}
  // @return {?Error}
  bootload: function bootload (name) {
    var i, l, initFns;
    var inits = {};

    // Don't load twice
    if (this.loaded.indexOf(name) > -1) {
      return new Error(name + ' already loaded');
    }

    // Load all and make sure we only do it once
    this.loadLevel(window[name], [name], inits);
    this.loaded.push(name);

    // Sort inits
    initFns = this.sortInits(this.buildDependents(inits));

    // Initialize!
    for (i = 0, l = initFns.length; i < l; i++) {
      initFns[i].fn();
    }
  },

  // @param {Object.<string, *>}
  // @param {Array.<string>}
  // @param {Array.<bootloader.Init>}
  loadLevel: function loadLevel (node, trail, inits) {
    var i, l, key, value;
    var keys = Object.keys(node);
    var deps = node.dependsOn;

    // Store dependency information
    if (deps) {
      inits[trail] = {};
      inits[trail].deps = deps;
      delete node.dependsOn;
    }

    for (i = 0, l = keys.length; i < l; i++) {
      key = keys[i];
      value = node[key];

      if (typeof value === 'object' && !Array.isArray(value)) {
        this.loadLevel(value, trail.concat([key]), inits);
      }

      if (typeof value === 'function') {
        value.bind(node);

        // If it's `init`, save it and remove from structure
        inits[trail] = inits[trail] || {};
        inits[trail].fn = value;
        delete node.init;
      }
    }
  },

  // @param {Array.<bootloader.Init>}
  // @return {Array.<bootloader.Init>}
  buildDependents: function buildDependents (inits) {
    var i, l, j, m, k, keys, key, deps, dep, init, fn, target;

    keys = Object.keys(inits);
    for (i = 0, l = keys.length; i < l; i++) {
      key = keys[i];
      init = inits[i];
      deps = init.deps;
      fn = init.fn;

      // Go through deps and build dependent list
      for (j = 0, m = deps.length; j < m; j++) {
        dep = deps[j];
        target = inits[dep];

        if (! target) {
          throw new Error('"' + dep + '" is expected as a dependency but is not found');
        }

        target.dependents = target.dependents || [];
        target.dependents.push(init.trail);
      }
    }
  },

  // @param {Array.<bootloader.Init>}
  // @return {Array.<bootloader.Init>}
  sortInits: function sortInits (inits) {
    var dependents, depScore, score;

    // Indefinitely iterate through all nodes until all sort scores have been
    // calculated
    paths = Object.keys(inits);
    k = paths.length - 1;
    while (paths.length > 0) {
      key = paths[k];
      init = inits[k];
      dependents = init.dependents;
      fn = init.fn;
      depScore = 0;

      // Accumulate dependents' scores
      for (i = 0, l = dependents.length; i < l; i++) {
        score = dependents[i].score;

        if (score) {
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
      }

      // Move onto the next or start over
      k = (k === 0) ? (paths.length - 1) : (k - 1);
    }

    // Sort
    return quickSort(inits);
  },

  // Specialized quicksort adapted from
  // http://www.nczonline.net/blog/2012/11/27/computer-science-in-javascript-quicksort/
  //
  // @param {Array.<bootloader.Init>}
  // @param {number}
  // @param {number}
  // @return {Array.<bootloader.Init>}
  quickSort: function quickSort (items, left, right) {
    var index;

    if (items.length > 1) {
      left = typeof left != 'number' ? 0 : left;
      right = typeof right != 'number' ? items.length - 1 : right;
      index = this.partition(items, left, right);

      if (left < index - 1) {
        quickSort(items, left, index - 1);
      }

      if (index < right) {
        quickSort(items, index, right);
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
};

window.bootload = bootloader.bootload.bind(bootloader);
