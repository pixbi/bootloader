# Frontend Bootloader

The bootloader exposes a single global function `bootload(1)` that takes the
name of the global variable that points to an object-literal namespace and do
the following:

* Recursively iterate through the object
* Bind all functions to their immediate parent
* Collect all dependency declarations from a special attribute in each object
  named `dependsOn`, which is an array of absolute references to other modules
  in dot notation
* Call all `init` functions in the order of the declared dependencies

The bootloader expects all `init` functions are synchronous.


## Setup

Install Component.IO:

    $ npm install -g component

To install:

    $ component install --save pixbi/bootloader


## Usage

For example, assume these modules:

```js
window.pixbi = {
  app: {
    dependsOn: ['pixbi.user'],

    initialized: '',

    init: function init () {
      this.initialized = 'triens';
      console.log('secundus');
    },

    isInit: function isInit () {
      console.log(this.initialized);
    }
  },

  user: {
    init: function init () {
      console.log('primus');
    }
  }
};
```

Running:

```
window.bootload('pixbi');
pixbi.app.isInit.call(null);
```

would print to the console log:

```
primus
secundus
triens
```
