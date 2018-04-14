import React from 'react'
import PropTypes from 'prop-types'
import Input from 'react-bootstrap-myui/lib/Input'
import Button from 'react-bootstrap-myui/lib/Button'
import ExcelThirdProcess from '../../excel/components/ThirdProcess'
import _ from 'lodash';

class ThirdProcess extends ExcelThirdProcess {
  static propTypes = {
    savePending: PropTypes.bool,
    folderTree: PropTypes.array,
    flowList: PropTypes.array,
    onSearch: PropTypes.func,
    onPrev: PropTypes.func,
    onSave: PropTypes.func,
    onAddFolder: PropTypes.func,
    onRemoveTempFolders: PropTypes.func
  }

  constructor(props) {
    super(props)
    this.state = {
      ...this.state,
      isEdit: false,
      name: '',
      path: '/ ',
      folderTreeshow: false
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
    const { name, path, isEdit } = this.state
    const { savePending } = this.props
    const disabled = !path || !name || savePending
    
    return <div className="sql-main form">
      <div className="main-wrap">
        {super.renderPath()}
        <div className="row">
          <div className="col-md-2 col-label">
            保存名称 :
          </div>
          <div className="col-md-8">
            <Input
              type="text"
              value={name}
              disabled={isEdit}
              placeholder="请输入数据集名称"
              onChange={this.handleChange.bind(this)}
            />
          </div>
        </div>
      </div>
      <div className="footer">
        <Button onClick={this.handlePrev.bind(this)}>上一步</Button>
        <Button bsStyle="primary" onClick={this.handleSave.bind(this)} loading={savePending} disabled={disabled}>保存</Button>
      </div>
    </div>
  }

  handleChange(e) {
    this.setState({
      name: e.target.value
    })
  }

  handlePrev(e) {
    e.stopPropagation();
    e.nativeEvent && e.nativeEvent.stopPropagation();
    e.preventDefault();

    this.setState({
      folderTreeshow: false
    })

    this.props.onPrev({
      thirdProcess: this.state
    })
  }

  handleSave(e) {
    e.stopPropagation();
    e.nativeEvent && e.nativeEvent.stopPropagation();
    e.preventDefault();

    this.setState({ folderTreeshow: false })

    this.props.onSave({ thirdProcess: this.state })
  }
}

export default ThirdProcess
