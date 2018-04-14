import React from 'react'
import PropTypes from 'prop-types'

import Button from 'react-bootstrap-myui/lib/Button';
import Select from 'react-bootstrap-myui/lib/Select';
import _ from 'lodash';

class FirstProcess extends React.Component {
  static propTypes = {
    datasourceList: PropTypes.array,
    initState: PropTypes.object,
    secondProcess: PropTypes.object,
    style: PropTypes.object,
    tableList: PropTypes.array,
    onNext: PropTypes.func,
    onClearDataset: PropTypes.func,
    onGetParamsData: PropTypes.func
  };

  constructor(props) {
    super(props);
    this.state = {
      isEdit: false,
      data_source_id: ''
    }
    if (props.initState) {
      this.state = {
        ...this.state,
        ...props.initState
      }
    }
  }

  componentWillReceiveProps(nextProps) {
    const { initState } = this.props
    if (!_.isEqual(nextProps.initState, initState)) {
      this.setState({
        ...this.state,
        ...nextProps.initState
      })
    }
  }

  render() {
    const { datasourceList, style } = this.props
    const { data_source_id } = this.state
      
    return <div className="sql-main form" style={style}>
      <div className="main-wrap">
        <div className="row">
          <div className="col-md-2 col-label">
            选择数据源 :
          </div>
          <div className="col-md-8">
            <div className="input-wrap">
              <Select value={data_source_id} openSearch maxHeight={180} width="100%" onSelected={this.handleSelect.bind(this)}>
                {
                  datasourceList.map((item, key) => <option key={key} value={item.id}>{item.name}</option>)
                }
              </Select>
            </div>
            <p style={{ marginTop: '15px' }}>通过业务数据库API调用生成数据集</p>
          </div>
        </div>
      </div>
      <div className="footer">
        <Button bsStyle="primary" disabled={!data_source_id} onClick={this.handleNext.bind(this)}>下一步</Button>
      </div>
    </div>
  }

  handleNext(e) {
    e.stopPropagation();
    e.nativeEvent && e.nativeEvent.stopPropagation();
    e.preventDefault();
    
    // 引用对象
    this.props.onNext({
      firstProcess: this.state
    })
  }

  handleSelect(option) {
    // 相同
    if (option.value === this.state.data_source_id) {
      return false;
    }

    this.setState({
      data_source_id: option.value
    })

    // 引用赋值
    if (this.props.secondProcess) {
      this.props.secondProcess.tableName = ''
      this.props.secondProcess.paramData = []
      this.props.secondProcess.loaded = true
    }
    // 重新获取参数
    this.props.onGetParamsData(option.value, 'dataset')
    // 清空数据集配置
    this.props.onClearDataset()
  }
}

export default FirstProcess
