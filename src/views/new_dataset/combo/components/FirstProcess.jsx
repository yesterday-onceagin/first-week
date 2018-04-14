import React from 'react'
import PropTypes from 'prop-types'

import Button from 'react-bootstrap-myui/lib/Button';
import MultipleDatasetTree from './MultipleDatasetTree';
import _ from 'lodash';

class FirstProcess extends React.Component {
  static propTypes = {
    datasetTree: PropTypes.array,
    onFlterDatasets: PropTypes.func,
    initState: PropTypes.object,
    onNext: PropTypes.func
  };

  state = {
    isEdit: false,
    activeNode: []
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
    const initState = this.props.initState
    if (!_.isEqual(nextProps.initState, initState)) {
      this.setState({
        ...this.state,
        ...nextProps.initState
      })
    }
  }

  render() {
    const { datasetTree, onFlterDatasets } = this.props
    const { activeNode } = this.state
    const disabled = !activeNode || activeNode.length == 0

    // 过滤掉 field 字段
    const newDatasetTree = datasetTree.slice()
    this.filterDatasetField(newDatasetTree)

    return <div className="combo-main form">
      <div className="main-wrap">
        <div className="row">
          <div className="col-md-2 col-label">
            选择数据集 :
          </div>
          <div className="col-md-8">
            <MultipleDatasetTree
              datasetTree={newDatasetTree}
              activeNode={activeNode}
              onFlterDatasets={onFlterDatasets}
              onChange={this.handleChange.bind(this)}
            />
          </div>
        </div>
      </div>
      <div className="footer">
        <Button bsStyle="primary" disabled={disabled} onClick={this.handleNext.bind(this)}>下一步</Button>
      </div>
    </div>
  }

  handleChange(activeNode) {
    this.setState({
      activeNode
    })
  }

  handleNext() {
    this.props.onNext({
      firstProcess: this.state
    })
  }

  filterDatasetField(datasetTree) {
    datasetTree.forEach((item) => {
      // sub 存在. 并且 不是文件夹
      if (item.sub.length > 0) {
        if (item.type !== 'FOLDER') {
          item.sub = []
        } else {
          this.filterDatasetField(item.sub)
        }
      }
    })
  }
}

export default FirstProcess
