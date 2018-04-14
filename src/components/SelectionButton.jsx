import React from 'react'
import PropTypes from 'prop-types'

import classnames from 'classnames';

import Button from 'react-bootstrap-myui/lib/Button';

function SelectionButton(props) {
  const { selected, children, className, ...otherProps } = props
  otherProps.disabled = otherProps.editable === false
  return (
    <div className="selection-button">
      {selected ? (
        <Button
          {...otherProps}
          className={classnames('active', className)}>
          {
            !otherProps.disabled && <span className="close-wapper">
              <i className="icon-close" />
            </span>
          }
          {children}
        </Button>
      ) : (
        <Button {...otherProps} className={className}>{children}</Button>
      )}
    </div>
  )
}

SelectionButton.propTypes = {
  className: PropTypes.string,
  children: PropTypes.any,
  selected: PropTypes.bool
}

export default SelectionButton;

