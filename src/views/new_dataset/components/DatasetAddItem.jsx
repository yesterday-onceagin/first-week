import PropTypes from 'prop-types';
import React from 'react';

class DatasetAddItem extends React.Component {
  static propTypes = {
    icon: PropTypes.string,
    name: PropTypes.string,
    type: PropTypes.string,
    description: PropTypes.string,
    onAdd: PropTypes.func
  };

  render() {
    const {
      icon,
      name,
      description,
      onAdd,
      style
    } = this.props;

    return (
      <div className="dataset-add-item" style={Object.assign({}, { ...style }, this.STYLE_SHEET.container)} onClick={onAdd}>
        <div className="cover" style={this.STYLE_SHEET.cover}>
          <img src={icon} style={this.STYLE_SHEET.img} />
          <div className="name" style={this.STYLE_SHEET.name}>{name}</div>
        </div>
        <div className="description" style={this.STYLE_SHEET.description}>
          {description}
        </div>
      </div>
    );
  }

  // 除 hover、theme以外的样式
  STYLE_SHEET = {
    container: {
      height: '100px',
      margin: '0 5px',
      padding: '10px',
      cursor: 'pointer',
      transition: 'background .3s',
      boxSizing: 'border-box',
      flex: '1'
    },
    cover: {
      padding: '9px 24px 9px 0'
    },
    img: {
      width: '26px',
      height: '26px'
    },
    name: {
      fontSize: '16px',
      lineHeight: '26px',
      display: 'inline-block',
      marginLeft: '15px'
    },
    description: {
      fontSize: '12px',
      lineHeight: '20px',
      height: '40px',
      overflow: 'hidden',
      alignItems: 'center',
      textOverflow: 'ellipsis',
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical'
    }
  };
}

export default DatasetAddItem;
