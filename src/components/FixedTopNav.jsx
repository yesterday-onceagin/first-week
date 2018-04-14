import PropTypes from 'prop-types';
import React from 'react';
import './fixed-topnav.less';

function FixedTopNav(props) {
  const { disableBack, onBack, children } = props

  return (
    <div className="fixed-topnav">
      {!disableBack ? <i className="dmpicon-return" onClick={onBack} /> : null}
      {children}
    </div>
  )
}

FixedTopNav.propTypes = {
  disableBack: PropTypes.bool,
  onBack: PropTypes.func
};

FixedTopNav.defaultProps = {

};

export default FixedTopNav
