import React from 'react';
import licenseImg from '../static/images/license.png';

const STYLE_SHEET = {
  page: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    background: '#0f182f',
    zIndex: 999
  },
  container: {
    textAlign: 'center'
  },
  message: {
    fontSize: '18px',
    lineHeight: '50px',
    marginTop: '15px'
  }
}

function NoLicense() {
  return (
    <div style={STYLE_SHEET.page}>
      <div style={STYLE_SHEET.container}>
        <img src={licenseImg}/>
        <p style={STYLE_SHEET.message}>license已失效，请联系管理员</p>
      </div>
    </div>
  );
}

export default NoLicense;
