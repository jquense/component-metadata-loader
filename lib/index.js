'use strict';
var metadata = require('react-component-metadata');
var loaderUtils = require('loader-utils');
var fs = require('fs');
var path = require('path');
var marked = require('marked');
var defaults = require('lodash/object/defaults');

marked.setOptions({
  xhtml: true,
  highlight: function highlight(code, lang) {
    var prism = require('./prism-jsx');
    lang = lang && lang.indexOf('language-') === 0 ? lang.replace('language-', '') : lang;
    return prism.highlight(code, prism.languages[lang]);
  }
});

// removes doclet syntax from comments
var cleanDoclets = function cleanDoclets(desc) {
  var idx = desc.indexOf('@');
  return (idx === -1 ? desc : desc.substr(0, idx)).trim();
};

var cleanDocletValue = function cleanDocletValue(str) {
  return str.trim().replace(/^\{/, '').replace(/\}$/, '');
};
var isLiteral = function isLiteral(str) {
  return (/^('|")/.test(str.trim())
  );
};

/**
 * parse out description doclets to an object and remove the comment
 *
 * @param  {ComponentMetadata|PropMetadata} obj
 */
function parseDoclets(obj, loaderOptions) {
  obj.doclets = metadata.parseDoclets(obj.desc || '') || {};
  obj.desc = cleanDoclets(obj.desc || '');

  if (loaderOptions.markdown !== false) obj.descHtml = marked(obj.desc || '', loaderOptions);
}

/**
 * Reads the JSDoc "doclets" and applies certain ones to the prop type data
 * This allows us to "fix" parsing errors, or unparsable data with JSDoc style comments
 *
 * @param  {Object} props     Object Hash of the prop metadata
 * @param  {String} propName
 */
function applyPropDoclets(props, propName) {
  var prop = props[propName];
  var doclets = prop.doclets;
  var value = undefined;

  // the @type doclet to provide a prop type
  // Also allows enums (oneOf) if string literals are provided
  // ex: @type {("optionA"|"optionB")}
  if (doclets.type) {
    value = cleanDocletValue(doclets.type);
    prop.type.name = value;

    if (value[0] === '(') {
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
  if (doclets['default']) {
    prop.defaultValue = cleanDocletValue(doclets['default']);
  }
}

function getOptions(ctx) {
  var loaderOptions = loaderUtils.parseQuery(ctx.query);
  var globalOptions = (ctx.options || {}).componentMetadata;

  return defaults(loaderOptions, globalOptions);
}

module.exports = function (contents) {
  this.value = [this.data.metadata];
  return 'module.exports = ' + JSON.stringify(this.data.metadata);
};

module.exports.pitch = function (_, __, data) {
  var _this = this;

  var callback = this.async(),
      options = getOptions(this);

  this.cacheable();

  fs.readFile(this.resourcePath, 'utf-8', function (err, content) {
    if (err) return callback(err);
    var json = parseMetaData(content, _this.resourcePath, options);

    data.metadata = json;

    if (options.pitch) {
      _this.value = [json];
      callback(null, 'module.exports = ' + JSON.stringify(json));
    } else callback();
  });
};

function parseMetaData(content, resourcePath, loaderOptions) {
  var components = metadata(content, loaderOptions) || {};

  Object.keys(components).forEach(function (key) {
    var component = components[key];

    parseDoclets(component, loaderOptions);

    if (loaderOptions.parse) loaderOptions.parse(component, key, loaderOptions, resourcePath);

    Object.keys(component.props).forEach(function (propName) {
      var prop = component.props[propName];

      parseDoclets(prop, loaderOptions);
      applyPropDoclets(component.props, propName);
    });
  });

  return components;
};