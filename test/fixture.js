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
  id: PropTypes.number()
}

TestComponent.defaultProps = {
  name: 'John',
  id: 1
}
