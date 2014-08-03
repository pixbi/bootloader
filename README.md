# Frontend Bootloader

The bootloader exposes a global function `bootload(1)` that takes the name of
the global variable that points to an object-literal namespace and do the
following:

* Recursively iterate through the object
* Bind all functions to their immediate parent
* Collect all dependency declarations from a special attribute in each object
  named `dependsOn`, which is an array of absolute references to other modules
  in dot notation
* Call all `init` functions
* Remove all `init` functions from the structure to prevent repeated calls

The bootloader expects all `init` functions are synchronous and do not accept
any parameters.

The bootloader itself is written in object-literal module style but exposes
the `bootload(1)` function on window.

The bootloader also provides a `module(2)` function that takes a module path
and the module definition. The path is written in normal do notation. Module
will take care of making sure nothing is accidentally overwritten.


## Setup

Install Component.IO:

    $ npm install -g component

To install:

    $ component install --save pixbi/bootloader

The bootloader *must* run before the application code.


## Usage

For example, assume these modules:

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
bootload('pixbi');
pixbi.app.isInit.call(null);
```

would print to the console log:

```
primus
secundus
triens
```
