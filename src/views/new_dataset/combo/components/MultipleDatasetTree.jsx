import React from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'
import Input from 'react-bootstrap-myui/lib/Input';
import Overlay from 'react-bootstrap-myui/lib/Overlay';
import GroupTree from '../../../../components/GroupTree';

import _ from 'lodash'
import './mutiple-dataset-tree.less'

let _searchTimer = null;

class MultipleDatasetTree extends React.Component {
  static propTypes = {
    onFlterDatasets: PropTypes.func,   //
    onChange: PropTypes.func,          // changge 事件
    activeNode: PropTypes.array,       // 选中的 数据集的 node 节点
    datasetTree: PropTypes.array,      // 下拉数据集数据
  };

  static defaultProps = {
    datasetTree: []
  };

  state = {
    treeUuid: new Date().getTime(),
    keyword: '',
    datasetTreeShow: false,
    activeNode: []
  }

  constructor(props) {
    super(props)
    if (props.activeNode) {
      this.state.activeNode = props.activeNode
    }
  }

  componentDidMount() {
    window.onclick = this.handleCloseOverlay.bind(this)
  }

  componentDidUpdate() {
    // jquery 手动更新样式
    const $targetNode = $(ReactDOM.findDOMNode(this.target))
    const top = $targetNode.offset().top + $targetNode.height() + 12

    $('#multiple-dataset-dialog').css('top', top)
  }

  componentUnmount() {
    window.onclick = null
  }

  componentWillReceiveProps(nextProps) {
    const { activeNode } = this.props

    if (!_.isEqual(nextProps.activeNode, activeNode)) {
      this.setState({
        activeNode: nextProps.activeNode
      })
    }
  }

  render() {
    const { datasetTreeShow, activeNode } = this.state
    return [
      <div key={0} className="multiple-tree-wrap" ref={(instance) => { this.target = instance }} onClick={this.handleShowOverlay.bind(this)}>
        {
          activeNode.map((item, key) => <div className="item" key={key} onClick={this.handleRemove.bind(this, key)}>
            {item.name}
            <div className="delete-btn">
              <i className="dmpicon-add-01"/>
            </div>
          </div>)
        }
      </div>,
      <Overlay
        key={1}
        show={datasetTreeShow}
        onHide={this.handleCloseOverlay.bind(this)}
        placement="bottom"
        container={window.body}
        target={() => ReactDOM.findDOMNode(this.target)}
      >
        {this.renderDatasetTree()}
      </Overlay>
    ]
  }

  renderDatasetTree() {
    const { datasetTree } = this.props
    const { activeNode, treeUuid, keyword } = this.state
    const valid_datasetTree = datasetTree.filter(item => item.hidden === false || item.hidden === undefined)
    const hasDatasetTree = Array.isArray(valid_datasetTree) && valid_datasetTree.length > 0
    // 节点模版
    const nodeTemplate = (node, spread) => {
      const hasSelect = activeNode.findIndex(item => node.id === item.id) > -1
      const disabled = node.type === 'FOLDER'

      return <div className={`file-tree-item file-tree-item-indialog ${disabled ? 'disabled' : ''}`}
        style={this.STYLE_SHEET.container}
        onClick={disabled ? null : this.handleChangeCurrFolder.bind(this, node)}>
        <div className="file-tree-item-icon"
          style={this.STYLE_SHEET.icon}>
          {
            node.type === 'FOLDER' ? (
              <i className={spread ? 'dmpicon-folder-open' : 'dmpicon-folder-close'}></i>
            ) : this.renderDatasetIcon(node)
          }
        </div>
        <div className="file-tree-item-name"
          style={this.STYLE_SHEET.name}>
          {node.name}
          {
            hasSelect && <div className="select-mark">
              <i className="dmpicon-tick"/>
            </div>
          }
        </div>
      </div>
    };
    return <div id="multiple-dataset-dialog" style={this.STYLE_SHEET.overlay} onClick={(e) => { e.nativeEvent && e.nativeEvent.stopPropagation(); }}>
      <div className="dataset-explorer-search-box"
        style={{ padding: '5px 10px', position: 'relative' }}
      >
        <div className="form single-search-form" style={{ width: '100%' }}>
          <Input type="text"
            placeholder="请输入关键字"
            value={keyword}
            onChange={this.handleChangeKeyword.bind(this)}
            addonAfter={<i className="dmpicon-search" />}
            className="search-input-box"
          />
          {
            keyword && <i className="dmpicon-close" onClick={this.handleClearKeyword.bind(this)}></i>
          }
        </div>
      </div>
      {hasDatasetTree ?
        <div>
          <GroupTree
            key={`file-tree-${treeUuid}`}
            data={datasetTree}
            nodeTemplate={nodeTemplate}
            paddingUnit={22}
            nodeHeight={30} />
        </div> :
        <div style={this.STYLE_SHEET.nothing}>暂无文件夹（将创建在根目录下）</div>
      }
    </div>
  }

  // 渲染数据集图标
  renderDatasetIcon(node) {
    const type = node.type ||  '';
    let clsName;

    switch (type) {
      case 'EXCEL':
        clsName = 'dmpicon-excel';
        break;
      case 'LABEL':
        clsName = 'dmpicon-database';
        break;
      case 'SQL':
        clsName = 'dmpicon-sql';
        break;
      case 'API':
        clsName = 'dmpicon-api-dataset';
        break;
      case 'UNION':
        clsName = 'dmpicon-combo-dataset';
        break;
      default:
        clsName = 'dmpicon-dataset';
        break;
    }

    return <i className={clsName} />
  }

  // 输入搜索关键字
  handleChangeKeyword(e) {
    clearTimeout(_searchTimer);

    const searchKeyword = e.target.value;

    this.setState({
      keyword: searchKeyword,
      treeUuid: new Date().getTime()
    });

    _searchTimer = setTimeout(() => {
      this.props.onFlterDatasets(searchKeyword)
    }, 300);
  }

  // 清除搜索关键字
  handleClearKeyword(e) {
    e.nativeEvent && e.nativeEvent.stopPropagation();

    this.props.onFlterDatasets('');

    this.setState({
      keyword: '',
      treeUuid: new Date().getTime()
    });
  }

  handleRemove(index, e) {
    e.nativeEvent && e.nativeEvent.stopPropagation();
    const activeNode = this.state.activeNode
    activeNode.splice(index, 1)

    this.setState({
      activeNode
    })

    this.props.onChange(activeNode)
  }

  handleChangeCurrFolder(node, e) {
    e.nativeEvent && e.nativeEvent.stopPropagation();
    const activeNode = this.state.activeNode
    const currNodeIndex = activeNode.findIndex(item => item.id === node.id)

    if (currNodeIndex > -1) {
      activeNode.splice(currNodeIndex, 1)
    } else {
      activeNode.push(node)
    }

    this.setState({
      activeNode
    })

    this.props.onChange(activeNode)
  }

  handleCloseOverlay(e) {
    e.nativeEvent && e.nativeEvent.stopPropagation();
    this && this.setState({
      datasetTreeShow: false
    })
  }

  handleShowOverlay(e) {
    e.nativeEvent && e.nativeEvent.stopPropagation();
    this.setState({
      datasetTreeShow: true
    })
  }

  STYLE_SHEET = {
    overlay: {
      position: 'absolute',
      width: '490px',
      marginLeft: '0',
      marginTop: '0px',
      minHeight: '100px',
      padding: '5px 0',
      overflow: 'auto',
      maxHeight: '350px'
    },
    nothing: {
      textAlign: 'center',
      lineHeight: '100px',
      color: '#999'
    },
    container: {
      position: 'relative',
      paddingLeft: '24px'
    },
    name: {
      width: '100%',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    },
    icon: {
      position: 'absolute',
      left: '0px',
      top: '0px',
      paddingRight: '10px'
    },
    tickIcon: {
      fontSize: '14px',
      position: 'absolute',
      display: 'block',
      padding: '6px',
      right: '1px',
      top: '2px',
      cursor: 'pointer',
      transition: 'color .3s'
    },
  }
}

export default MultipleDatasetTree
