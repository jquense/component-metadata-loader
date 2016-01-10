var path = require('path');
var assert = require('assert');
var loader = require('../lib');

describe('component-metadata-loader', function () {

  function run(query, opts, cb){
    var fixture = path.resolve(__dirname, './fixture.js');

    if (arguments.length === 2)
      cb = opts, opts = null

    loader.pitch.call({
      async: () => (err, result)=>{
        if (err) return cb(err);

        cb(null, JSON.parse(result.substr('module.exports = '.length)))
      },
      cacheable: ()=> {},
      addDependency: ()=> {},
      resourcePath: fixture,
      query: query,
      options: { componentMetadata: opts || {} },
    })
  }

  it('should parse metadata', function (done) {
    run('', function(err, json) {
      if (err) return done(err)

      var component = json.TestComponent;

      assert.equal(component.desc, 'A test component.')
      assert.equal(component.descHtml, '<p>A test component.</p>\n')

      assert.deepEqual(component.doclets, {
        alias: 'TestSubject'
      });

      assert.deepEqual(component.props.id.doclets, {
        required: true
      });

      //console.log(component)
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
