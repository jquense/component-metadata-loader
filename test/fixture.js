import React, { PropTypes } from 'react';

/**
 * A test component.
 *
 * @alias TestSubject
 */
class TestComponent extends React.Component {
  render(){
    return <span />
  }
}

TestComponent.propTypes = {
  /**
   * The name of the test subject
   *
   * ```jsx
   * var some = <span id={'hi'} />
   * ```
   */
  name: PropTypes.string,

  /**
   * A numerical ID number.
   *
   * @required
   */
  id: PropTypes.number(),

  complex: PropTypes.shape({
    /**
     * with `markdown` here
     */
    foo: PropTypes.string.isRequired,

    complex: PropTypes.shape({
      /**
       * description
       * @type special
       */
      foo: PropTypes.string.isRequired,
    })
  })
}

TestComponent.defaultProps = {
  name: 'John',
  id: 1
}
