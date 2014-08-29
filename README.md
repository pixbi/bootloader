# Bootloader

The bootloader provides a `module(2)` function that takes a module path and a
module definition. The path is written in normal dot notation. `module(2)` will
take care of setting things up and making sure nothing is accidentally
overwritten.

The bootloader performs the following:

* Recursively iterate through the object
* Bind all functions to their immediate parent
* Collect all dependency declarations from a special attribute in each object
  named `dependsOn`, which is an array of absolute references to other modules
  in dot notation (e.g. `["x.y.z", "d.e"]`)
* Call all `init` functions in the prescribed order
* Remove all `init` functions from the structure to prevent repeated calls
* Also remove the `dependsOn` attribute after initialization

The bootloader itself is written in object-literal module style and expects the
application to call `module.init(1)`, which would execute the bootloader and
bootstrap all registered modules. Note that calling `module.init(1)` would also
remove that method according to the rules outlined above. This is by design as
you should not initialize twice.

`module.init(1)` takes an optional object that is the parameter object. The
same object is passed to every `init` function during initialization.

Note that you can simply call `module(1)` with just the path. It would return
the object at that level without adding or modifying any property. For
instance, calling `module('a.b.c').d();` is the same as calling
`module.a.b.c.d()`, which is the same as calling `module().a.b.c.d()`.


## Setup

Install Component.IO:

    $ npm install -g component

To install, run in your repo:

    $ component install pixbi/bootloader

To test:

    $ npm install
    $ npm test


## Usage

Assume these modules:

```js
module('pixbi.app', {
  dependsOn: ['pixbi.user'],

  initialized: '',

  init: function init () {
    this.initialized = 'triens';
    console.log('secundus');
  },

  isInit: function isInit () {
    console.log(this.initialized);
  }
});

module('pixbi.user', {
  init: function init () {
    console.log('primus');
  }
});
```

Running:

```
module.init();
module.pixbi.app.isInit.call(null);
```

would print to the console log:

```
primus
secundus
triens
```

### Asynchronous Initialization

`init` functions can be either synchronous or asynchronous. If the bootloader
detects that the `init` function takes an argument, like:

```js
module('example', {
  init: function init (done) {
    // ...
    setTimeout(done, 1000);
  }
});
```

The above module will block all other modules that have a higher dependency
score from loading for a second. Note that it does not mean that modules that
depend on it, but modules who happen to have a higher score, which guarantees
that its dependencies (but also some other unrelated modules) are blocked. This
is due to the fact that we use a simple algorithm to calculate dependency
scores (vs building a full-fledged dependency graph) to save on some space and
cycles.
