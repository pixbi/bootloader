# Frontend Bootloader

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
* Also remove `dependsOn` attribute after initialization

Note that the bootloader expects all `init` functions to be synchronous and
that they do not accept any parameters. Of course `init` may invoke
asynchronous operations; it's just that the bootloader does not wait for it to
complete.

The bootloader itself is written in object-literal module style and expects the
application to call `module.init()`, which would execute the bootloader and
bootstrap all registered modules.


## Setup

Install Component.IO:

    $ npm install -g component

To install, run in your repo:

    $ component install --save pixbi/bootloader

To test:

    $ npm install
    $ npm test


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
module.init();
module.pixbi.app.isInit.call(null);
```

would print to the console log:

```
primus
secundus
triens
```
