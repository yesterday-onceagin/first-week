import React from 'react'
import PropTypes from 'prop-types'

import Button from 'react-bootstrap-myui/lib/Button';
import { Select as TreeSelect, Tree } from 'rt-tree'
import { convertFolderTree } from '../../../dataview/utils/treeDataHelper'
import _ from 'lodash';
import 'rt-tree/dist/css/rt-select.css'
import './style.less'

const _getIconByDataType = function (type = '') {
  type = type.toLowerCase()
  switch (type) {
    case 'mysofterp':
      return 'dmpicon-erp'
    case 'mysql':
      return 'dmpicon-mysql'
    case 'datahub':
      return 'dmpicon-datahub'
    default:
      return ''
  }
}

const _generateDataTypeIcon = function (item) {
  const cn = _getIconByDataType(item.type)
  return <i style={{ marginRight: '10px', fontSize: '16px' }} className={cn} />
}

class FirstProcess extends React.Component {
  static propTypes = {
    datasourceList: PropTypes.array,
    initState: PropTypes.object,
    secondProcess: PropTypes.object,
    style: PropTypes.object,
    tableList: PropTypes.array,
    onNext: PropTypes.func,
    onClearDataset: PropTypes.func,
    onFetchTableSilent: PropTypes.func,
    onShowError: PropTypes.func,
  };

  state = {
    isEdit: false,
    data_source_id: '',
    testPending: false,
  }

  constructor(props) {
    super(props);
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
    const { data_source_id, testPending } = this.state
    const convertedList = convertFolderTree(datasourceList) || []

    return <div className="sql-main form" style={style}>
      <div className="main-wrap">
        <div className="row">
          <div className="col-md-2 col-label">
            选择数据源 :
          </div>
          <div className="col-md-8">
            <div className="input-wrap datasouce-select">
              <TreeSelect
                search
                style={{ width: '100%' }}
                menuStyle={{ width: '100%', maxHeight: 250 }}
              >
                <Tree
                  data={convertedList}
                  selected={[data_source_id]}
                  customerIcon={_generateDataTypeIcon}
                  onChange={this.handleSelect.bind(this)}
                />
              </TreeSelect>
            </div>
            <p style={{ marginTop: '15px' }}>以SQL语句访问数据库，可创建多种数据库的数据集或存储过程</p>
          </div>
        </div>
      </div>
      <div className="footer">
        <Button bsStyle="primary" loading={testPending} disabled={!data_source_id} onClick={this.handleNext.bind(this)}>下一步</Button>
      </div>
    </div>
  }

  handleNext(e) {
    const { onFetchTableSilent, onNext, onShowError } = this.props
    let firstProcess = this.state
    e.stopPropagation();
    e.nativeEvent && e.nativeEvent.stopPropagation();
    e.preventDefault();

    this.setState({
      testPending: true,
    })
    // 测试链接数据源
    onFetchTableSilent(firstProcess.data_source_id, { page: 1, page_size: 1 }, (json) => {
      if (json.result) {
        const dataTypes = this.getTypes(firstProcess.data_source_id)
        firstProcess = {
          ...firstProcess,
          ...dataTypes
        }
        
        // 引用对象
        onNext({
          firstProcess
        })
      } else {
        onShowError(json.msg || '数据源链接失败，请检查该数据源')
        this.setState({
          testPending: false,
        })
      }
    })
  }

  handleSelect(ids) {
    // 相同
    const id = ids[0]
    if (id === this.state.data_source_id) {
      return false;
    }

    this.setState({
      data_source_id: id,
    })

    // 引用赋值
    if (this.props.secondProcess) {
      this.props.secondProcess.sql = ''
      this.props.secondProcess.loaded = true
    }
   
    this.props.onClearDataset()
  }

  getDataSourceInfo(id) {
    const { datasourceList } = this.props
    for (let i = 0, l = datasourceList.length; i < l; i++) {
      const source = datasourceList[i]
      if (source.id === id) {
        return source
      }
    }
  }

  getTypes(id) {
    const { datasourceList } = this.props
    const types = {
      data_source_type: '',
      data_base_type: '',
    }
    for (let i = 0, l = datasourceList.length; i < l; i++) {
      const source = datasourceList[i]
      if (source.id === id) {
        // 目前只有异构数据源有这个参数, 标识是mysql 或者 oracle
        if (source.conn_str) {
          types.data_base_type = JSON.parse(source.conn_str).data_base_type
        }
        types.data_source_type = source.type
        break
      }
    }
    return types
  }
}

export default FirstProcess
