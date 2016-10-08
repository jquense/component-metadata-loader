var path = require('path');
var assert = require('assert');
var loader = require('../lib');
var webpack = require('webpack')
var MemoryFileSystem = require('memory-fs')

describe('component-metadata-loader', function () {

  it('should parse metadata', function (done) {
    run('', function(err, json) {
      if (err) return done(err)

      var component = json.TestComponent;

      assert.equal(component.desc, 'A test component.')
      assert.equal(component.descHtml, '<p>A test component.</p>\n')

      assert.deepEqual(component.doclets, {
        alias: 'TestSubject'
      });

      let props = component.props;
      assert.deepEqual(props.id.doclets, {
        required: true
      });

      let nested = props.complex.type.value;
      assert.deepEqual(nested.complex.type.value.foo.doclets, {
        type: 'special'
      });

      done()
    })
  });

  it('should not compile markdown', function (done) {
    run('?markdown=false', function(err, json) {
      if (err) return done(err)

      var component = json.TestComponent;
      assert.equal(component.descHtml, undefined)
      assert.equal(component.props.id.descHtml, undefined);
      done()
    })
  });

  it('should end on pitch if specified', function (done) {
    run('?pitch=true', function(err, json) {
      if (err) return done(err)

      var component = json.TestComponent;
      assert.ok(component)
      done()
    })
  });

  it('should use globalOptions', function (done) {
    run('', { markdown: false }, function(err, json) {
      if (err) return done(err)

      var component = json.TestComponent;
      assert.equal(component.descHtml, undefined)
      assert.equal(component.props.id.descHtml, undefined);
      done()
    })
  });

  it('should use `parse()`', function (done) {
    var spy = ()=> {
      done()
    }
    run('', { parse: spy }, function() {})
  });
});

function run(query, opts, cb){
  var fixture = path.resolve(__dirname, './fixture.js');

  if (arguments.length === 2)
    cb = opts, opts = null

  let compiler = webpack({
    entry: fixture,
    output: {
      path: __dirname,
      filename: 'output.js'
    },
    componentMetadata: opts,
    module: {
      loaders: [
        { test: fixture, loader: path.resolve(__dirname, '../src/index.js') + query }
      ]
    }
  })

  let fs = compiler.outputFileSystem = new MemoryFileSystem()

  compiler.run((err, stats)=> {
    if (err) return cb(err);
    let syncword = 'module.exports = '
    let result = fs.readFileSync(__dirname + '/output.js', 'utf8')

    result = result
      .substr(result.indexOf(syncword) + syncword.length).split('\n')

    result = result
      .slice(0, result.length - 2).join('\n')

    cb(null, JSON.parse(result))
  })
}
