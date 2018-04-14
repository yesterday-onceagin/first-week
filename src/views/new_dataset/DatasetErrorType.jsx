import React from 'react';
import PropTypes from 'prop-types'
import createReactClass from 'create-react-class'
import './dataset.less';

class DatasetErrorType extends React.Component {
  static contextTypes = {
    router: PropTypes.object.isRequired
  };

  componentWillMount() {
    // 向MAIN通知navbar显示内容 
    this.props.onChangeNavBar([{
      name: '创建数据集',
      url: '/dataset/list'
    }, {
      name: '不支持类型的数据集'
    }]);
  }

  render() {
    return (
      <div className="modules-page-container">
        <div className="data-view dataset-detail-page">
          <span style={{ padding: '10px 0 0 20px', fontSize: '20px' }}>
            {`暂不支持${this.props.params.type}类型的数据集`}
          </span>
        </div>
      </div>
    )
  }
}

export default DatasetErrorType;
