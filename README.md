# component-metadata-loader

A Webpack loader for extracting React Component metadata (props, comments jsDoclets, etc). Helpful for
generating documentation from React components,
it uses [react-component-metadata](https://github.com/jquense/react-component-metadata)
to parse and return JSON metadata when requiring a file.

## Installation

```sh
$ npm install --save component-metadata-loader
```

## Usage

Generally you will want to use the inline request syntax for using this loader,
instead of adding it to your config file.

```js
var metadata = require('component-metadata!./some/my-component');

metadata.MyComponent // { props, desc, descHtml, doclets }
```

### doclets

The loader will parse out any jsDoc style "doclets" from either component or propType comment blocks. You can
access them from `metadata.MyComponent.doclets` or `metadata.MyComponent.props.myProp.doclets`

Some doclets are "special cased", adjusting the returned metadata if they are present.

- `@required` will mark a prop as required as if you had used `string.isRequired` for the propType.
- `@type`: overrides the type name of the prop, also accepts the following syntax for enums
or `oneOf` props `('foo'|'bar'|'baz')`
- `@default`: for manually specifying a default value for a prop.


### markdown

By default the loader will parse any prop or component comments as markdown using `marked`, you can disabled this
with `require('component-metadata?markdown=false!./my-component')`.

You can also pass any markdown options as well.

### syntax highlighting

`prismjs` is also set up to handle any js or jsx syntax highlighting in your markdown.

### Global options.

When passing options that aren't serializable to a string is necessary, you can specify global options in
your Webpack config like so:

```js
{
  entry,
  output,
  ...
  componentMetadata: {
    renderer: new MyMarkedRenderer(),
    highlight: customHightlightingFunction
  }
}
```


### Additional parsing

If you want to add some custom metadata parsing you can provide a `parse` function in the options

```js
{
  entry,
  output,
  ...
  componentMetadata: {
    parse(metadata, componentName, options, filePath) {
      //add something to metadata
    }
  }
}
```

## License

MIT © Jason Quense
