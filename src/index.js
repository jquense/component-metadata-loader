'use strict';
var metadata = require('react-component-metadata');
var loaderUtils = require('loader-utils');
var fs = require('fs');
var path = require('path');
var marked = require('marked');
var defaults = require('lodash/object/defaults');

marked.setOptions({
  xhtml: true,
  highlight: function(code, lang) {
    let prism = require('./prism-jsx');
    lang = lang && lang.indexOf('language-') === 0 ? lang.replace('language-', '') : lang;
    return prism.highlight(code, prism.languages[lang]);
  }
});


// removes doclet syntax from comments
let cleanDoclets = desc => {
  let idx = desc.indexOf('@');
  return (idx === -1 ? desc : desc.substr(0, idx)).trim();
};

let cleanDocletValue = str => str.trim().replace(/^\{/, '').replace(/\}$/, '');
let isLiteral = str => (/^('|")/).test(str.trim());

/**
 * parse out description doclets to an object and remove the comment
 *
 * @param  {ComponentMetadata|PropMetadata} obj
 */
function parseDoclets(obj, loaderOptions){
  obj.doclets = metadata.parseDoclets(obj.desc || '') || {};
  obj.desc = cleanDoclets(obj.desc || '');

  if (loaderOptions.markdown !== false)
    obj.descHtml = marked(obj.desc || '', loaderOptions);
}

/**
 * Reads the JSDoc "doclets" and applies certain ones to the prop type data
 * This allows us to "fix" parsing errors, or unparsable data with JSDoc style comments
 *
 * @param  {Object} props     Object Hash of the prop metadata
 * @param  {String} propName
 */
function applyPropDoclets(props, propName){
  let prop = props[propName];
  let doclets = prop.doclets;
  let value;

  // the @type doclet to provide a prop type
  // Also allows enums (oneOf) if string literals are provided
  // ex: @type {("optionA"|"optionB")}
  if (doclets.type) {
    value = cleanDocletValue(doclets.type);
    prop.type.name = value;

    if ( value[0] === '(' ) {
      value = value.substring(1, value.length - 1).split('|');

      prop.type.value = value;
      prop.type.name = value.every(isLiteral) ? 'enum' : 'union';
    }
  }

  // Use @required to mark a prop as required
  // useful for custom propTypes where there isn't a `.isRequired` addon
  if (doclets.required) {
    prop.required = true;
  }

  // Use @defaultValue to provide a prop's default value
  if (doclets.default) {
    prop.defaultValue = cleanDocletValue(doclets.default);
  }
}

module.exports =  () => {};

module.exports.pitch = function() {
  let callback = this.async();
  let loaderOptions = loaderUtils.parseQuery(this.query);
  let globalOptions = (this.options || {}).componentMetadata;

  this.cacheable();
  this.addDependency(path.resolve(this.resourcePath));

  loaderOptions = defaults(loaderOptions, globalOptions);

  fs.readFile(this.resourcePath, 'utf-8', (err, content) => {
    if (err) return callback(err);

    let components = metadata(content, loaderOptions) || {};

    Object.keys(components).forEach(key => {
      let component = components[key];

      parseDoclets(component, loaderOptions);

      if (loaderOptions.parse)
        loaderOptions.parse(component, key, loaderOptions, this.resourcePath)

      Object.keys(component.props).forEach(propName => {
        let prop = component.props[propName];

        parseDoclets(prop, loaderOptions);
        applyPropDoclets(component.props, propName);
      });
    });

    callback(null, 'module.exports = ' + JSON.stringify(components));
  });
};